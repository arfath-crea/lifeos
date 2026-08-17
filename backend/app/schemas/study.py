from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TopicBase(BaseModel):
    name: str
    mastery_percentage: int = 0
    difficulty: str = "MEDIUM"
    notes: Optional[str] = None
    is_completed: bool = False

class TopicCreate(TopicBase):
    subject_id: Optional[int] = None

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    mastery_percentage: Optional[int] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None

class TopicOut(TopicBase):
    id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    color: Optional[str] = "#6366f1"
    exam_date: Optional[datetime] = None
    target_hours: int = 20

class SubjectCreate(SubjectBase):
    topics: Optional[List[TopicBase]] = []

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    color: Optional[str] = None
    exam_date: Optional[datetime] = None
    target_hours: Optional[int] = None

class SubjectOut(SubjectBase):
    id: int
    user_id: int
    created_at: datetime
    topics: List[TopicOut] = []
    overall_mastery: Optional[int] = 0

    class Config:
        from_attributes = True

class StudySessionBase(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    duration_minutes: int = 25
    notes: Optional[str] = None
    session_type: str = "pomodoro"

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionOut(StudySessionBase):
    id: int
    user_id: int
    created_at: datetime
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None

    class Config:
        from_attributes = True

class StudyPlanRequest(BaseModel):
    subject_id: int
    exam_date: datetime
    daily_available_hours: float = 2.0
