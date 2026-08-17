from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.note import Note
from app.models.event import Event
from app.models.expense import Expense
from app.models.document import DocumentVault
from app.models.goal import Goal
from app.models.study import Subject, Topic
from app.routers.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Universal Search"])

@router.get("")
def universal_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    search_term = f"%{q.strip()}%"
    
    # 1. Search Tasks
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        (Task.title.ilike(search_term) | Task.description.ilike(search_term) | Task.tags.ilike(search_term))
    ).limit(6).all()
    
    # 2. Search Notes
    notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        (Note.title.ilike(search_term) | Note.content.ilike(search_term) | Note.tags.ilike(search_term))
    ).limit(6).all()
    
    # 3. Search Events
    events = db.query(Event).filter(
        Event.user_id == current_user.id,
        (Event.title.ilike(search_term) | Event.description.ilike(search_term))
    ).limit(5).all()
    
    # 4. Search Expenses
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        (Expense.title.ilike(search_term) | Expense.category.ilike(search_term) | Expense.notes.ilike(search_term))
    ).limit(5).all()
    
    # 5. Search Documents
    documents = db.query(DocumentVault).filter(
        DocumentVault.user_id == current_user.id,
        (DocumentVault.title.ilike(search_term) | DocumentVault.category.ilike(search_term) | DocumentVault.notes.ilike(search_term))
    ).limit(5).all()
    
    # 6. Search Goals
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        (Goal.title.ilike(search_term) | Goal.description.ilike(search_term))
    ).limit(5).all()
    
    # 7. Search Study
    topics = db.query(Topic).join(Subject).filter(
        Subject.user_id == current_user.id,
        (Topic.name.ilike(search_term) | Topic.notes.ilike(search_term) | Subject.name.ilike(search_term))
    ).limit(6).all()

    total_matches = len(tasks) + len(notes) + len(events) + len(expenses) + len(documents) + len(goals) + len(topics)

    return {
        "query": q,
        "total_results": total_matches,
        "results": {
            "tasks": [{"id": t.id, "title": t.title, "status": t.status, "priority": t.priority, "category": t.category} for t in tasks],
            "notes": [{"id": n.id, "title": n.title, "preview": (n.content[:80] + "...") if n.content else "", "tags": n.tags} for n in notes],
            "events": [{"id": e.id, "title": e.title, "start_time": e.start_time.isoformat(), "event_type": e.event_type} for e in events],
            "expenses": [{"id": exp.id, "title": exp.title, "amount": exp.amount, "category": exp.category, "type": exp.transaction_type} for exp in expenses],
            "documents": [{"id": d.id, "title": d.title, "category": d.category, "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None} for d in documents],
            "goals": [{"id": g.id, "title": g.title, "progress_percentage": g.progress_percentage, "status": g.status} for g in goals],
            "study_topics": [{"id": top.id, "name": top.name, "subject": top.subject.name, "mastery_percentage": top.mastery_percentage} for top in topics]
        }
    }
