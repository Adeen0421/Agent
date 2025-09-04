@echo off
echo Starting AI Agent Development Environment...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found. Please create it with your GOOGLE_API_KEY.
    pause
    exit /b 1
)

echo Starting FastAPI backend...
start "Backend Server" powershell -Command "python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Next.js frontend...
start "Frontend Server" powershell -Command "cd frontend && npm run dev"

echo.
echo Servers are starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo API Documentation: http://localhost:8000/docs
echo.
pause
