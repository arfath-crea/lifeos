from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.event import Event
from app.models.study import Subject
from app.models.expense import Expense
from app.models.goal import Goal
from app.schemas.ai import NaturalLanguageRequest, NaturalLanguageResponse, AIChatRequest, AIChatResponse
from app.ai.nl_engine import NaturalLanguageEngine
from app.routers.deps import get_current_user
from app.services.briefing_service import to_naive
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/ai", tags=["AI & Intelligence"])

@router.post("/command", response_model=NaturalLanguageResponse)
def process_natural_language_command(
    req: NaturalLanguageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    result = NaturalLanguageEngine.process_query(
        db=db,
        user_id=current_user.id,
        query=req.query,
        execute_action=req.execute_action
    )
    
    return NaturalLanguageResponse(
        understood_intent=result["understood_intent"],
        response_message=result["response_message"],
        action_performed=result["action_performed"],
        created_entity_id=result.get("created_entity_id"),
        created_entity_type=result.get("created_entity_type"),
        created_entity_data=result.get("created_entity_data")
    )

@router.post("/chat", response_model=AIChatResponse)
def conversational_assistant(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
    last_msg = req.messages[-1].content.lower()
    
    # Gather live user context safely
    now_naive = datetime.utcnow()
    pending_tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.status != "COMPLETED").all()
    urgent_tasks = [t for t in pending_tasks if t.priority in ["HIGH", "URGENT"]]
    
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    upcoming_exams = [s for s in subjects if s.exam_date and to_naive(s.exam_date) >= now_naive]
    
    all_events = db.query(Event).filter(Event.user_id == current_user.id).all()
    events_7days = [
        e for e in all_events
        if e.start_time and now_naive <= to_naive(e.start_time) <= (now_naive + timedelta(days=7))
    ]
    
    # Check for specific user questions
    if "what do i need to finish" in last_msg or "what should i do" in last_msg or "deadlines" in last_msg:
        if not pending_tasks:
            reply = "You're all caught up! There are currently no pending tasks on your plate. Would you like to set a new goal or start a study session?"
        else:
            top_tasks_str = ", ".join([f"'{t.title}' ({t.priority})" for t in (urgent_tasks[:3] or pending_tasks[:3])])
            reply = (
                f"You currently have {len(pending_tasks)} pending tasks ({len(urgent_tasks)} high-priority). "
                f"Your top priority right now should be: {top_tasks_str}."
            )
            if upcoming_exams:
                reply += f" Also keep in mind your upcoming {upcoming_exams[0].name} exam on {upcoming_exams[0].exam_date.strftime('%b %d')}."
        return AIChatResponse(
            reply=reply,
            suggested_actions=["What's on my calendar this week?", "Plan my study session", "Show my expenses"]
        )

    elif "exam" in last_msg or "study" in last_msg:
        if upcoming_exams:
            exam = sorted(upcoming_exams, key=lambda s: to_naive(s.exam_date))[0]
            days = (to_naive(exam.exam_date).date() - now_naive.date()).days
            reply = (
                f"Your next exam is **{exam.name}** in {days} days ({exam.exam_date.strftime('%A, %b %d')}). "
                f"I recommend scheduling two 25-minute Pomodoro sessions today covering your lowest-mastery topics. "
                f"Would you like me to generate a complete day-by-day revision schedule for {exam.name}?"
            )
            return AIChatResponse(
                reply=reply,
                suggested_actions=[f"Generate study plan for {exam.name}", "Start 25m Pomodoro Timer", "Check topic masteries"]
            )
        else:
            reply = f"You have {len(subjects)} subjects tracked. None have immediate exam dates set. You can set an exam date in the Study module to generate an automatic daily study plan."
            return AIChatResponse(
                reply=reply,
                suggested_actions=["Add Java exam date", "View study subjects"]
            )

    elif "spend" in last_msg or "expense" in last_msg or "money" in last_msg or "budget" in last_msg:
        first_of_month = now_naive.replace(day=1, hour=0, minute=0, second=0)
        all_expenses = db.query(Expense).filter(Expense.user_id == current_user.id, Expense.transaction_type == "EXPENSE").all()
        monthly_expenses = [e for e in all_expenses if e.date and to_naive(e.date) >= first_of_month]
        total_spend = sum(e.amount for e in monthly_expenses)
        budget = current_user.monthly_budget or 20000.0
        pct = (total_spend / budget) * 100 if budget > 0 else 0
        reply = (
            f"You have spent **{current_user.currency}{total_spend:,.2f}** this month out of your **{current_user.currency}{budget:,.2f}** budget ({pct:.1f}% used). "
            f"{'You are well within your budget.' if pct < 80 else 'You are approaching your monthly limit.'}"
        )
        return AIChatResponse(
            reply=reply,
            suggested_actions=["Spent ₹200 on lunch", "View expense breakdown", "Update monthly budget"]
        )

    # General Assistant Intelligence
    reply = (
        f"I'm your **LifeOS Copilot**. I have secure, real-time access to your tasks, calendar, study roadmap, and expenses. "
        f"You have {len(pending_tasks)} open tasks and {len(events_7days)} upcoming events this week. "
        f"Try typing any natural command like *'Spent ₹350 on dinner'*, *'Remind me to study Java tomorrow'*, or ask me *'What should I prioritize today?'*."
    )
    
    return AIChatResponse(
        reply=reply,
        suggested_actions=[
            "What do I need to finish this week?",
            "Spent ₹150 on coffee",
            "Remind me to pay bills tomorrow",
            "Plan my study schedule"
        ]
    )
