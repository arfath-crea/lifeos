from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.models import *  # import all models so SQLAlchemy registers them
from app.routers import (
    auth, dashboard, tasks, calendar, notes,
    study, expenses, documents, goals, reminders,
    notifications, search, ai
)
from app.seed import seed_demo_user
from app.models.user import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo data if DB is fresh
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("🚀 Fresh database detected. Seeding LifeOS demo user and interconnected data...")
            seed_demo_user(db)
            print("✅ Demo user created: alex@lifeos.dev / demo123")
    except Exception as e:
        print(f"Error during startup seeding: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LifeOS — AI-Powered Personal Management Platform API",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(dashboard.router, prefix=api_v1)
app.include_router(tasks.router, prefix=api_v1)
app.include_router(calendar.router, prefix=api_v1)
app.include_router(notes.router, prefix=api_v1)
app.include_router(study.router, prefix=api_v1)
app.include_router(expenses.router, prefix=api_v1)
app.include_router(documents.router, prefix=api_v1)
app.include_router(goals.router, prefix=api_v1)
app.include_router(reminders.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(search.router, prefix=api_v1)
app.include_router(ai.router, prefix=api_v1)

@app.get("/")
def root():
    return {
        "app": "LifeOS API",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "message": "Welcome to LifeOS — Your AI-Powered Personal Management Platform"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
