from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)  # e.g., "Electricity bill due tomorrow", "Passport expires in 90 days"
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    source_module = Column(String, default="CUSTOM")  # TASK, DOCUMENT, EXAM, EXPENSE, CUSTOM
    source_id = Column(Integer, nullable=True)
    is_completed = Column(Boolean, default=False)
    snoozed_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="reminders")
