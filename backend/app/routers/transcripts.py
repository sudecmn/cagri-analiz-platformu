from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.masking import mask_sensitive_data
from app.core.roles import UserRole
from app.models.analysis import Analysis
from app.models.transcript import Transcript
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.transcript import TranscriptCreate, TranscriptOut

router = APIRouter(prefix="/transcripts", tags=["transcripts"])


@router.post("", response_model=TranscriptOut, status_code=status.HTTP_202_ACCEPTED)
def upload_transcript(
    transcript: TranscriptCreate,
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