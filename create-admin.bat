@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Karvan - admin yarat
echo.
echo  ==========================================
echo    Karvan: admin hesabi yaratmaq
echo  ==========================================
echo.
echo  Hesab varsa rolu deyisir, yoxdursa yenisini yaradir.
echo.
if not exist node_modules (
  echo  Paketler qurasdirilir, bir az gozleyin...
  call npm install
)
:email
set "EMAIL="
set /p EMAIL= E-poct: 
if "%EMAIL%"=="" goto email
:pass
set "PASS="
set /p PASS= Sifre (en azi 10 simvol, movcud hesab ucun bos buraxin): 
echo.
echo  Rol:
echo    1 - Admin (istifadecileri idare edir)
echo    2 - Super admin (adminleri de idare edir, istifadeci kimi daxil ola bilir)
set "ROLE=1"
set /p ROLE= Secim [1]: 
set "FLAG="
if "%ROLE%"=="2" set "FLAG=--super"
echo.
call npm run --silent admin -- "%EMAIL%" %PASS% %FLAG%
echo.
if errorlevel 1 (
  echo  Alinmadi. Yuxaridaki xetaya baxin.
) else (
  echo  Hazirdir. Sayti acin: http://localhost:3000/login
)
echo.
pause
endlocal
