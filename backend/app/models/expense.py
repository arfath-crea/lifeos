from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, default="EXPENSE")  # EXPENSE, INCOME
    category = Column(String, default="Other")  # Food, Transport, Education, Rent, Utilities, Entertainment, Health, Shopping, Other
    payment_method = Column(String, default="UPI")  # UPI, Credit Card, Debit Card, Cash, Net Banking
    date = Column(DateTime, default=utcnow)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String, nullable=True)  # daily, weekly, monthly
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="expenses")
