@echo off
title Apna School OS - Dedicated Server Console
color 0A
echo ==============================================================================
echo   Apna School OS Enterprise Edition - Server Console Mode
echo   Maintained by Apna Software Hub | 100%% Offline Secured
echo   Official Helpline: 8504985149 / 8303324088
echo ==============================================================================
echo.

cd /d "%~dp0"

set "NODE_EXE="
if exist "bin\node.exe" (
    set "NODE_EXE=bin\node.exe"
) else if exist "app\bin\node.exe" (
    set "NODE_EXE=app\bin\node.exe"
) else (
    set "NODE_EXE=node"
)

echo [*] Starting Apna School OS Server on http://127.0.0.1:8085 ...
echo [*] Press Ctrl+C in this console to stop server.
echo.

"%NODE_EXE%" "app\src\server.js"

pause
