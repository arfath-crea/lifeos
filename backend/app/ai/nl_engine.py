import re
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.task import Task, Subtask
from app.models.expense import Expense
from app.models.reminder import Reminder
from app.models.event import Event
from app.models.note import Note, NoteFolder
from app.models.notification import Notification
from app.models.study import Subject, Topic

def parse_relative_date(text: str) -> Optional[datetime]:
    now = datetime.now(timezone.utc)
    text_lower = text.lower()
    
    if "today" in text_lower:
        return now.replace(hour=20, minute=0, second=0, microsecond=0)
    elif "tomorrow" in text_lower:
        return (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
    elif "day after tomorrow" in text_lower:
        return (now + timedelta(days=2)).replace(hour=18, minute=0, second=0, microsecond=0)
    elif "next week" in text_lower:
        return (now + timedelta(days=7)).replace(hour=18, minute=0, second=0, microsecond=0)
    
    # Days of week
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(days):
        if day in text_lower:
            current_weekday = now.weekday()
            target_weekday = i
            days_ahead = (target_weekday - current_weekday) % 7
            if days_ahead == 0:
                days_ahead = 7
            return (now + timedelta(days=days_ahead)).replace(hour=17, minute=0, second=0, microsecond=0)
            
    # Pattern: in X days
    days_match = re.search(r"in\s+(\d+)\s+days?", text_lower)
    if days_match:
        count = int(days_match.group(1))
        return (now + timedelta(days=count)).replace(hour=18, minute=0, second=0, microsecond=0)
        
    # Month / Day patterns like "september 12", "sep 12", "12 september"
    months = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
        "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9, "oct": 10, "october": 10,
        "nov": 11, "november": 11, "dec": 12, "december": 12
    }
    
    for m_name, m_num in months.items():
        pattern1 = rf"\b{m_name}\s+(\d{{1,2}})(?:st|nd|rd|th)?\b"
        match1 = re.search(pattern1, text_lower)
        if match1:
            day = int(match1.group(1))
            year = now.year
            try:
                candidate = datetime(year, m_num, day, 18, 0, 0, tzinfo=timezone.utc)
                if candidate < now:
                    candidate = datetime(year + 1, m_num, day, 18, 0, 0, tzinfo=timezone.utc)
                return candidate
            except ValueError:
                pass
                
        pattern2 = rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+{m_name}\b"
        match2 = re.search(pattern2, text_lower)
        if match2:
            day = int(match2.group(1))
            year = now.year
            try:
                candidate = datetime(year, m_num, day, 18, 0, 0, tzinfo=timezone.utc)
                if candidate < now:
                    candidate = datetime(year + 1, m_num, day, 18, 0, 0, tzinfo=timezone.utc)
                return candidate
            except ValueError:
                pass
                
    return None

