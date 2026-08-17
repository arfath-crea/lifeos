from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "MEDIUM"
    source_module: str = "CUSTOM"
    source_id: Optional[int] = None
    is_completed: bool = False
    snoozed_until: Optional[datetime] = None

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None
    snoozed_until: Optional[datetime] = None

class ReminderOut(ReminderBase):
    id: int
    user_id: int
    created_at: datetime
    is_overdue: Optional[bool] = False

    class Config:
        from_attributes = True
