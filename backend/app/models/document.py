from sqlalchemy import Column, Integer, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class DocumentVault(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)  # e.g., "Passport", "Driver's License", "Degree Certificate"
    category = Column(String, default="Identity")  # Identity, Academic, Financial, Medical, Vehicle, Legal, Other
    document_number = Column(String, nullable=True)  # Masked or encrypted reference
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    reminder_days_before = Column(Integer, default=30)  # Notify X days before expiry
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)  # bytes
    notes = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    user = relationship("User", back_populates="documents")
