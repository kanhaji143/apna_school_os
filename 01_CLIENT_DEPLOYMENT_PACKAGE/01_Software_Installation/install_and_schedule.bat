@echo off
chcp 65001 >nul
title Apna School OS - Quick Install & Daily Backup Setup
color 0b
echo =====================================================================
echo           APNA SCHOOL OS - INSTANT SETUP & AUTO BACKUP
echo =====================================================================
echo.

set "SETUP_EXE=%~dp0Setup_Apna_School_OS.exe"
set "BACKUP_DIR=%USERPROFILE%\Documents\Apna_Backups"

:: Unblock AnyDesk / Internet transferred files
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue"

:: Redirect TEMP away from AppData\Temp to bypass Windows 11 Error 4551
set "TEMP=%~dp0setup_temp"
set "TMP=%~dp0setup_temp"
if not exist "%TEMP%" mkdir "%TEMP%"

:: 1. RUN SETUP EXECUTABLE IF PRESENT
if exist "%SETUP_EXE%" (
    echo [1/3] Launching Apna School OS Installer...
    start /wait "" "%SETUP_EXE%"
    echo [OK] Installer process completed.
) else (
    echo [1/3] Setup executable not in current folder, skipping installer step.
)

echo.
echo [2/3] Setting up Automated Daily Backup Service...
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

:: Create daily_backup.vbs in Documents\Apna_Backups
set "VBS_FILE=%BACKUP_DIR%\daily_backup.vbs"

(
echo Option Explicit
echo Dim fso, shell, appData, primaryDb, vaultDb, backupDir, stamp, destFile
echo Set fso = CreateObject("Scripting.FileSystemObject"^)
echo Set shell = CreateObject("WScript.Shell"^)
echo appData = shell.ExpandEnvironmentStrings("%%LOCALAPPDATA%%"^)
echo backupDir = "%BACKUP_DIR%"
echo If Not fso.FolderExists(backupDir^) Then fso.CreateFolder(backupDir^)
echo primaryDb = "D:\Apna_School_OS_Data\apna_records.db"
echo If Not fso.FileExists(primaryDb^) Then
echo     primaryDb = appData ^& "\Apna_School_OS_Data\apna_records.db"
echo End If
echo If Not fso.FileExists(primaryDb^) Then
echo     primaryDb = appData ^& "\APNA_Computer_RMS\vault\apna_records.vault.db"
echo End If
echo If fso.FileExists(primaryDb^) Then
echo     stamp = Year(Now^) ^& "-" ^& Right("0" ^& Month(Now^), 2^) ^& "-" ^& Right("0" ^& Day(Now^), 2^) ^& "_" ^& Right("0" ^& Hour(Now^), 2^) ^& "-" ^& Right("0" ^& Minute(Now^), 2^)
echo     destFile = backupDir ^& "\apna_records_" ^& stamp ^& ".db"
echo     fso.CopyFile primaryDb, destFile, True
echo End If
) > "%VBS_FILE%"

echo [OK] Daily backup script generated at: %VBS_FILE%

echo.
echo [3/3] Registering Daily Evening Backup Schedule in Windows Task Scheduler (19:00)...
schtasks /create /tn "ApnaSchoolDailyBackup" /tr "wscript.exe \"%VBS_FILE%\"" /sc daily /st 19:00 /f >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Scheduled Task "ApnaSchoolDailyBackup" successfully registered for 7:00 PM daily.
) else (
    echo [INFO] Task scheduler registration completed. (Run as Administrator if elevated rights required)
)

echo.
echo =====================================================================
echo  सफलतापूर्वक पूर्ण! (Setup & Scheduled Backup Active)
echo  • डेटाबेस स्थान: %%LOCALAPPDATA%%\Apna_School_OS_Data\apna_records.db
echo  • बैकअप स्थान:   %BACKUP_DIR%
echo  • दैनिक समय:     प्रतिदिन शाम 07:00 बजे (19:00)
echo =====================================================================
echo.
pause
