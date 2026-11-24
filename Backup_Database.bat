@echo off
title Apna School OS - 1-Click Database Backup
color 0B
echo ==============================================================================
echo   Apna School OS - 1-Click Instant Safe Backup Utility
echo   Apna Software Hub | Official Helpline: 8504985149 / 8303324088
echo ==============================================================================
echo.

set "BACKUP_DIR=D:\Apna_School_OS_Data\manual_backups"
if not exist "D:\" set "BACKUP_DIR=%LOCALAPPDATA%\Apna_School_OS_Data\manual_backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" 2>nul

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "dt=%%I"
if "%dt%"=="" (
    set "TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%"
    set "TIMESTAMP=%TIMESTAMP: =0%"
) else (
    set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
)

set "SOURCE_DB="
if exist "D:\Apna_School_OS_Data\apna_records.db" (
    set "SOURCE_DB=D:\Apna_School_OS_Data\apna_records.db"
) else if exist "%LOCALAPPDATA%\Apna_School_OS_Data\apna_records.db" (
    set "SOURCE_DB=%LOCALAPPDATA%\Apna_School_OS_Data\apna_records.db"
) else if exist "%LOCALAPPDATA%\APNA_Computer_RMS\vault\apna_records.vault.db" (
    set "SOURCE_DB=%LOCALAPPDATA%\APNA_Computer_RMS\vault\apna_records.vault.db"
)

if not "%SOURCE_DB%"=="" (
    copy /Y "%SOURCE_DB%" "%BACKUP_DIR%\apna_records_backup_%TIMESTAMP%.db" >nul
    echo [SUCCESS] Database Backup Created Successfully!
    echo Location: %BACKUP_DIR%\apna_records_backup_%TIMESTAMP%.db
) else (
    echo [WARNING] No database file found to backup yet.
)

echo.
echo ==============================================================================
echo Backup completed. Press any key to exit.
echo ==============================================================================
pause >nul
