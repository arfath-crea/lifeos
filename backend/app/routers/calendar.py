from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.task import Task
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/events", response_model=List[EventOut])
def get_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.user_id == current_user.id)
    if start:
        query = query.filter(Event.start_time >= start)
    if end:
        query = query.filter(Event.start_time <= end)
    return query.order_by(Event.start_time.asc()).all()

@router.get("/integrated")
def get_integrated_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns calendar events AND tasks with due dates in a single integrated feed."""
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month
    
    events = db.query(Event).filter(Event.user_id == current_user.id).order_by(Event.start_time.asc()).all()
    tasks_with_deadlines = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.due_date != None
    ).all()
    
    calendar_items = []
    for ev in events:
        calendar_items.append({
            "id": f"event-{ev.id}",
            "raw_id": ev.id,
            "title": ev.title,
            "description": ev.description,
            "item_type": "EVENT",
            "event_type": ev.event_type,
            "start_time": ev.start_time.isoformat(),
            "end_time": ev.end_time.isoformat() if ev.end_time else None,
            "location": ev.location,
            "color": ev.color or "#3b82f6",
            "is_all_day": ev.is_all_day
        })
        
    for t in tasks_with_deadlines:
        color = "#ef4444" if t.priority == "URGENT" else ("#f59e0b" if t.priority == "HIGH" else "#10b981")
        calendar_items.append({
            "id": f"task-{t.id}",
            "raw_id": t.id,
            "title": f"Deadline: {t.title}",
            "description": t.description,
            "item_type": "TASK_DEADLINE",
            "event_type": "Deadline",
            "start_time": t.due_date.isoformat(),
            "end_time": None,
            "location": None,
            "color": color,
            "is_all_day": True,
            "is_completed": t.status == "COMPLETED",
            "priority": t.priority
        })
        
    return {
        "year": target_year,
        "month": target_month,
        "items": calendar_items
    }

@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = Event(
        user_id=current_user.id,
        title=event_in.title,
        description=event_in.description,
        event_type=event_in.event_type,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location=event_in.location,
        is_all_day=event_in.is_all_day,
        color=event_in.color or "#3b82f6"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.patch("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event_in.dict(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return None
