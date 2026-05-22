@echo off
setlocal EnableExtensions

set "APP_NAME=Rafiq Al-Quran Frontend"
set "APP_DIR=%~dp0frontend"
set "APP_URL=http://localhost:5173"

call :print_header
call :validate_environment || exit /b 1
call :run_frontend
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
  echo [ERROR] Frontend directory was not found.
  exit /b 1
)

if not exist package.json (
  echo [ERROR] frontend\package.json is missing.
  exit /b 1
)

if not exist node_modules (
  echo [ERROR] Frontend dependencies are missing. Run npm install inside frontend first.
  exit /b 1
)

if not defined FRONTEND_RUN_MODE set "FRONTEND_RUN_MODE=dist"
exit /b 0

:run_frontend
echo Frontend will be available on %APP_URL%
if /I "%FRONTEND_RUN_MODE%"=="dev" (
  echo Frontend run mode: dev
  call npm.cmd run dev
  exit /b %errorlevel%
)

if /I "%FRONTEND_RUN_MODE%"=="build" (
  echo Frontend run mode: build
  call npm.cmd run build || exit /b %errorlevel%
) else (
  echo Frontend run mode: dist
)

if not exist dist\index.html (
  echo [ERROR] Frontend dist\index.html is missing. Run a frontend build first or set FRONTEND_RUN_MODE=build.
  exit /b 1
)

call node scripts\serve-dist.cjs
exit /b %errorlevel%

:ensure_command
where.exe %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Required command "%~1" was not found in PATH.
  exit /b 1
)
exit /b 0
