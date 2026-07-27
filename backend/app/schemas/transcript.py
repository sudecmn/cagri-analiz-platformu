from pydantic import BaseModel, Field
from datetime import date
from uuid import UUID

class TranscriptCreate(BaseModel):
    content: str = Field(min_length=1)
    call_date: date


class TranscriptOut(BaseModel):
    id: UUID
    user_id: UUID
    call_date: date
    masked_content: str