from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    category: str = "Identity"
    document_number: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    reminder_days_before: int = 30
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    notes: Optional[str] = None
    is_verified: bool = True

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    document_number: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    reminder_days_before: Optional[int] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    notes: Optional[str] = None
    is_verified: Optional[bool] = None

class DocumentOut(DocumentBase):
    id: int
    user_id: int
    days_to_expiry: Optional[int] = None
    expiry_status: str = "VALID"  # VALID, EXPIRING_SOON, EXPIRED, NO_EXPIRY
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
