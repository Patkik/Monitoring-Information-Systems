@echo off
REM Batch script to run both backend and frontend development servers
REM Usage: run-dev.bat

setlocal enabledelayedexpansion

echo Starting development environment...
echo Root: %CD%

set BACKEND_DIR=%CD%\backend
set FRONTEND_DIR=%CD%\frontend

REM Verify directories exist
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found at %FRONTEND_DIR%
    exit /b 1
)

echo Starting Backend...
cd /d "%BACKEND_DIR%"
start "Mentoring Platform - Backend" cmd /k npm run dev

echo Waiting 2 seconds...
timeout /t 2 /nobreak

echo Starting Frontend...
cd /d "%FRONTEND_DIR%"
start "Mentoring Platform - Frontend" cmd /k npm run dev

cd /d "%CD%"
echo Both services are starting in separate windows...
echo Press Ctrl+C in each window to stop individual services
pause
