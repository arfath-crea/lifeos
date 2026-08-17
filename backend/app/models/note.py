from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class NoteFolder(Base):
    __tablename__ = "note_folders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, default="folder")
    parent_folder_id = Column(Integer, ForeignKey("note_folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="note_folders")
    notes = relationship("Note", back_populates="folder", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(Integer, ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    tags = Column(String, default="")  # comma separated
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    user = relationship("User", back_populates="notes")
    folder = relationship("NoteFolder", back_populates="notes")
