from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

class EvaluationCreate(BaseModel):
    quality_score: int | None = None
    notes: str | None = None

class EvaluationOut(BaseModel):
    id: UUID
    transcript_id: UUID
    quality_score: int | None = None
    supervisor_id: UUID
    notes: str | None = None
    created_at: datetime | None = None