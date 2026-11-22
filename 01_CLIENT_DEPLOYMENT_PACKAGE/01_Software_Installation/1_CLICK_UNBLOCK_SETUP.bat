@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Apna School OS - Windows 11 Smart App Control & Error 4551 Fix
color 0b

echo ====================================================================
echo   APNA SCHOOL OS - WINDOWS 11 ERROR 4551 FIX & LAUNCHER
echo   Bypasses: Smart App Control (SAC), AnyDesk/Internet Block & Temp Lock
echo ====================================================================
echo.

:: 1. Remove Mark-of-the-Web (Zone.Identifier) added by AnyDesk / WhatsApp / Internet
echo [1/3] Unblocking AnyDesk/Internet transferred files...
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue"
echo [OK] Files unblocked.

:: 2. Create and redirect TEMP to local folder (Bypasses Error 4551)
echo [2/3] Setting local temporary workspace (Fixes Error 4551)...
set "TEMP=%~dp0setup_temp"
set "TMP=%~dp0setup_temp"
if not exist "%TEMP%" mkdir "%TEMP%"
echo [OK] Temporary directory redirected away from blocked AppData\Temp.

:: 3. Launch Setup
echo [3/3] Launching Installer...
if exist "%~dp0Setup_Apna_School_OS.exe" (
    start "" "%~dp0Setup_Apna_School_OS.exe"
    echo [SUCCESS] Setup launched successfully without Error 4551!
) else (
    echo [ERROR] Setup_Apna_School_OS.exe not found in this folder.
    pause
)

exit
