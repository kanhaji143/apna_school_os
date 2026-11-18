@echo off
setlocal enabledelayedexpansion
title Apna School OS - Lakshya School
color 0b

echo =========================================================================
echo       APNA SCHOOL OS - ENTERPRISE STANDALONE DESKTOP EDITION
echo             Customer Institution: Lakshya School
echo       Maintained by Apna Software Hub | Helpline: 8504985149
echo =========================================================================
echo.

cd /d "%~dp0"

:: 1. Locate Node.js executable (bundled engine or installed)
set "NODE_EXE="
if exist "%~dp0bin\node.exe" (
    set "NODE_EXE=%~dp0bin\node.exe"
) else if exist "%~dp0app\bin\node.exe" (
    set "NODE_EXE=%~dp0app\bin\node.exe"
) else if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
) else (
    where node >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "NODE_EXE=node"
    )
)

if "%NODE_EXE%"=="" (
    echo [ERROR] Standalone Node runtime (bin\node.exe) was not found!
    echo Please reinstall Apna School OS or contact support: +91 8504985149
    pause
    exit /b 1
)

:: 2. Check if server is already running
set "TARGET_PORT=8085"
if exist "%LOCALAPPDATA%\APNA_RMS_DATA\active_port.txt" (
    set /p TARGET_PORT=<"%LOCALAPPDATA%\APNA_RMS_DATA\active_port.txt"
)

curl.exe -s http://127.0.0.1:!TARGET_PORT!/api/health >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [INFO] School OS engine is already running on port !TARGET_PORT!!
    goto LaunchAppWindow
)

:: 3. Start server in hidden background with console output
echo [1/2] Initializing SQLite Database & Self-Healing Shadow Vault...
echo [2/2] Starting School OS Server Engine...
start "" /b "%NODE_EXE%" "%~dp0app\src\server.js"

:: Wait up to 15 seconds for server to bind port
set RETRY=0
:PingLoop
timeout /t 1 /nobreak >nul
if exist "%LOCALAPPDATA%\APNA_RMS_DATA\active_port.txt" (
    set /p TARGET_PORT=<"%LOCALAPPDATA%\APNA_RMS_DATA\active_port.txt"
)
curl.exe -s http://127.0.0.1:!TARGET_PORT!/api/health >nul 2>&1
if !ERRORLEVEL! EQU 0 goto LaunchAppWindow
set /a RETRY+=1
if !RETRY! LSS 15 goto PingLoop

echo [ERROR] Server engine did not respond in time!
echo Please check logs or run as Administrator.
pause
exit /b 1

:LaunchAppWindow
:: 4. Locate Edge Chromium or Chrome for Standalone App Window Mode
set "BROWSER_EXE="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if defined BROWSER_EXE (
    echo [INFO] Launching Dedicated Standalone Desktop Window on port !TARGET_PORT!...
    start "" "%BROWSER_EXE%" --app=http://127.0.0.1:!TARGET_PORT! --user-data-dir="%LOCALAPPDATA%\ApnaSchoolOS\app_profile" --window-size=1366,768
) else (
    echo [INFO] Opening default browser...
    start http://127.0.0.1:!TARGET_PORT!
)

echo.
echo =========================================================================
echo Apna School OS is running safely in Standalone Desktop Mode!
echo Active Port: !TARGET_PORT!
echo To stop the server when finished, run Stop_School_RMS.bat
echo =========================================================================
exit /b 0
