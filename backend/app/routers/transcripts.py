from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.ai_service import analyze_transcript
from app.core.database import SessionLocal, get_db
from app.core.masking import mask_sensitive_data
from app.core.roles import UserRole
from app.models.analysis import Analysis
from app.models.transcript import Transcript
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.transcript import TranscriptCreate, TranscriptOut
from app.schemas.analysis import AnalysisOut

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


@router.get("", response_model=list[TranscriptOut])
def list_transcripts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transcript)
    if current_user.role == UserRole.agent:
        query = query.filter(Transcript.user_id == current_user.id)
    return query.all()


@router.get("/{transcript_id}/analysis", response_model=AnalysisOut)
def get_analysis(
    transcript_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.query(Analysis).filter(Analysis.transcript_id == transcript_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")

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
        except Exception:
            analysis.status = "failed"

        db.commit()
    finally:
        db.close()