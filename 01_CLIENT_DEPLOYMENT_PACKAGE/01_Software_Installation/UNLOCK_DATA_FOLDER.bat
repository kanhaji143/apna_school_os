@echo off
chcp 65001 >nul
cls
echo ===============================================================================
echo      APNA SCHOOL OS - UNLOCK DATA FOLDER (रखरखाव हेतु फोल्डर अनलॉक)
echo ===============================================================================
echo.
icacls "D:\Apna_School_OS_Data" /remove:d Everyone >nul 2>&1
echo [SUCCESS] फोल्डर अनलॉक हो गया है। अब आवश्यकतानुसार संपादन या बैकअप लिया जा सकता है।
echo.
pause
