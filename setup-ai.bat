@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Karvan - AI qurasdirma
if not exist node_modules (
  echo Paketler qurasdirilir...
  call npm install
)
node scripts/setup-ai.mjs
echo.
pause
