from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class ExpenseBase(BaseModel):
    title: str
    amount: float
    transaction_type: str = "EXPENSE"  # EXPENSE, INCOME
    category: str = "Other"
    payment_method: str = "UPI"
    date: datetime
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    date: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    notes: Optional[str] = None

class ExpenseOut(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CategorySpending(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int

class ExpenseSummary(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    monthly_budget: float
    budget_used_percentage: float
    categories: List[CategorySpending]
    recent_transactions: List[ExpenseOut]
