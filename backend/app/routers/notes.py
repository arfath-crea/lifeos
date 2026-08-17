from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.note import Note, NoteFolder
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut, NoteFolderCreate, NoteFolderOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/notes", tags=["Notes"])

# Folders
@router.get("/folders", response_model=List[NoteFolderOut])
def get_folders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folders = db.query(NoteFolder).filter(NoteFolder.user_id == current_user.id).all()
    results = []
    for f in folders:
        count = db.query(Note).filter(Note.folder_id == f.id, Note.is_archived == False).count()
        f_out = NoteFolderOut(id=f.id, user_id=f.user_id, name=f.name, icon=f.icon, parent_folder_id=f.parent_folder_id, created_at=f.created_at, note_count=count)
        results.append(f_out)
    return results

@router.post("/folders", response_model=NoteFolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_in: NoteFolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = NoteFolder(
        user_id=current_user.id,
        name=folder_in.name,
        icon=folder_in.icon or "folder",
        parent_folder_id=folder_in.parent_folder_id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return NoteFolderOut(id=folder.id, user_id=folder.user_id, name=folder.name, icon=folder.icon, parent_folder_id=folder.parent_folder_id, created_at=folder.created_at, note_count=0)

@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = db.query(NoteFolder).filter(NoteFolder.id == folder_id, NoteFolder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()
    return None

# Notes
@router.get("", response_model=List[NoteOut])
def get_notes(
    folder_id: Optional[int] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Note).filter(Note.user_id == current_user.id, Note.is_archived == False)
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    if tag:
        query = query.filter(Note.tags.ilike(f"%{tag}%"))
    if is_pinned is not None:
        query = query.filter(Note.is_pinned == is_pinned)
    if q:
        query = query.filter((Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%")))
        
    return query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = Note(
        user_id=current_user.id,
        folder_id=note_in.folder_id,
        title=note_in.title,
        content=note_in.content or "",
        tags=note_in.tags or "",
        is_pinned=note_in.is_pinned,
        is_archived=note_in.is_archived
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for key, value in note_in.dict(exclude_unset=True).items():
        setattr(note, key, value)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return None
