# LifeOS Launch Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   ⚡ Starting LifeOS Development Servers  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Start Backend
Write-Host "1. Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process -FilePath "py" -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory "$PSScriptRoot\backend"

# Start Frontend
Write-Host "2. Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\frontend"

Write-Host ""
Write-Host "🚀 Both servers launched!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
