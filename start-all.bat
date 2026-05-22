@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_READY_URL=http://localhost:4000/system/ready"
set "FRONTEND_URL=http://localhost:5173/"
if not defined STARTUP_TIMEOUT_SECONDS set "STARTUP_TIMEOUT_SECONDS=90"

call :print_header
call :select_launch_plan || exit /b 1
call :validate_plan || exit /b 1
call :execute_plan
exit /b %errorlevel%

:print_header
echo =======================================
echo   Rafiq Al-Quran Launch Gate
echo =======================================
echo.
echo Choose one ordered startup plan:
echo   1. Backend only
echo   2. Frontend only
echo   3. Mobile only
echo   4. Backend then Frontend
echo   5. Backend then Frontend then Mobile
echo   0. Exit
echo.
exit /b 0

:select_launch_plan
if defined STARTUP_PLAN (
  set "LAUNCH_PLAN=%STARTUP_PLAN%"
  echo Startup plan from STARTUP_PLAN=%LAUNCH_PLAN%
  exit /b 0
)

choice /C 123450 /N /M "Select startup plan [1,2,3,4,5,0]: "
set "CHOICE_CODE=%errorlevel%"
if "%CHOICE_CODE%"=="6" exit /b 1
set "LAUNCH_PLAN=%CHOICE_CODE%"
exit /b 0

:validate_plan
if "%LAUNCH_PLAN%"=="1" (
  call :ensure_command npm || exit /b 1
  exit /b 0
)
if "%LAUNCH_PLAN%"=="2" (
  call :ensure_command npm || exit /b 1
  exit /b 0
)
if "%LAUNCH_PLAN%"=="3" (
  call :ensure_command flutter || exit /b 1
  exit /b 0
)
if "%LAUNCH_PLAN%"=="4" (
  call :ensure_command npm || exit /b 1
  exit /b 0
)
if "%LAUNCH_PLAN%"=="5" (
  call :ensure_command npm || exit /b 1
  call :ensure_command flutter || exit /b 1
  exit /b 0
)

echo [ERROR] Invalid startup plan "%LAUNCH_PLAN%".
exit /b 1

:execute_plan
if "%LAUNCH_PLAN%"=="1" (
  call :start_backend || exit /b 1
  goto :launch_complete
)
if "%LAUNCH_PLAN%"=="2" (
  call :start_frontend || exit /b 1
  goto :launch_complete
)
if "%LAUNCH_PLAN%"=="3" (
  call :start_mobile || exit /b 1
  goto :launch_complete
)
if "%LAUNCH_PLAN%"=="4" (
  call :start_backend || exit /b 1
  call :start_frontend || exit /b 1
  goto :launch_complete
)
if "%LAUNCH_PLAN%"=="5" (
  call :start_backend || exit /b 1
  call :start_frontend || exit /b 1
  call :start_mobile || exit /b 1
  goto :launch_complete
)
exit /b 1

:launch_complete
echo.
echo =======================================
echo Selected launch plan completed.
echo Backend : http://localhost:4000
echo Frontend: http://localhost:5173
echo =======================================
exit /b 0

:start_backend
echo [1/3] Backend
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { $response = Invoke-WebRequest -UseBasicParsing '%BACKEND_READY_URL%' -TimeoutSec 5; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } exit 1 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  echo Backend is already ready.
  echo.
  exit /b 0
)

start "Rafiq Backend" cmd /k call "%ROOT%run-backend.bat"
call :wait_for_url "%BACKEND_READY_URL%" %STARTUP_TIMEOUT_SECONDS% "backend API"
if errorlevel 1 exit /b 1
echo.
exit /b 0

:start_frontend
echo [2/3] Frontend
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { $response = Invoke-WebRequest -UseBasicParsing '%FRONTEND_URL%' -TimeoutSec 5; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } exit 1 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  echo Frontend is already running.
  echo.
  exit /b 0
)

start "Rafiq Frontend" cmd /k call "%ROOT%run-frontend.bat"
call :wait_for_url "%FRONTEND_URL%" 60 "frontend"
if errorlevel 1 exit /b 1
echo.
exit /b 0

:start_mobile
echo [3/3] Mobile
start "Rafiq Mobile" cmd /k call "%ROOT%run-mobile.bat"
echo Mobile launcher opened.
exit /b 0

:ensure_command
where.exe %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Required command "%~1" was not found in PATH.
  exit /b 1
)
exit /b 0

:wait_for_url
setlocal
set "WAIT_URL=%~1"
set "WAIT_NAME=%~3"
set /a WAIT_SECONDS=%~2

if not defined WAIT_NAME set "WAIT_NAME=%WAIT_URL%"
if "%WAIT_SECONDS%"=="" set /a WAIT_SECONDS=60

echo Waiting for %WAIT_NAME% to become ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $url='%WAIT_URL%'; $deadline=(Get-Date).AddSeconds(%WAIT_SECONDS%); do { try { $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 5; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } } catch { } Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Timed out waiting for %WAIT_NAME% on %WAIT_URL%.
  endlocal & exit /b 1
)

echo %WAIT_NAME% is ready.
endlocal & exit /b 0
