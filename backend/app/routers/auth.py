from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token, UserUpdate
from app.core.security import verify_password, get_password_hash, create_access_token
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/login", response_model=Token)
def login_json(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/token", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/demo", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """Instant one-click demo login for fast exploration"""
    demo_email = "alex@lifeos.dev"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        from app.seed import seed_demo_user
        user = seed_demo_user(db)
        
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserOut)
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
