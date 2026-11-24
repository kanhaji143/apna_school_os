@echo off
title Stop Apna School OS Server
color 0C
echo ==============================================================================
echo   Stopping Apna School OS Dedicated Server...
echo ==============================================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8085') do (
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo [OK] Apna School OS server on port 8085 was terminated cleanly.
) else (
    echo [INFO] No running Apna School OS server found on port 8085.
)

timeout /t 2 >nul
