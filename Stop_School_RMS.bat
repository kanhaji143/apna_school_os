@echo off
title Stop Lakshya Institute School OS
color 0c

echo =========================================================================
echo            STOPPING LAKSHYA INSTITUTE SCHOOL OS (PORT 8085)
echo =========================================================================
echo.

powershell -Command "$p = (Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force; Write-Host '[SUCCESS] School OS process stopped.' -ForegroundColor Green } else { Write-Host '[INFO] School OS is not currently running.' -ForegroundColor Yellow }"

ping 127.0.0.1 -n 3 >nul
