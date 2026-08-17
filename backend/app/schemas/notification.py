from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    source_module: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
