@echo off
setlocal enabledelayedexpansion
title Apna School OS - Lakshya School
color 0b

echo =========================================================================
echo       APNA SCHOOL OS - AI & TECHNOLOGY DIVISION
echo             Customer Institution: Lakshya School
echo       Maintained by Apna Software Hub | Helpline: 8504985149
echo =========================================================================
echo.

cd /d "%~dp0"

:: 1. Check if server is already running on port 8085
netstat -ano | findstr /R /C:":8085 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] School OS is already running on port 8085!
    echo [INFO] Opening School Management Dashboard in your browser...
    start http://127.0.0.1:8085
    exit /b 0
)

:: 2. Locate Node.js executable (bundled or installed)
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
    timeout /t 5 /nobreak >nul
    exit /b 1
)

:: 3. Start server in background
echo [1/2] Initializing SQLite Database & Self-Healing Shadow Vault...
echo [2/2] Starting School OS Server on Dedicated Port 8085...
echo Using runtime: %NODE_EXE%
echo.

start "" /b "%NODE_EXE%" "%~dp0app\src\server.js"

:: 4. Wait for server to bind port and launch browser
timeout /t 2 /nobreak >nul
start http://127.0.0.1:8085

echo =========================================================================
echo Server is running in the background. You can close this window anytime.
echo To stop the server, run Stop_School_RMS.bat
echo =========================================================================
