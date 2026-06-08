@echo off
setlocal EnableExtensions

set "APP_NAME=Rafiq Al-Quran Backend"
set "APP_DIR=%~dp0backend"
set "APP_URL=http://localhost:4000"

call :print_header
call :validate_environment || exit /b 1
call :run_backend
exit /b %errorlevel%

:print_header
echo =======================================
echo   %APP_NAME%
echo =======================================
echo.
exit /b 0

:validate_environment
call :ensure_command npm || exit /b 1

cd /d "%APP_DIR%" || (
  echo [ERROR] Backend directory was not found.
  exit /b 1
)

if not exist package.json (
  echo [ERROR] backend\package.json is missing.
  exit /b 1
)

if not exist node_modules (
  echo [ERROR] Backend dependencies are missing. Run npm install inside backend first.
  exit /b 1
)

if not defined BACKEND_RUN_MODE set "BACKEND_RUN_MODE=build"
if not defined BACKGROUND_JOBS_ENABLED set "BACKGROUND_JOBS_ENABLED=false"
exit /b 0

:run_backend
echo Backend URL: %APP_URL%
echo Database: localhost/rafiq_v2
echo.
if /I "%BACKEND_RUN_MODE%"=="watch" (
  echo Backend run mode: watch
  call npm.cmd run dev
  exit /b %errorlevel%
)

echo Backend run mode: build
call npm.cmd run build || exit /b %errorlevel%
call node dist\app\server.js
exit /b %errorlevel%

:ensure_command
where.exe %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Required command "%~1" was not found in PATH.
  exit /b 1
)
exit /b 0
