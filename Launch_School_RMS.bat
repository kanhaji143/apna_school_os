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
    start http://localhost:8085
    ping 127.0.0.1 -n 3 >nul
    exit /b 0
)

:: 2. Locate Node.js executable
set "NODE_EXE=node"
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    ) else (
        echo [ERROR] Node.js is not installed or not in PATH!
        echo Please ensure Node.js is installed from https://nodejs.org
        pause
        exit /b 1
    )
)

:: 3. Start server in background
echo [1/2] Initializing SQLite Database & Self-Healing Shadow Vault...
echo [2/2] Starting School OS Server on Dedicated Port 8085...
echo.

start "" /b "%NODE_EXE%" "%~dp0app\src\server.js"

:: 4. Wait for server to bind port and launch browser
ping 127.0.0.1 -n 3 >nul
start http://localhost:8085

echo =========================================================================
echo  [SUCCESS] Apna School OS (Lakshya School) is LIVE at http://localhost:8085
echo  Zero Cloud Dependency - 100% Offline Active
echo =========================================================================
ping 127.0.0.1 -n 4 >nul
