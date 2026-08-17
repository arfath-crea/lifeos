from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)  # e.g., "Become a Software Engineer", "Clear Semester with 9+ GPA"
    description = Column(Text, nullable=True)
    category = Column(String, default="Career")  # Career, Education, Health, Finance, Personal
    target_date = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, COMPLETED, ON_HOLD
    progress_percentage = Column(Integer, default=0)  # 0 to 100
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    user = relationship("User", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan", order_by="Milestone.order_index")
    tasks = relationship("Task", back_populates="goal")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)  # e.g., "Master Python & Algorithms", "Build 3 Full-Stack Projects"
    target_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    progress_percentage = Column(Integer, default=0)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    
    goal = relationship("Goal", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone")
