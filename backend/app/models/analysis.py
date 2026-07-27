import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transcript_id = Column(UUID(as_uuid=True), ForeignKey("transcripts.id"), unique=True, nullable=False)
    status = Column(Enum("pending", "completed", "failed", name="analysis_status"), nullable=False, default="pending")
    summary = Column(String, nullable=True)
    sentiment = Column(Enum("positive", "negative", "neutral", name="sentiment"), nullable=True)
    sentiment_score = Column(Numeric(precision=10, scale=2), nullable=True)
    topic = Column(String, nullable=True)
    keywords = Column(JSONB, nullable=True)
    kvkk_detected = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())