class NaturalLanguageEngine:
    """
    State-of-the-art Natural Language Engine for LifeOS.
    Identifies intents, extracts parameters, and triggers verified database transactions.
    """
    
    @staticmethod
    def process_query(db: Session, user_id: int, query: str, execute_action: bool = True) -> Dict[str, Any]:
        q = query.strip()
        q_lower = q.lower()
        
        # 1. EXPENSE INTENT
        # Examples: "I spent ₹250 on lunch", "Spent 1200 on groceries", "Paid ₹450 for uber ride", "Expense 500 for coffee"
        expense_match = re.search(r"(?:spent|paid|expense|bought|cost)\s+(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:on|for|at)?\s*(.*)", q, re.IGNORECASE)
        if not expense_match:
            expense_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:₹|\$|rs\.?|inr)\s+(?:for|on)\s*(.*)", q, re.IGNORECASE)
            
        if expense_match:
            amount = float(expense_match.group(1))
            raw_target = expense_match.group(2).strip()
            
            # Clean up target
            target = re.sub(r"\b(today|yesterday|via\s+\w+|using\s+\w+)\b", "", raw_target, flags=re.IGNORECASE).strip()
            if not target:
                target = "General Expense"
                
            # Categorize
            category = "Other"
            t_lower = (raw_target + " " + target).lower()
            if any(w in t_lower for w in ["lunch", "dinner", "breakfast", "coffee", "tea", "food", "burger", "pizza", "groceries", "restaurant", "swiggy", "zomato"]):
                category = "Food"
            elif any(w in t_lower for w in ["uber", "ola", "metro", "bus", "train", "fuel", "petrol", "cab", "transport", "auto"]):
                category = "Transport"
            elif any(w in t_lower for w in ["book", "course", "exam", "college", "tuition", "fee", "textbook", "udemy"]):
                category = "Education"
            elif any(w in t_lower for w in ["movie", "cinema", "game", "netflix", "spotify", "party", "drinks"]):
                category = "Entertainment"
            elif any(w in t_lower for w in ["bill", "electricity", "wifi", "internet", "water", "gas", "recharge"]):
                category = "Utilities"
            elif any(w in t_lower for w in ["rent", "maintenance", "room"]):
                category = "Rent"
            elif any(w in t_lower for w in ["medicine", "doctor", "hospital", "pharma", "gym"]):
                category = "Health"
            elif any(w in t_lower for w in ["clothes", "shoes", "amazon", "flipkart", "shopping"]):
                category = "Shopping"

            # Payment method detection
            payment_method = "UPI"
            if "cash" in q_lower:
                payment_method = "Cash"
            elif "credit card" in q_lower or "credit" in q_lower:
                payment_method = "Credit Card"
            elif "debit card" in q_lower:
                payment_method = "Debit Card"

            expense_date = parse_relative_date(q) or datetime.now(timezone.utc)
            
            if execute_action:
                expense = Expense(
                    user_id=user_id,
                    title=target.capitalize(),
                    amount=amount,
                    transaction_type="EXPENSE",
                    category=category,
                    payment_method=payment_method,
                    date=expense_date,
                    notes=f"Logged via LifeOS AI: '{q}'"
                )
                db.add(expense)
                db.commit()
                db.refresh(expense)
                
                return {
                    "understood_intent": "LOG_EXPENSE",
                    "response_message": f"Recorded expense of ₹{amount:,.2f} for '{target}' under {category} ({payment_method}).",
                    "action_performed": {
                        "action_type": "LOG_EXPENSE",
                        "entity_name": "Expense",
                        "parameters": {"title": target, "amount": amount, "category": category, "payment_method": payment_method},
                        "confidence": 0.95,
                        "description": f"Created expense record #{expense.id}"
                    },
                    "created_entity_id": expense.id,
                    "created_entity_type": "expense",
                    "created_entity_data": {
                        "id": expense.id,
                        "title": expense.title,
                        "amount": expense.amount,
                        "category": expense.category
                    }
                }

        # 2. REMINDER INTENT
        # Examples: "Remind me to renew passport on September 12", "Remind me to pay electricity bill tomorrow"
        if q_lower.startswith("remind me to ") or q_lower.startswith("reminder: ") or "remind me" in q_lower:
            remind_body = re.sub(r"^(?:please\s+)?(?:remind me to|reminder:?|set a reminder to)\s+", "", q, flags=re.IGNORECASE).strip()
            due_date = parse_relative_date(remind_body) or (datetime.now(timezone.utc) + timedelta(days=1))
            
            # Clean reminder title
            clean_title = re.sub(r"\b(on|at|by|due|tomorrow|today|next week|in \d+ days?|\w+ \d{1,2}(?:st|nd|rd|th)?)\b.*$", "", remind_body, flags=re.IGNORECASE).strip()
            if not clean_title:
                clean_title = remind_body
                
            priority = "URGENT" if any(w in q_lower for w in ["urgent", "crucial", "important", "asap"]) else "MEDIUM"
            
            if execute_action:
                reminder = Reminder(
                    user_id=user_id,
                    title=clean_title.capitalize(),
                    description=f"Created via LifeOS Natural Language Assistant",
                    due_date=due_date,
                    priority=priority,
                    source_module="CUSTOM"
                )
                db.add(reminder)
                
                # Also create notification
                notif = Notification(
                    user_id=user_id,
                    title="Reminder Scheduled",
                    message=f"Reminder set: '{clean_title}' for {due_date.strftime('%b %d, %Y')}",
                    notification_type="INFO",
                    source_module="REMINDERS"
                )
                db.add(notif)
                db.commit()
                db.refresh(reminder)
                
                return {
                    "understood_intent": "CREATE_REMINDER",
                    "response_message": f"Set reminder '{clean_title}' for {due_date.strftime('%A, %B %d')}.",
                    "action_performed": {
                        "action_type": "CREATE_REMINDER",
                        "entity_name": "Reminder",
                        "parameters": {"title": clean_title, "due_date": due_date.isoformat(), "priority": priority},
                        "confidence": 0.96,
                        "description": f"Created reminder #{reminder.id}"
                    },
                    "created_entity_id": reminder.id,
                    "created_entity_type": "reminder",
                    "created_entity_data": {
                        "id": reminder.id,
                        "title": reminder.title,
                        "due_date": reminder.due_date.isoformat()
                    }
                }

        # 3. EXAM / CALENDAR EVENT INTENT
        # Examples: "Exam on Friday for Computer Networks", "Doctor appointment on Tuesday at 4pm", "Meeting with advisor tomorrow"
        if any(keyword in q_lower for keyword in ["exam on", "meeting with", "appointment on", "doctor appointment", "event on", "schedule "]):
            event_type = "Event"
            if "exam" in q_lower:
                event_type = "Exam"
            elif "meeting" in q_lower:
                event_type = "Meeting"
            elif "appointment" in q_lower or "doctor" in q_lower:
                event_type = "Appointment"
                
            event_date = parse_relative_date(q) or (datetime.now(timezone.utc) + timedelta(days=2))
            
            # Clean title
            title = q
            for prefix in ["schedule a ", "schedule ", "add event ", "create event "]:
                if title.lower().startswith(prefix):
                    title = title[len(prefix):]
                    
            if execute_action:
                event = Event(
                    user_id=user_id,
                    title=title.capitalize(),
                    event_type=event_type,
                    start_time=event_date,
                    color="#ef4444" if event_type == "Exam" else "#3b82f6",
                    description=f"Scheduled via LifeOS AI"
                )
                db.add(event)
                
                # If it's an exam, ensure Subject exists or link it
                if event_type == "Exam":
                    subject_name_match = re.search(r"exam (?:for|in|of)?\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+at|$)", q, re.IGNORECASE)
                    if subject_name_match:
                        sub_name = subject_name_match.group(1).strip()
                        existing_sub = db.query(Subject).filter(Subject.user_id == user_id, Subject.name.ilike(sub_name)).first()
                        if existing_sub:
                            existing_sub.exam_date = event_date
                        else:
                            new_sub = Subject(user_id=user_id, name=sub_name.title(), exam_date=event_date)
                            db.add(new_sub)

                db.commit()
                db.refresh(event)
                
                return {
                    "understood_intent": "CREATE_EVENT",
                    "response_message": f"Added {event_type} '{event.title}' to calendar for {event_date.strftime('%A, %B %d')}.",
                    "action_performed": {
                        "action_type": "CREATE_EVENT",
                        "entity_name": "Event",
                        "parameters": {"title": event.title, "event_type": event_type, "date": event_date.isoformat()},
                        "confidence": 0.94,
                        "description": f"Created calendar event #{event.id}"
                    },
                    "created_entity_id": event.id,
                    "created_entity_type": "event",
                    "created_entity_data": {
                        "id": event.id,
                        "title": event.title,
                        "event_type": event.event_type
                    }
                }

        # 4. NOTE INTENT
        # Examples: "Note down: ...", "Add note ...", "Take note: ..."
        if q_lower.startswith("note:") or q_lower.startswith("note down:") or q_lower.startswith("take note:") or q_lower.startswith("add note:"):
            note_content = re.sub(r"^(?:note:|note down:|take note:|add note:)\s*", "", q, flags=re.IGNORECASE).strip()
            first_line = note_content.split("\n")[0][:40]
            title = first_line if first_line else "Quick Note"
            
            if execute_action:
                note = Note(
                    user_id=user_id,
                    title=title,
                    content=note_content,
                    tags="AI-Capture"
                )
                db.add(note)
                db.commit()
                db.refresh(note)
                
                return {
                    "understood_intent": "CREATE_NOTE",
                    "response_message": f"Saved new note '{title}'.",
                    "action_performed": {
                        "action_type": "CREATE_NOTE",
                        "entity_name": "Note",
                        "parameters": {"title": title, "content": note_content},
                        "confidence": 0.97,
                        "description": f"Created note #{note.id}"
                    },
                    "created_entity_id": note.id,
                    "created_entity_type": "note",
                    "created_entity_data": {"id": note.id, "title": note.title}
                }

        # 5. TASK INTENT (Default action creation)
        # Examples: "Submit assignment due Friday", "Complete Java OOP project", "Buy groceries tomorrow", "Study networking topics"
        clean_task = re.sub(r"^(?:create task|add task|todo:|task:)\s*", "", q, flags=re.IGNORECASE).strip()
        due_date = parse_relative_date(clean_task)
        
        priority = "MEDIUM"
        if any(w in q_lower for w in ["urgent", "asap", "high priority", "important", "🔴"]):
            priority = "URGENT" if "urgent" in q_lower else "HIGH"
        elif "low priority" in q_lower:
            priority = "LOW"
            
        category = "General"
        if any(w in q_lower for w in ["study", "assignment", "homework", "exam", "chapter", "lecture", "java", "python", "sql"]):
            category = "Academics"
        elif any(w in q_lower for w in ["interview", "resume", "job", "apply", "portfolio", "code", "github"]):
            category = "Career"
        elif any(w in q_lower for w in ["bill", "pay", "tax", "rent", "recharge"]):
            category = "Finance"
            
        if execute_action:
            task = Task(
                user_id=user_id,
                title=clean_task.capitalize(),
                priority=priority,
                category=category,
                due_date=due_date,
                status="TODO"
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            
            # Subtasks generation if complex request (e.g. Assignment -> Research, Intro, Implementation, Submit)
            if "assignment" in clean_task.lower():
                subtasks = [
                    Subtask(task_id=task.id, title="Research topic & requirements"),
                    Subtask(task_id=task.id, title="Draft initial implementation / report"),
                    Subtask(task_id=task.id, title="Review, format & submit PDF")
                ]
                db.add_all(subtasks)
                db.commit()

            return {
                "understood_intent": "CREATE_TASK",
                "response_message": f"Created task '{task.title}' ({priority} priority, {category})." + (f" Due {due_date.strftime('%b %d')}." if due_date else ""),
                "action_performed": {
                    "action_type": "CREATE_TASK",
                    "entity_name": "Task",
                    "parameters": {"title": task.title, "priority": priority, "category": category, "due_date": due_date.isoformat() if due_date else None},
                    "confidence": 0.92,
                    "description": f"Created task #{task.id}"
                },
                "created_entity_id": task.id,
                "created_entity_type": "task",
                "created_entity_data": {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category
                }
            }
