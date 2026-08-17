from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.task import Task, Subtask
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, SubtaskCreate, SubtaskOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskOut])
def get_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    goal_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if priority:
        query = query.filter(Task.priority == priority)
    if goal_id:
        query = query.filter(Task.goal_id == goal_id)
        
    return query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = Task(
        user_id=current_user.id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        category=task_in.category,
        tags=task_in.tags or "",
        is_recurring=task_in.is_recurring,
        recurrence_rule=task_in.recurrence_rule,
        goal_id=task_in.goal_id,
        milestone_id=task_in.milestone_id
    )
    db.add(task)
    db.flush()
    
    if task_in.subtasks:
        for sub in task_in.subtasks:
            subtask = Subtask(task_id=task.id, title=sub.title, is_completed=sub.is_completed)
            db.add(subtask)
            
    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_dict = task_in.dict(exclude_unset=True)
    if "status" in update_dict:
        if update_dict["status"] == "COMPLETED" and task.status != "COMPLETED":
            task.completed_at = datetime.now(timezone.utc)
        elif update_dict["status"] != "COMPLETED":
            task.completed_at = None
            
    for key, value in update_dict.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/toggle", response_model=TaskOut)
def toggle_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status == "COMPLETED":
        task.status = "TODO"
        task.completed_at = None
    else:
        task.status = "COMPLETED"
        task.completed_at = datetime.now(timezone.utc)
        # Also mark subtasks completed
        for sub in task.subtasks:
            sub.is_completed = True
            
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

# Subtasks endpoints
@router.post("/{task_id}/subtasks", response_model=SubtaskOut)
def add_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    subtask = Subtask(task_id=task.id, title=subtask_in.title, is_completed=subtask_in.is_completed)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask

@router.post("/{task_id}/subtasks/{subtask_id}/toggle", response_model=SubtaskOut)
def toggle_subtask(
    task_id: int,
    subtask_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtask = db.query(Subtask).join(Task).filter(
        Subtask.id == subtask_id,
        Subtask.task_id == task_id,
        Task.user_id == current_user.id
    ).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
        
    subtask.is_completed = not subtask.is_completed
    db.commit()
    db.refresh(subtask)
    return subtask
