cd D:\INTRANET\Horizon
%windir%\system32\inetsrv\appcmd stop apppool /apppool.name:"HorizonPool"

REM === BACKUP: PROJECTS JSON ===
if exist Data\projects_data.json (
    echo Backing up projects_data.json...
    copy Data\projects_data.json projects_data_backup.json >nul
)

REM === BACKUP: USERS JSON ===
if exist Data\users.json (
    echo Backing up users.json...
    copy Data\users.json users_backup.json >nul
)

REM === CLEAN & REBUILD PUBLISH ===
if exist publish rmdir /s /q publish
dotnet build -c Release --no-restore
dotnet publish -c Release --no-build -o publish

REM === CREATE MINIMAL DIRECTORIES ===
mkdir publish\wwwroot\api >nul 2>&1

REM === RESTORE: PROJECTS JSON ===
if exist projects_data_backup.json (
    echo Restoring projects_data.json...
    copy projects_data_backup.json Data\projects_data.json >nul
    del projects_data_backup.json
)

REM === RESTORE: USERS JSON ===
if exist users_backup.json (
    echo Restoring users.json...
    copy users_backup.json Data\users.json >nul
    del users_backup.json
)

REM === SET PERMISSIONS ===
icacls Data /grant "IIS_IUSRS":(OI)(CI)F >nul
icacls Data /grant "HorizonPool":(OI)(CI)F >nul

%windir%\system32\inetsrv\appcmd start apppool /apppool.name:"HorizonPool"

echo.
echo ========================================
echo ? Publish completed successfully!
echo Data folder retained and synced!
echo ========================================
pause
