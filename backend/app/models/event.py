from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String, default="Event")  # Exam, Meeting, Appointment, Birthday, Deadline, Event
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)
    is_all_day = Column(Boolean, default=False)
    color = Column(String, default="#3b82f6")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    user = relationship("User", back_populates="events")
