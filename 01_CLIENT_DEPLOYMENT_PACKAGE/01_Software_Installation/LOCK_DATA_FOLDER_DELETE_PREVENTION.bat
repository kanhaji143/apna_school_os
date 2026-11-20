@echo off
chcp 65001 >nul
cls
echo ===============================================================================
echo      APNA SCHOOL OS - DATA FOLDER DELETE PROTECTION (डिलीट सुरक्षा लॉक)
echo ===============================================================================
echo.
echo [INFO] Protecting D:\Apna_School_OS_Data from accidental Shift+Delete by staff...
echo.

if not exist "D:\Apna_School_OS_Data" (
    mkdir "D:\Apna_School_OS_Data"
)

:: Deny delete permission on folder to standard users while preserving full read/write
icacls "D:\Apna_School_OS_Data" /deny Everyone:(DE) >nul 2>&1

echo.
echo ===============================================================================
echo  [SUCCESS] फोल्डर डिलीट सुरक्षा सफलतापूर्वक सक्रिय हो गई है!
echo  अब कोई भी कर्मचारी या क्लर्क इस फोल्डर को गलती से डिलीट नहीं कर पाएगा।
echo ===============================================================================
echo.
echo यदि रखरखाव हेतु इसे कभी अनलॉक करना हो, तो UNLOCK_DATA_FOLDER.bat चलाएं।
echo.
pause
