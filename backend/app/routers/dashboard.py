from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.event import Event
from app.models.reminder import Reminder
from app.models.goal import Goal
from app.schemas.dashboard import DashboardSummary
from app.services.briefing_service import BriefingService
from app.routers.deps import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummary)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    briefing_data = BriefingService.generate_daily_briefing(db, current_user)
    
    # Priority tasks (urgent or high priority or due today)
    now = datetime.now(timezone.utc)
    priority_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status != "COMPLETED"
    ).order_by(
        Task.priority.desc(),
        Task.due_date.asc().nullslast()
    ).limit(8).all()
    
    # Upcoming 7 days events
    week_end = now + timedelta(days=7)
    upcoming_events = db.query(Event).filter(
        Event.user_id == current_user.id,
        Event.start_time >= (now - timedelta(hours=6)),
        Event.start_time <= week_end
    ).order_by(Event.start_time.asc()).limit(6).all()
    
    # Pending reminders
    pending_reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.is_completed == False
    ).order_by(Reminder.due_date.asc()).limit(6).all()
    
    # Active goals
    active_goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.status == "ACTIVE"
    ).limit(4).all()
    
    return DashboardSummary(
        greeting=briefing_data["greeting"],
        date_str=briefing_data["date_str"],
        metrics=briefing_data["metrics"],
        ai_briefing=briefing_data["ai_briefing"],
        ai_insights=briefing_data["ai_insights"],
        priority_tasks=priority_tasks,
        upcoming_events=upcoming_events,
        pending_reminders=pending_reminders,
        active_goals=active_goals,
        recent_spending_total=briefing_data["recent_spending_total"],
        monthly_budget=briefing_data["monthly_budget"],
        study_progress_summary=briefing_data["study_progress_summary"]
    )
