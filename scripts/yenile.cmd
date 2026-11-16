@echo off
rem ============================================================
rem  Karvan: yuklenmis arxivi MOVCUD layihe qovlugunun uzerine yazir
rem  ve sayti ise salir. Her defe yeni qovluq yaratmaga ehtiyac qalmir.
rem
rem  Bu fayli bir defe Masaustune kopyalayin, sonra sadece ustune iki defe
rem  klikleyin. Istediyiniz qovlugu arqument kimi de vere bilersiniz:
rem      yenile.cmd            -> Masaustundeki "karvan"
rem      yenile.cmd karvan6    -> hemin adli qovluq
rem
rem  Esas is scripts\yenile.ps1 faylindadir. O fayl yenilenme zamani
rem  uzerine yazildigi ucun evvelce TEMP-e kopyalanir ve oradan islenir.
rem ============================================================
chcp 65001 >nul
setlocal
title Karvan yenilenmesi

set "PROJE=%~1"
if "%PROJE%"=="" set "PROJE=karvan"

rem 1) Skript bu faylin yanindadirsa, onu goturuk
set "PS=%~dp0yenile.ps1"
rem 2) Yoxdursa, layihe qovlugunun icinden
if not exist "%PS%" set "PS=%PROJE%\scripts\yenile.ps1"
if not exist "%PS%" set "PS=%USERPROFILE%\Desktop\%PROJE%\scripts\yenile.ps1"

if not exist "%PS%" (
  echo [X] yenile.ps1 tapilmadi.
  echo     Bu fayli layihenin scripts qovlugundan goturun ve ya duzgun
  echo     qovluq adini verin, meselen:  yenile.cmd karvan6
  goto :son
)

copy /y "%PS%" "%TEMP%\karvan-yenile.ps1" >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\karvan-yenile.ps1" "%PROJE%"

:son
echo.
pause
endlocal
