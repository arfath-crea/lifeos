from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderOut])
def get_reminders(
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if completed is not None:
        query = query.filter(Reminder.is_completed == completed)
        
    now = datetime.now(timezone.utc)
    reminders = query.order_by(Reminder.due_date.asc()).all()
    
    results = []
    for r in reminders:
        r_due = r.due_date
        if r_due.tzinfo is None:
            r_due = r_due.replace(tzinfo=timezone.utc)
        is_over = (r_due < now and not r.is_completed)
        r_out = ReminderOut.from_orm(r)
        r_out.is_overdue = is_over
        results.append(r_out)
    return results

@router.post("", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    rem_in: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = Reminder(
        user_id=current_user.id,
        title=rem_in.title,
        description=rem_in.description,
        due_date=rem_in.due_date,
        priority=rem_in.priority,
        source_module=rem_in.source_module,
        source_id=rem_in.source_id,
        is_completed=rem_in.is_completed,
        snoozed_until=rem_in.snoozed_until
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/toggle", response_model=ReminderOut)
def toggle_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.is_completed = not reminder.is_completed
    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/snooze", response_model=ReminderOut)
def snooze_reminder(
    reminder_id: int,
    days: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.due_date = reminder.due_date + timedelta(days=days)
    reminder.snoozed_until = datetime.now(timezone.utc) + timedelta(days=days)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return None
