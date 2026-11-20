@echo off
title Apna School OS - Windows 10/11 Smart App Control Bypass & Setup
cd /d "%~dp0"

echo ====================================================================
echo   APNA SCHOOL OS - 1-CLICK UNBLOCK & SETUP LAUNCHER
echo   Bypasses Windows 11 Smart App Control & Mark-of-the-Web
echo ====================================================================
echo.
echo Removing Windows download block flags from all package files...
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue"

echo.
echo [OK] Files unblocked successfully!
echo Launching Setup_Apna_School_OS.exe now...
start "" "%~dp0Setup_Apna_School_OS.exe"
exit
