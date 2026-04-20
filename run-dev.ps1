# PowerShell script to run both backend and frontend development servers
# Usage: .\run-dev.ps1

$ErrorActionPreference = "Stop"

Write-Host "Starting development environment..." -ForegroundColor Cyan
Write-Host "Root: $PSScriptRoot" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Verify directories exist
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: Backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: Frontend directory not found at $frontendPath" -ForegroundColor Red
    exit 1
}

# Create jobs for backend and frontend
Write-Host "Starting Backend..." -ForegroundColor Green
$backendJob = Start-Job -WorkingDirectory $backendPath -ScriptBlock {
    npm run dev
}

Write-Host "Waiting 2 seconds before starting Frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting Frontend..." -ForegroundColor Green
$frontendJob = Start-Job -WorkingDirectory $frontendPath -ScriptBlock {
    npm run dev
}

Write-Host "Both services are starting..." -ForegroundColor Green
Write-Host "Backend Job ID: $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Wait for jobs and display output
$backendJob | Receive-Job -Wait -AutoRemoveJob
$frontendJob | Receive-Job -Wait -AutoRemoveJob
