# PowerShell script to run both backend and frontend in development
Write-Host "Starting AI Agent Development Environment..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".\.env")) {
    Write-Host "ERROR: .env file not found. Please create it with your GOOGLE_API_KEY." -ForegroundColor Red
    exit 1
}

# Start backend
Write-Host "Starting FastAPI backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd backend; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep 2

# Check if frontend dependencies are installed
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "frontend"
    npm install
    Set-Location ".."
}

# Start frontend
Write-Host "Starting Next.js frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "Development servers starting..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor White
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor White
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
