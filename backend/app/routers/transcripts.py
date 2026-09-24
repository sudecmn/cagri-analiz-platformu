import logging
import os
import shutil
import tempfile
from io import BytesIO

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from openpyxl import Workbook

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

from sqlalchemy.orm import Session

from app.core.ai_service import analyze_transcript, convert_to_mp3, transcribe_audio
from app.core.database import SessionLocal, get_db
from app.core.masking import mask_sensitive_data
from app.core.roles import UserRole
from app.core.security import verify_api_key
from app.models.analysis import Analysis
from app.models.evaluation import Evaluation
from app.models.transcript import Transcript
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.analysis import AnalysisOut
from app.schemas.transcript import TranscriptCreate, TranscriptOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transcripts", tags=["transcripts"])


@router.post("", response_model=TranscriptOut, status_code=status.HTTP_202_ACCEPTED)
def upload_transcript(
    transcript: TranscriptCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    masked = mask_sensitive_data(transcript.content)

    new_transcript = Transcript(
        user_id=current_user.id,
        masked_content=masked,
        call_date=transcript.call_date,
    )
    db.add(new_transcript)
    db.commit()
    db.refresh(new_transcript)

    new_analysis = Analysis(
        transcript_id=new_transcript.id,
        status="pending",
    )
    db.add(new_analysis)
    db.commit()
    
    background_tasks.add_task(run_analysis, new_transcript.id)


    return new_transcript

def process_audio_upload(audio: UploadFile, call_date: str, user_id, db: Session, background_tasks: BackgroundTasks):
    file_extension = os.path.splitext(audio.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    converted_path = tmp_path + "_converted.mp3"

    try:
        convert_to_mp3(tmp_path, converted_path)
        raw_text = transcribe_audio(converted_path)
    finally:
        os.remove(tmp_path)
        if os.path.exists(converted_path):
            os.remove(converted_path)

    masked = mask_sensitive_data(raw_text)

    new_transcript = Transcript(
        user_id=user_id,
        masked_content=masked,
        call_date=call_date,
    )
    db.add(new_transcript)
    db.commit()
    db.refresh(new_transcript)

    new_analysis = Analysis(transcript_id=new_transcript.id, status="pending")
    db.add(new_analysis)
    db.commit()

    background_tasks.add_task(run_analysis, new_transcript.id)

    return new_transcript

@router.post("/upload-audio", response_model=TranscriptOut, status_code=status.HTTP_202_ACCEPTED)
def upload_audio_transcript(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    call_date: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return process_audio_upload(audio, call_date, current_user.id, db, background_tasks)

@router.post("/external-upload", response_model=TranscriptOut, status_code=status.HTTP_202_ACCEPTED)
def external_upload_audio(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    call_date: str = Form(...),
    agent_email: str = Form(...),
    db: Session = Depends(get_db),
    _: None = Depends(verify_api_key),
):
    agent = db.query(User).filter(User.email == agent_email).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Belirtilen e-postaya sahip temsilci bulunamadı.")

    return process_audio_upload(audio, call_date, agent.id, db, background_tasks)

@router.get("/export/excel")
def export_transcripts_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wb = Workbook()
    ws = wb.active
    ws.title = "Transkriptler"

    ws.append(["Tarih", "İçerik", "Durum", "Duygu", "Konu"])

    query = db.query(Transcript, Analysis).outerjoin(
        Analysis, Analysis.transcript_id == Transcript.id
    )
    if current_user.role == UserRole.agent:
        query = query.filter(Transcript.user_id == current_user.id)

    for t, analysis in query.all():
        ws.append([
            str(t.call_date),
            t.masked_content,
            analysis.status if analysis else "yok",
            analysis.sentiment if analysis else "",
            analysis.topic if analysis else "",
        ])

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transkriptler.xlsx"},
    )

@router.get("", response_model=list[TranscriptOut])
def list_transcripts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transcript)
    if current_user.role == UserRole.agent:
        query = query.filter(Transcript.user_id == current_user.id)
    return query.all()

@router.get("/search", response_model=list[TranscriptOut])
def search_transcripts(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transcript).filter(Transcript.masked_content.ilike(f"%{q}%"))
    if current_user.role == UserRole.agent:
        query = query.filter(Transcript.user_id == current_user.id)
    return query.all()

@router.get("/{transcript_id}/export/pdf")
def export_transcript_pdf(
    transcript_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transkript bulunamadı.")

    if current_user.role == UserRole.agent and transcript.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu transkripte erişim yetkiniz yok.")

    analysis = db.query(Analysis).filter(Analysis.transcript_id == transcript_id).first()
    evaluation = db.query(Evaluation).filter(Evaluation.transcript_id == transcript_id).first()

    fonts_dir = os.path.join(os.path.dirname(__file__), "..", "fonts")
    pdfmetrics.registerFont(TTFont("DejaVuSans", os.path.join(fonts_dir, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", os.path.join(fonts_dir, "DejaVuSans-Bold.ttf")))
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    styles["Normal"].fontName = "DejaVuSans"
    styles["Title"].fontName = "DejaVuSans-Bold"
    styles["Heading2"].fontName = "DejaVuSans-Bold"

    elements.append(Paragraph("Çağrı Detay Raporu", styles["Title"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(f"Tarih: {transcript.call_date}", styles["Normal"]))
    elements.append(Paragraph(f"Transkript: {transcript.masked_content}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    if analysis:
        elements.append(Paragraph("Yapay Zeka Analizi", styles["Heading2"]))
        elements.append(Paragraph(f"Özet: {analysis.summary}", styles["Normal"]))
        elements.append(Paragraph(f"Duygu: {analysis.sentiment} ({analysis.sentiment_score})", styles["Normal"]))
        elements.append(Paragraph(f"Konu: {analysis.topic}", styles["Normal"]))
        elements.append(Spacer(1, 12))

    if evaluation:
        elements.append(Paragraph("Süpervizör Değerlendirmesi", styles["Heading2"]))
        elements.append(Paragraph(f"Performans Puanı: {evaluation.quality_score}", styles["Normal"]))
        elements.append(Paragraph(f"Notlar: {evaluation.notes or '-'}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cagri-{transcript_id}.pdf"},
    )

@router.get("/{transcript_id}/analysis", response_model=AnalysisOut)
def get_analysis(
    transcript_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transkript bulunamadı.")

    if current_user.role == UserRole.agent and transcript.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu transkripte erişim yetkiniz yok.")

    analysis = db.query(Analysis).filter(Analysis.transcript_id == transcript_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")

    return analysis

@router.post("/{transcript_id}/retry-analysis", response_model=AnalysisOut)
def retry_analysis(
    transcript_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transkript bulunamadı.")

    if current_user.role == UserRole.agent and transcript.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu transkripte erişim yetkiniz yok.")

    analysis = db.query(Analysis).filter(Analysis.transcript_id == transcript_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analiz bulunamadı")

    analysis.status = "pending"
    db.commit()
    db.refresh(analysis)

    background_tasks.add_task(run_analysis, transcript_id)

    return analysis

def run_analysis(transcript_id):
    db = SessionLocal()
    try:
        transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
        analysis = db.query(Analysis).filter(Analysis.transcript_id == transcript_id).first()

        try:
            result = analyze_transcript(transcript.masked_content)
            analysis.summary = result["summary"]
            analysis.sentiment = result["sentiment"]
            analysis.sentiment_score = result["sentiment_score"]
            analysis.topic = result["topic"]
            analysis.keywords = result["keywords"]
            analysis.status = "completed"
        except Exception as e:
            logger.error("ANALİZ HATASI: %s", repr(e))
            analysis.status = "failed"

        db.commit()
    finally:
        db.close()