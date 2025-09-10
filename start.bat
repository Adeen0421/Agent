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

echo ✅ Dependencies OK
echo.

REM Start the enhanced backend
echo 📡 Starting Enhanced Backend Server...
echo 🔥 API: http://localhost:8000/docs
echo 🚀 Health: http://localhost:8000/api/v2/health
echo.

cd backend

REM Try uvicorn first, fallback to python module execution
echo 🚀 Starting server with uvicorn...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
if errorlevel 1 (
    echo.
    echo ⚠️ uvicorn command failed, trying python -m uvicorn...
    echo.
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    if errorlevel 1 (
        echo.
        echo ⚠️ python -m uvicorn failed, trying python main.py...
        echo.
        python main.py
    )
)

echo.
echo 👋 Server stopped
pause
