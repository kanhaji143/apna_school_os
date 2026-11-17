@echo off
title Backup Lakshya Institute Database
color 0b

echo =========================================================================
echo            LAKSHYA INSTITUTE OF CHILD EDUCATION - DATA BACKUP
echo =========================================================================
echo.

set "BACKUP_DIR=%~dp0backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "DATETAG=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%"

set "SRC_DB=D:\APNA_RMS_DATA\apna_records.db"
if not exist "%SRC_DB%" set "SRC_DB=%LOCALAPPDATA%\APNA_Computer_RMS\vault\apna_records.vault.db"

set "DEST_FILE=%BACKUP_DIR%\lakshya_backup_%DATETAG%.db"

if exist "%SRC_DB%" (
    copy /Y "%SRC_DB%" "%DEST_FILE%" >nul
    echo [SUCCESS] Database backed up successfully!
    echo Saved to: %DEST_FILE%
) else (
    echo [ERROR] Source database file not found.
)

echo.
ping 127.0.0.1 -n 3 >nul
