from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.roles import UserRole
from app.models.evaluation import Evaluation
from app.models.transcript import Transcript
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.evaluation import EvaluationCreate, EvaluationOut

router = APIRouter(prefix="/transcripts", tags=["evaluations"])


@router.post("/{transcript_id}/evaluation", response_model=EvaluationOut, status_code=status.HTTP_201_CREATED)
def create_evaluation(
    transcript_id: str,
    evaluation: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.agent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece supervisor veya admin değerlendirme yapabilir.",
        )

    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transkript bulunamadı.")

    existing = db.query(Evaluation).filter(Evaluation.transcript_id == transcript_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu transkript zaten değerlendirilmiş.")

    new_evaluation = Evaluation(
        transcript_id=transcript_id,
        supervisor_id=current_user.id,
        quality_score=evaluation.quality_score,
        notes=evaluation.notes,
    )
    db.add(new_evaluation)
    db.commit()
    db.refresh(new_evaluation)

    return new_evaluation


@router.get("/{transcript_id}/evaluation", response_model=EvaluationOut)
def get_evaluation(
    transcript_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transkript bulunamadı.")

    if current_user.role == UserRole.agent and transcript.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu transkripte erişim yetkiniz yok.")

    evaluation = db.query(Evaluation).filter(Evaluation.transcript_id == transcript_id).first()
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu transkript için değerlendirme yok.")
    return evaluation