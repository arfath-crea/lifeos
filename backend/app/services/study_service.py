from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.study import Subject, Topic, StudySession
from app.models.task import Task

class StudyService:
    @staticmethod
    def calculate_subject_mastery(subject: Subject) -> int:
        if not subject.topics:
            return 0
        total = sum(t.mastery_percentage for t in subject.topics)
        return int(total / len(subject.topics))
        
    @staticmethod
    def generate_exam_study_plan(db: Session, user_id: int, subject_id: int, exam_date: datetime, daily_hours: float = 2.0) -> Dict[str, Any]:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
        if not subject:
            return {"error": "Subject not found"}
            
        now = datetime.now(timezone.utc)
        days_remaining = max(1, (exam_date.date() - now.date()).days)
        
        # Sort topics: least mastered first
        topics = db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.mastery_percentage.asc()).all()
        if not topics:
            return {"error": "No topics found for subject. Add topics first."}
            
        unmastered_topics = [t for t in topics if t.mastery_percentage < 100]
        if not unmastered_topics:
            unmastered_topics = topics  # Full revision
            
        # Distribute topics across days
        daily_plan = []
        topics_per_day = max(1, len(unmastered_topics) // days_remaining)
        
        current_date = now.date()
        topic_idx = 0
        
        for d in range(days_remaining):
            day_date = current_date + timedelta(days=d)
            is_last_day = (d == days_remaining - 1)
            
            day_topics = []
            if is_last_day:
                # Final day is comprehensive revision
                day_topics = [t.name for t in unmastered_topics]
                session_focus = "Comprehensive Revision & Mock Test"
            else:
                # Pick next batch of topics
                batch = unmastered_topics[topic_idx : topic_idx + topics_per_day]
                if not batch and topic_idx < len(unmastered_topics):
                    batch = [unmastered_topics[topic_idx]]
                day_topics = [t.name for t in batch] if batch else ["Topic Practice & Notes Review"]
                topic_idx = min(len(unmastered_topics), topic_idx + topics_per_day)
                session_focus = f"Learn & Practice: {', '.join(day_topics)}"

            daily_plan.append({
                "day_number": d + 1,
                "date": day_date.strftime("%Y-%m-%d"),
                "date_display": day_date.strftime("%A, %b %d"),
                "is_exam_eve": is_last_day,
                "focus": session_focus,
                "topics": day_topics,
                "recommended_pomodoros": int((daily_hours * 60) / 30)
            })

        return {
            "subject_name": subject.name,
            "exam_date": exam_date.strftime("%Y-%m-%d"),
            "days_remaining": days_remaining,
            "total_topics": len(topics),
            "unmastered_topics_count": len(unmastered_topics),
            "daily_target_hours": daily_hours,
            "schedule": daily_plan
        }
