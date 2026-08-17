from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.document import DocumentVault
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Document Vault"])

def compute_doc_status(doc: DocumentVault) -> tuple[Optional[int], str]:
    if not doc.expiry_date:
        return None, "NO_EXPIRY"
    
    now = datetime.now(timezone.utc)
    # Normalize tz
    expiry = doc.expiry_date
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    days = (expiry.date() - now.date()).days
    if days < 0:
        return days, "EXPIRED"
    elif days <= doc.reminder_days_before:
        return days, "EXPIRING_SOON"
    else:
        return days, "VALID"

@router.get("", response_model=List[DocumentOut])
def get_documents(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DocumentVault).filter(DocumentVault.user_id == current_user.id)
    if category:
        query = query.filter(DocumentVault.category == category)
    docs = query.order_by(DocumentVault.expiry_date.asc().nullslast()).all()
    
    results = []
    for d in docs:
        days, status_val = compute_doc_status(d)
        d_out = DocumentOut.from_orm(d)
        d_out.days_to_expiry = days
        d_out.expiry_status = status_val
        results.append(d_out)
    return results

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = DocumentVault(
        user_id=current_user.id,
        title=doc_in.title,
        category=doc_in.category,
        document_number=doc_in.document_number,
        issue_date=doc_in.issue_date,
        expiry_date=doc_in.expiry_date,
        reminder_days_before=doc_in.reminder_days_before,
        file_path=doc_in.file_path,
        file_name=doc_in.file_name,
        file_size=doc_in.file_size,
        notes=doc_in.notes,
        is_verified=doc_in.is_verified
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    days, status_val = compute_doc_status(doc)
    d_out = DocumentOut.from_orm(doc)
    d_out.days_to_expiry = days
    d_out.expiry_status = status_val
    return d_out

@router.patch("/{doc_id}", response_model=DocumentOut)
def update_document(
    doc_id: int,
    doc_in: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(DocumentVault).filter(DocumentVault.id == doc_id, DocumentVault.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    for key, value in doc_in.dict(exclude_unset=True).items():
        setattr(doc, key, value)
    db.commit()
    db.refresh(doc)
    
    days, status_val = compute_doc_status(doc)
    d_out = DocumentOut.from_orm(doc)
    d_out.days_to_expiry = days
    d_out.expiry_status = status_val
    return d_out

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(DocumentVault).filter(DocumentVault.id == doc_id, DocumentVault.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return None
