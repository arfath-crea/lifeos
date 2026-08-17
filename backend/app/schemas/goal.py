from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MilestoneBase(BaseModel):
    title: str
    target_date: Optional[datetime] = None
    is_completed: bool = False
    progress_percentage: int = 0
    order_index: int = 0

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    target_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    progress_percentage: Optional[int] = None
    order_index: Optional[int] = None

class MilestoneOut(MilestoneBase):
    id: int
    goal_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Career"
    target_date: Optional[datetime] = None
    status: str = "ACTIVE"
    progress_percentage: int = 0

class GoalCreate(GoalBase):
    milestones: Optional[List[MilestoneCreate]] = []

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None
    progress_percentage: Optional[int] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneOut] = []

    class Config:
        from_attributes = True
