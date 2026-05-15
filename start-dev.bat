@echo off
setlocal

cd /d "%~dp0"

echo Starting Zenith Mind development server...
echo Project: %cd%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found. Please install Node.js first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Please install Node.js/npm first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules not found. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Website will start at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
