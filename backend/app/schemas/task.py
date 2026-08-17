from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SubtaskBase(BaseModel):
    title: str
    is_completed: bool = False

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskOut(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "TODO"
    priority: str = "MEDIUM"
    due_date: Optional[datetime] = None
    category: str = "General"
    tags: Optional[str] = ""
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    goal_id: Optional[int] = None
    milestone_id: Optional[int] = None

class TaskCreate(TaskBase):
    subtasks: Optional[List[SubtaskCreate]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    goal_id: Optional[int] = None
    milestone_id: Optional[int] = None

class TaskOut(TaskBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskOut] = []

    class Config:
        from_attributes = True
