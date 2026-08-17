from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "Event"
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: bool = False
    color: Optional[str] = "#3b82f6"

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    color: Optional[str] = None

class EventOut(EventBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
