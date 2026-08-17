from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut, ExpenseSummary, CategorySpending
from app.routers.deps import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseOut])
def get_expenses(
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    if transaction_type:
        query = query.filter(Expense.transaction_type == transaction_type)
    return query.order_by(Expense.date.desc(), Expense.created_at.desc()).all()

@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_records = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date >= first_of_month
    ).all()
    
    total_income = sum(e.amount for e in monthly_records if e.transaction_type == "INCOME")
    total_expense = sum(e.amount for e in monthly_records if e.transaction_type == "EXPENSE")
    net_savings = total_income - total_expense
    
    budget = current_user.monthly_budget or 20000.0
    budget_used = (total_expense / budget) * 100 if budget > 0 else 0.0
    
    # Category spending breakdown
    cat_map = {}
    cat_counts = {}
    for e in monthly_records:
        if e.transaction_type == "EXPENSE":
            cat_map[e.category] = cat_map.get(e.category, 0.0) + e.amount
            cat_counts[e.category] = cat_counts.get(e.category, 0) + 1
            
    categories = []
    for cat, amt in cat_map.items():
        pct = (amt / total_expense * 100) if total_expense > 0 else 0.0
        categories.append(CategorySpending(
            category=cat,
            amount=amt,
            percentage=round(pct, 1),
            count=cat_counts[cat]
        ))
    categories.sort(key=lambda x: x.amount, reverse=True)
    
    recent = db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.desc()).limit(10).all()
    
    return ExpenseSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        monthly_budget=budget,
        budget_used_percentage=round(budget_used, 1),
        categories=categories,
        recent_transactions=recent
    )

@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = Expense(
        user_id=current_user.id,
        title=exp_in.title,
        amount=exp_in.amount,
        transaction_type=exp_in.transaction_type,
        category=exp_in.category,
        payment_method=exp_in.payment_method,
        date=exp_in.date,
        is_recurring=exp_in.is_recurring,
        recurring_frequency=exp_in.recurring_frequency,
        notes=exp_in.notes
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    exp_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    for key, value in exp_in.dict(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    db.delete(expense)
    db.commit()
    return None
