from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    theme: Optional[str] = None
    monthly_budget: Optional[float] = None
    study_daily_target_minutes: Optional[int] = None
    avatar_url: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    currency: str
    theme: str
    monthly_budget: float
    study_daily_target_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()
