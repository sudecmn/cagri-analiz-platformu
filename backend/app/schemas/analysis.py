from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AnalysisOut(BaseModel):
    id: UUID
    transcript_id: UUID
    status: str
    summary: str | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    topic: str | None = None
    keywords: list[str] | None = None
    created_at: datetime | None = None