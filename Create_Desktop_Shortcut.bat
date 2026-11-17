@echo off
title Create Desktop Shortcut - Lakshya Institute School OS
color 0a

echo =========================================================================
echo       CREATING DESKTOP SHORTCUT FOR LAKSHYA INSTITUTE SCHOOL OS
echo =========================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET=%SCRIPT_DIR%Launch_School_RMS.bat"
set "VBS_TARGET=%SCRIPT_DIR%Lakshya_School_OS.vbs"
set "SHORTCUT=%USERPROFILE%\Desktop\Lakshya School OS.lnk"

powershell -Command "$s = (New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%VBS_TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Lakshya Institute Of Child Education - School Management OS'; $s.IconLocation = 'shell32.dll,264'; $s.Save()"

if exist "%SHORTCUT%" (
    echo [SUCCESS] Desktop shortcut created successfully on your Windows Desktop!
    echo Name: "Lakshya School OS"
) else (
    echo [INFO] Fallback creation...
    powershell -Command "$s = (New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"
)

echo.
echo You can now start Lakshya School OS anytime directly from your Desktop!
echo =========================================================================
ping 127.0.0.1 -n 3 >nul
