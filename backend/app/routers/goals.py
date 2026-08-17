from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, Milestone
from app.models.task import Task
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut, MilestoneCreate, MilestoneUpdate, MilestoneOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])

def recalculate_goal_progress(goal: Goal, db: Session):
    if not goal.milestones:
        return
    total_progress = sum(100 if m.is_completed else m.progress_percentage for m in goal.milestones)
    goal.progress_percentage = int(total_progress / len(goal.milestones))
    if goal.progress_percentage >= 100:
        goal.status = "COMPLETED"
    elif goal.status == "COMPLETED" and goal.progress_percentage < 100:
        goal.status = "ACTIVE"
    db.commit()

@router.get("", response_model=List[GoalOut])
def get_goals(
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    if category:
        query = query.filter(Goal.category == category)
    if status:
        query = query.filter(Goal.status == status)
    return query.order_by(Goal.created_at.desc()).all()

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        category=goal_in.category,
        target_date=goal_in.target_date,
        status=goal_in.status,
        progress_percentage=goal_in.progress_percentage
    )
    db.add(goal)
    db.flush()
    
    if goal_in.milestones:
        for idx, m in enumerate(goal_in.milestones):
            milestone = Milestone(
                goal_id=goal.id,
                title=m.title,
                target_date=m.target_date,
                is_completed=m.is_completed,
                progress_percentage=m.progress_percentage,
                order_index=idx
            )
            db.add(milestone)
            
    db.commit()
    db.refresh(goal)
    recalculate_goal_progress(goal, db)
    db.refresh(goal)
    return goal

@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, value in goal_in.dict(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None

# Milestones
@router.post("/{goal_id}/milestones", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def add_milestone(
    goal_id: int,
    m_in: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    milestone = Milestone(
        goal_id=goal.id,
        title=m_in.title,
        target_date=m_in.target_date,
        is_completed=m_in.is_completed,
        progress_percentage=m_in.progress_percentage,
        order_index=m_in.order_index
    )
    db.add(milestone)
    db.commit()
    recalculate_goal_progress(goal, db)
    db.refresh(milestone)
    return milestone

@router.patch("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: int,
    m_in: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(Milestone).join(Goal).filter(Milestone.id == milestone_id, Goal.user_id == current_user.id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    update_data = m_in.dict(exclude_unset=True)
    if "is_completed" in update_data:
        if update_data["is_completed"]:
            milestone.progress_percentage = 100
        elif milestone.progress_percentage == 100:
            milestone.progress_percentage = 0
            
    for key, value in update_data.items():
        setattr(milestone, key, value)
        
    db.commit()
    recalculate_goal_progress(milestone.goal, db)
    db.refresh(milestone)
    return milestone

@router.post("/milestones/{milestone_id}/create-task")
def create_task_from_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(Milestone).join(Goal).filter(Milestone.id == milestone_id, Goal.user_id == current_user.id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    task = Task(
        user_id=current_user.id,
        title=f"Goal Action: {milestone.title}",
        description=f"Actionable task generated for Goal '{milestone.goal.title}' -> Milestone '{milestone.title}'",
        category="Career" if milestone.goal.category == "Career" else "General",
        priority="HIGH",
        due_date=milestone.target_date,
        goal_id=milestone.goal_id,
        milestone_id=milestone.id,
        status="TODO"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"message": "Task created from milestone", "task_id": task.id}
