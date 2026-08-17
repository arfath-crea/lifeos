from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="TODO")  # TODO, IN_PROGRESS, COMPLETED
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    due_date = Column(DateTime, nullable=True)
    category = Column(String, default="General")  # Academics, Work, Personal, Finance, etc.
    tags = Column(String, default="")  # comma separated
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String, nullable=True)  # daily, weekly, monthly
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    goal = relationship("Goal", back_populates="tasks")
    milestone = relationship("Milestone", back_populates="tasks")

class Subtask(Base):
    __tablename__ = "subtasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    
    task = relationship("Task", back_populates="subtasks")
