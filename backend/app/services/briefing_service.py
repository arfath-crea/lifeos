from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.task import Task
from app.models.event import Event
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.study import Subject, Topic, StudySession
from app.models.reminder import Reminder
from app.models.document import DocumentVault

def to_naive(dt: datetime) -> datetime:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

class BriefingService:
    @staticmethod
    def generate_daily_briefing(db: Session, user: User) -> dict:
        now_utc = datetime.now(timezone.utc)
        now_naive = datetime.utcnow()
        today_start = now_naive.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = now_naive + timedelta(days=7)
        
        # Greeting based on time of day
        hour = now_utc.hour
        if 5 <= hour < 12:
            greeting = f"Good morning, {user.full_name.split()[0]} 👋"
        elif 12 <= hour < 17:
            greeting = f"Good afternoon, {user.full_name.split()[0]} ☀️"
        elif 17 <= hour < 22:
            greeting = f"Good evening, {user.full_name.split()[0]} 🌆"
        else:
            greeting = f"Hello night owl, {user.full_name.split()[0]} 🌙"

        # Tasks stats
        all_tasks = db.query(Task).filter(Task.user_id == user.id).all()
        pending_tasks = [t for t in all_tasks if t.status != "COMPLETED"]
        urgent_tasks = [t for t in pending_tasks if t.priority in ["HIGH", "URGENT"]]
        completed_today = [t for t in all_tasks if t.status == "COMPLETED" and t.completed_at and to_naive(t.completed_at) >= today_start]
        
        # Upcoming 7-day deadlines & events
        all_events = db.query(Event).filter(Event.user_id == user.id).all()
        upcoming_events = [
            e for e in all_events
            if e.start_time and today_start <= to_naive(e.start_time) <= week_end
        ]
        upcoming_events.sort(key=lambda e: to_naive(e.start_time))
        
        # Expenses this month
        first_of_month = now_naive.replace(day=1, hour=0, minute=0, second=0)
        all_expenses = db.query(Expense).filter(
            Expense.user_id == user.id,
            Expense.transaction_type == "EXPENSE"
        ).all()
        monthly_expenses = [e for e in all_expenses if e.date and to_naive(e.date) >= first_of_month]
        total_monthly_spend = sum(e.amount for e in monthly_expenses)
        
        # Study stats
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        upcoming_exams = [
            s for s in subjects
            if s.exam_date and today_start <= to_naive(s.exam_date) <= (now_naive + timedelta(days=14))
        ]
        
        # Goals stats
        active_goals = db.query(Goal).filter(Goal.user_id == user.id, Goal.status == "ACTIVE").all()
        
        # Reminders
        all_reminders = db.query(Reminder).filter(
            Reminder.user_id == user.id,
            Reminder.is_completed == False
        ).all()
        pending_reminders = [
            r for r in all_reminders
            if r.due_date and to_naive(r.due_date) <= week_end
        ]
        pending_reminders.sort(key=lambda r: to_naive(r.due_date))

        # Documents expiring within 60 days
        all_docs = db.query(DocumentVault).filter(
            DocumentVault.user_id == user.id,
            DocumentVault.expiry_date != None
        ).all()
        expiring_docs = [
            d for d in all_docs
            if d.expiry_date and today_start <= to_naive(d.expiry_date) <= (now_naive + timedelta(days=60))
        ]

        # Construct AI Insights
        insights = []
        
        if urgent_tasks:
            insights.append(f"You have {len(urgent_tasks)} high-priority task{'s' if len(urgent_tasks) > 1 else ''}. Focus on '{urgent_tasks[0].title}' first.")
        
        if upcoming_exams:
            next_exam = sorted(upcoming_exams, key=lambda s: to_naive(s.exam_date))[0]
            days_left = (to_naive(next_exam.exam_date).date() - now_naive.date()).days
            insights.append(f"Upcoming {next_exam.name} exam in {days_left} day{'s' if days_left > 1 else ''}. Ensure remaining topics are revised.")
            
        if expiring_docs:
            insights.append(f"Document alert: {expiring_docs[0].title} is due for renewal soon.")
            
        if user.monthly_budget > 0:
            budget_ratio = (total_monthly_spend / user.monthly_budget) * 100
            if budget_ratio >= 85:
                insights.append(f"Budget warning: You have spent {budget_ratio:.0f}% of your {user.currency}{user.monthly_budget:,.0f} monthly limit.")
            else:
                insights.append(f"Finances on track: {budget_ratio:.0f}% of monthly budget utilized ({user.currency}{total_monthly_spend:,.0f} spent).")

        if not insights:
            insights.append("Everything looks organized for today. Pick your top task and maintain momentum!")

        # Dynamic briefing paragraph
        briefing_text = (
            f"Here's what needs your attention today. You have {len(pending_tasks)} pending tasks "
            f"({len(urgent_tasks)} urgent) and {len(upcoming_events)} events scheduled over the next 7 days. "
        )
        if upcoming_exams:
            briefing_text += f"Remember, {upcoming_exams[0].name} exam is coming up on {upcoming_exams[0].exam_date.strftime('%A, %b %d')}."

        # Metrics cards
        metrics = [
            {
                "label": "Tasks Remaining",
                "value": str(len(pending_tasks)),
                "subtext": f"{len(completed_today)} completed today",
                "trend": "up" if len(completed_today) > 0 else "neutral",
                "color": "emerald" if len(pending_tasks) <= 3 else "amber"
            },
            {
                "label": "Upcoming Events",
                "value": str(len(upcoming_events)),
                "subtext": "Next 7 days",
                "trend": "neutral",
                "color": "blue"
            },
            {
                "label": "Monthly Spend",
                "value": f"{user.currency}{total_monthly_spend:,.0f}",
                "subtext": f"Budget: {user.currency}{user.monthly_budget:,.0f}",
                "trend": "down" if total_monthly_spend < user.monthly_budget * 0.7 else "warning",
                "color": "rose" if total_monthly_spend > user.monthly_budget * 0.9 else "indigo"
            },
            {
                "label": "Active Goals",
                "value": str(len(active_goals)),
                "subtext": f"{len(subjects)} subjects tracked",
                "trend": "up",
                "color": "purple"
            }
        ]

        return {
            "greeting": greeting,
            "date_str": now_utc.strftime("%A, %B %d, %Y"),
            "metrics": metrics,
            "ai_briefing": briefing_text,
            "ai_insights": insights,
            "recent_spending_total": total_monthly_spend,
            "monthly_budget": user.monthly_budget,
            "study_progress_summary": {
                "total_subjects": len(subjects),
                "upcoming_exams_count": len(upcoming_exams),
                "daily_target_minutes": user.study_daily_target_minutes
            }
        }
