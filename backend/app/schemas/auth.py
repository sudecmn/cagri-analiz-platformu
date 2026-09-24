from pydantic import BaseModel
from app.core.roles import UserRole

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    name: str