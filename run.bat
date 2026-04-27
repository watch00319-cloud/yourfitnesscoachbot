@echo off
setlocal
:: Set the bot folder path
cd /d "%~dp0"
color 0E
set "BOT_PORT=11000"
set "BOT_DISABLE_QR_OPEN=false"

:RESTART
cls
echo ====================================================
echo    FitCoach AI - Smart Startup ^& Recovery
echo ====================================================
echo Status: Starting... [%DATE% %TIME%]
echo.

echo [1/4] Cleaning up environment...
:: Kill only the process using this bot's port
powershell -Command "$conn = Get-NetTCPConnection -LocalPort %BOT_PORT% -ErrorAction SilentlyContinue | Select-Object -First 1; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: Delete Puppeteer lock files to prevent "Browser already running" error
powershell -Command "Get-ChildItem '.wwebjs_auth_v2' -Recurse -Filter 'SingletonLock' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [2/4] Checking internet connection...
ping google.com -n 1 -w 3000 >nul 2>&1
if errorlevel 1 (
    echo [!] WARNING: No internet! Checking again in 10s...
    timeout /t 10 >nul
    goto RESTART
)
echo [+] Internet connection active.

echo [3/4] Starting the Bot Service...
echo.
:: Start the bot
node "%~dp0index.js"

set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ====================================================
echo [!] Bot stopped or crashed!
echo     Exit code: %EXIT_CODE%
echo     Restarting automatically in 10 seconds...
echo     Press Ctrl+C to cancel.
echo ====================================================
timeout /t 10
goto RESTART
