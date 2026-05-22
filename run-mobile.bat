@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "APP_NAME=Rafiq Al-Quran Mobile"
set "APP_DIR=%~dp0rafiq_mobile"

call :print_header
call :configure_mobile || exit /b 1
call :resolve_device || exit /b 1
call :run_mobile
exit /b %errorlevel%

:print_header
echo =======================================
echo   %APP_NAME%
echo =======================================
echo.
exit /b 0

:configure_mobile
call :ensure_command flutter || exit /b 1

if defined ANDROID_SDK_ROOT (
  set "ANDROID_SDK_DIR=%ANDROID_SDK_ROOT%"
) else if defined ANDROID_HOME (
  set "ANDROID_SDK_DIR=%ANDROID_HOME%"
) else (
  set "ANDROID_SDK_DIR=C:\Android\Sdk"
)

if not defined ANDROID_EMULATOR_EXE set "ANDROID_EMULATOR_EXE=!ANDROID_SDK_DIR!\emulator\emulator.exe"
if not defined ADB_EXE set "ADB_EXE=!ANDROID_SDK_DIR!\platform-tools\adb.exe"
if not defined EMULATOR_NAME set "EMULATOR_NAME=Medium_Phone_API_36.1"
if not defined APP_FLAVOR set "APP_FLAVOR=dev"
if not defined API_BASE_URL set "API_BASE_URL=http://10.0.2.2:4000"
if defined ANDROID_DEVICE_ID set "FLUTTER_DEVICE_ID=%ANDROID_DEVICE_ID%"
exit /b 0

:resolve_device
call :detect_connected_device

if not defined FLUTTER_DEVICE_ID (
  if not exist "!ANDROID_EMULATOR_EXE!" (
    echo [ERROR] Android emulator executable was not found at "!ANDROID_EMULATOR_EXE!".
    exit /b 1
  )

  echo Launching Android emulator !EMULATOR_NAME!...
  start "Rafiq Android Emulator" "!ANDROID_EMULATOR_EXE!" -avd "!EMULATOR_NAME!"
  call :wait_for_android_emulator || exit /b 1
  call :detect_connected_device
)

if not defined FLUTTER_DEVICE_ID (
  echo [ERROR] No Android device was detected for Flutter.
  exit /b 1
)

echo Using Android device !FLUTTER_DEVICE_ID!.
exit /b 0

:run_mobile
cd /d "%APP_DIR%" || (
  echo [ERROR] Mobile directory was not found.
  exit /b 1
)

if not exist pubspec.yaml (
  echo [ERROR] rafiq_mobile\pubspec.yaml is missing.
  exit /b 1
)

echo Mobile app will use API_BASE_URL=!API_BASE_URL!
call flutter.bat run -d !FLUTTER_DEVICE_ID! --flavor !APP_FLAVOR! --dart-define=APP_FLAVOR=!APP_FLAVOR! --dart-define=API_BASE_URL=!API_BASE_URL!
exit /b %errorlevel%

:detect_connected_device
if defined ANDROID_DEVICE_ID (
  set "FLUTTER_DEVICE_ID=%ANDROID_DEVICE_ID%"
  exit /b 0
)

set "FLUTTER_DEVICE_ID="
if not exist "!ADB_EXE!" exit /b 0

for /f "skip=1 tokens=1,2" %%A in ('"!ADB_EXE!" devices') do (
  if "%%B"=="device" (
    if not defined FLUTTER_DEVICE_ID set "FLUTTER_DEVICE_ID=%%A"
    echo %%A| findstr /b /c:"emulator-" >nul
    if not errorlevel 1 set "FLUTTER_DEVICE_ID=%%A"
  )
)
exit /b 0

:wait_for_android_emulator
if not exist "!ADB_EXE!" (
  echo [ERROR] adb was not found at "!ADB_EXE!".
  exit /b 1
)

echo Waiting for the Android emulator to boot...
for /l %%I in (1,1,120) do (
  set "EMULATOR_DEVICE_ID="
  set "BOOT_COMPLETED="

  for /f "skip=1 tokens=1,2" %%A in ('"!ADB_EXE!" devices') do (
    if "%%B"=="device" (
      echo %%A| findstr /b /c:"emulator-" >nul
      if not errorlevel 1 set "EMULATOR_DEVICE_ID=%%A"
    )
  )

  if defined EMULATOR_DEVICE_ID (
    for /f "delims=" %%A in ('"!ADB_EXE!" -s !EMULATOR_DEVICE_ID! shell getprop sys.boot_completed 2^>nul') do set "BOOT_COMPLETED=%%A"
    if "!BOOT_COMPLETED!"=="1" (
      call :sleep_seconds 2
      echo Android emulator is ready.
      exit /b 0
    )
  )

  call :sleep_seconds 1
)

echo [ERROR] Timed out waiting for the Android emulator to boot.
exit /b 1

:ensure_command
where.exe %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Required command "%~1" was not found in PATH.
  exit /b 1
)
exit /b 0

:sleep_seconds
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds %~1" >nul 2>&1
exit /b 0
