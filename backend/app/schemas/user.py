from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.roles import UserRole


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    department: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    role: UserRole
    department: str
    created_at: datetime
    is_active: bool
    
class UserUpdate(BaseModel):
    is_active: bool        
