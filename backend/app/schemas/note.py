from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NoteFolderBase(BaseModel):
    name: str
    icon: Optional[str] = "folder"
    parent_folder_id: Optional[int] = None

class NoteFolderCreate(NoteFolderBase):
    pass

class NoteFolderOut(NoteFolderBase):
    id: int
    user_id: int
    created_at: datetime
    note_count: Optional[int] = 0

    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = ""
    folder_id: Optional[int] = None
    tags: Optional[str] = ""
    is_pinned: bool = False
    is_archived: bool = False

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None
    tags: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

class NoteOut(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
