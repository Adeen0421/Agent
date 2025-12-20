@echo off
title Enhanced AI System
color 0A
cls

echo ========================================
echo    🚀 ENHANCED AI SYSTEM
echo ========================================
echo.
echo 🧠 Features: Memory, Guardrails, Safety
echo 📊 MongoDB Integration with Fallback
echo 🔒 Advanced Prompt Engineering
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ API key not configured!
    echo.
    echo 💡 Creating .env template...
    echo # Google AI API Key (Required^) > .env
    echo # Get your key from: https://ai.google.dev/ >> .env
    echo GOOGLE_API_KEY=your_api_key_here >> .env
    echo. >> .env
    echo # MongoDB (Optional - uses memory fallback^) >> .env
    echo MONGODB_CONNECTION_STRING=mongodb://localhost:27017/ >> .env
    echo.
    echo ✅ Created .env file
    echo ⚠️  Edit .env and add your Google API key
    echo 🔗 Get key from: https://ai.google.dev/
    echo.
    pause
    exit /b 1
)

REM Check Python dependencies
echo 🔍 Checking dependencies...
python -c "import fastapi, uvicorn, pymongo, google.generativeai" 2>nul
if errorlevel 1 (
    echo ❌ Missing dependencies!
    echo 📦 Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies from root requirements.txt
        echo 📦 Trying backend requirements.txt...
        pip install fastapi uvicorn python-dotenv google-generativeai pymongo pydantic
        if errorlevel 1 (
            echo ❌ Failed to install dependencies
            pause
            exit /b 1
        )
    )
)

REM Verify uvicorn is available as command
echo 🔍 Verifying uvicorn installation...
uvicorn --version >nul 2>&1
if errorlevel 1 (
    echo ❌ uvicorn command not found!
    echo 📦 Installing uvicorn...
    pip install uvicorn
    if errorlevel 1 (
        echo ❌ Failed to install uvicorn
        pause
        exit /b 1
    )
)

REM Verify Node.js
echo 🔍 Verifying Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo ⚠️  Please install Node.js to run the frontend.
    pause
    exit /b 1
)

REM Check Frontend dependencies
if not exist "frontend\node_modules" (
    echo � Installing frontend dependencies...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Dependencies OK
echo.

REM Start the enhanced system
echo 📡 Starting Enhanced AI System...
echo ----------------------------------------
echo 1. Launching Backend Server (Port 8000)
echo 2. Launching Frontend Application (Port 3000)
echo.

REM Start Backend in new window
start "Nebula Backend" cmd /k "cd backend && (uvicorn main:app --host 0.0.0.0 --port 8000 --reload || python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload || python main.py)"

REM Start Frontend in new window
start "Nebula Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Services launched!
echo 📡 Backend API: http://localhost:8000/docs
echo 💻 Frontend UI: http://localhost:3000
echo.
echo 👋 You can close this window now. The servers will keep running.
pause
