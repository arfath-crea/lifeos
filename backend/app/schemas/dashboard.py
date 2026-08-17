from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.schemas.task import TaskOut
from app.schemas.event import EventOut
from app.schemas.reminder import ReminderOut
from app.schemas.goal import GoalOut

class MetricCard(BaseModel):
    label: str
    value: str
    subtext: str
    trend: Optional[str] = None
    color: Optional[str] = None

class DashboardSummary(BaseModel):
    greeting: str
    date_str: str
    metrics: List[MetricCard]
    ai_briefing: str
    ai_insights: List[str]
    priority_tasks: List[TaskOut]
    upcoming_events: List[EventOut]
    pending_reminders: List[ReminderOut]
    active_goals: List[GoalOut]
    recent_spending_total: float
    monthly_budget: float
    study_progress_summary: Dict[str, Any]
