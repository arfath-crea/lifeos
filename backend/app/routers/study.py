from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.study import Subject, Topic, StudySession
from app.schemas.study import (
    SubjectCreate, SubjectUpdate, SubjectOut,
    TopicCreate, TopicUpdate, TopicOut,
    StudySessionCreate, StudySessionOut,
    StudyPlanRequest
)
from app.services.study_service import StudyService
from app.routers.deps import get_current_user

router = APIRouter(prefix="/study", tags=["Study System"])

@router.get("/subjects", response_model=List[SubjectOut])
def get_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    results = []
    for s in subjects:
        mastery = StudyService.calculate_subject_mastery(s)
        s_out = SubjectOut.from_orm(s)
        s_out.overall_mastery = mastery
        results.append(s_out)
    return results

@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    sub_in: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = Subject(
        user_id=current_user.id,
        name=sub_in.name,
        code=sub_in.code,
        color=sub_in.color or "#6366f1",
        exam_date=sub_in.exam_date,
        target_hours=sub_in.target_hours
    )
    db.add(subject)
    db.flush()
    
    if sub_in.topics:
        for t in sub_in.topics:
            topic = Topic(
                subject_id=subject.id,
                name=t.name,
                mastery_percentage=t.mastery_percentage,
                difficulty=t.difficulty,
                notes=t.notes
            )
            db.add(topic)
            
    db.commit()
    db.refresh(subject)
    s_out = SubjectOut.from_orm(subject)
    s_out.overall_mastery = StudyService.calculate_subject_mastery(subject)
    return s_out

@router.get("/subjects/{subject_id}", response_model=SubjectOut)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    s_out = SubjectOut.from_orm(subject)
    s_out.overall_mastery = StudyService.calculate_subject_mastery(subject)
    return s_out

@router.patch("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    sub_in: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, value in sub_in.dict(exclude_unset=True).items():
        setattr(subject, key, value)
    db.commit()
    db.refresh(subject)
    s_out = SubjectOut.from_orm(subject)
    s_out.overall_mastery = StudyService.calculate_subject_mastery(subject)
    return s_out

@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return None

# Topics
@router.post("/subjects/{subject_id}/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    subject_id: int,
    topic_in: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    topic = Topic(
        subject_id=subject.id,
        name=topic_in.name,
        mastery_percentage=topic_in.mastery_percentage,
        difficulty=topic_in.difficulty,
        notes=topic_in.notes,
        is_completed=topic_in.is_completed or (topic_in.mastery_percentage >= 100)
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.patch("/topics/{topic_id}", response_model=TopicOut)
def update_topic(
    topic_id: int,
    topic_in: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    update_data = topic_in.dict(exclude_unset=True)
    if "mastery_percentage" in update_data:
        if update_data["mastery_percentage"] >= 100:
            topic.is_completed = True
        else:
            topic.is_completed = False
            
    for key, value in update_data.items():
        setattr(topic, key, value)
        
    db.commit()
    db.refresh(topic)
    return topic

@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return None

# Study Sessions & Pomodoro
@router.get("/sessions", response_model=List[StudySessionOut])
def get_study_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).order_by(StudySession.created_at.desc()).limit(20).all()
    results = []
    for sess in sessions:
        s_out = StudySessionOut.from_orm(sess)
        if sess.subject:
            s_out.subject_name = sess.subject.name
        if sess.topic:
            s_out.topic_name = sess.topic.name
        results.append(s_out)
    return results

@router.post("/sessions", response_model=StudySessionOut, status_code=status.HTTP_201_CREATED)
def log_study_session(
    sess_in: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = StudySession(
        user_id=current_user.id,
        subject_id=sess_in.subject_id,
        topic_id=sess_in.topic_id,
        duration_minutes=sess_in.duration_minutes,
        notes=sess_in.notes,
        session_type=sess_in.session_type
    )
    db.add(session)
    
    # If topic is linked, boost mastery slightly (e.g. +10%)
    if sess_in.topic_id:
        topic = db.query(Topic).filter(Topic.id == sess_in.topic_id).first()
        if topic:
            topic.mastery_percentage = min(100, topic.mastery_percentage + 15)
            if topic.mastery_percentage >= 100:
                topic.is_completed = True
                
    db.commit()
    db.refresh(session)
    
    s_out = StudySessionOut.from_orm(session)
    if session.subject:
        s_out.subject_name = session.subject.name
    if session.topic:
        s_out.topic_name = session.topic.name
    return s_out

# Smart AI Study Plan
@router.post("/plan")
def generate_study_plan(
    req: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return StudyService.generate_exam_study_plan(
        db=db,
        user_id=current_user.id,
        subject_id=req.subject_id,
        exam_date=req.exam_date,
        daily_hours=req.daily_available_hours
    )
