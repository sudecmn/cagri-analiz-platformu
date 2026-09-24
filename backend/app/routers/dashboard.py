from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.roles import UserRole
from app.models.analysis import Analysis
from app.models.transcript import Transcript
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transcript_query = db.query(Transcript)
    analysis_query = db.query(Analysis).join(Transcript, Analysis.transcript_id == Transcript.id)

    if current_user.role == UserRole.agent:
        transcript_query = transcript_query.filter(Transcript.user_id == current_user.id)
        analysis_query = analysis_query.filter(Transcript.user_id == current_user.id)

    total_calls = transcript_query.with_entities(func.count(Transcript.id)).scalar()

    avg_score = analysis_query.with_entities(func.avg(Analysis.sentiment_score)).scalar()

    sentiment_rows = (
        analysis_query
        .with_entities(Analysis.sentiment, func.count(Analysis.id))
        .group_by(Analysis.sentiment)
        .all()
    )
    sentiment_distribution = {sentiment: count for sentiment, count in sentiment_rows}

    topic_rows = (
        analysis_query
        .with_entities(Analysis.topic, func.count(Analysis.id).label("count"))
        .group_by(Analysis.topic)
        .order_by(func.count(Analysis.id).desc())
        .limit(5)
        .all()
    )
    top_topics = [{"topic": topic, "count": count} for topic, count in topic_rows]

    transcripts = transcript_query.with_entities(Transcript.masked_content).all()

    mask_labels = ["[TCKN_GİZLENDİ]", "[TELEFON_GİZLENDİ]", "[IBAN_GİZLENDİ]"]
    masked_data_count = sum(
    content.count(label)
    for (content,) in transcripts
    for label in mask_labels
)

    return {
        "total_calls": total_calls,
        "avg_sentiment_score": avg_score,
        "sentiment_distribution": sentiment_distribution,
        "top_topics": top_topics,
        "masked_data_count": masked_data_count
    }