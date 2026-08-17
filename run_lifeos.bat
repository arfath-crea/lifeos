@echo off
title LifeOS Launcher
echo ==========================================
echo    ⚡ Starting LifeOS Development Servers
echo ==========================================

echo Starting Backend (FastAPI on http://localhost:8000)...
start cmd /k "cd backend && py -m uvicorn app.main:app --reload --port 8000"

echo Starting Frontend (React + Vite on http://localhost:5173)...
start cmd /k "cd frontend && npm run dev"

echo.
echo 🚀 Both servers launched in separate windows!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo.
pause
