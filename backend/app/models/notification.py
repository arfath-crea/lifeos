from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="INFO")  # INFO, WARNING, ALERT, SUCCESS
    source_module = Column(String, default="SYSTEM")  # TASKS, CALENDAR, EXPENSES, DOCUMENTS, STUDY, GOALS, SYSTEM
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="notifications")
