from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)  # e.g., "Java", "Computer Networks", "Database Systems"
    code = Column(String, nullable=True)  # e.g., "CS-301"
    color = Column(String, default="#6366f1")
    exam_date = Column(DateTime, nullable=True)
    target_hours = Column(Integer, default=20)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)  # e.g., "OOP & Polymorphism", "Inheritance", "Interfaces"
    mastery_percentage = Column(Integer, default=0)  # 0 to 100
    difficulty = Column(String, default="MEDIUM")  # EASY, MEDIUM, HARD
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    subject = relationship("Subject", back_populates="topics")
    study_sessions = relationship("StudySession", back_populates="topic", cascade="all, delete-orphan")

class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    duration_minutes = Column(Integer, default=25)  # Pomodoro default
    notes = Column(Text, nullable=True)
    session_type = Column(String, default="pomodoro")  # pomodoro, revision, practice, deep_work
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="study_sessions")
    subject = relationship("Subject", back_populates="study_sessions")
    topic = relationship("Topic", back_populates="study_sessions")
