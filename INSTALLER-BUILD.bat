@echo off
setlocal
title Smart Kisti Manager v10 - Windows Installer
echo.
echo  SMART KISTI MANAGER v10
echo  Windows Installer Builder
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js LTS not found.
 echo Install Node.js from https://nodejs.org/ then run this file again.
 pause
 exit /b 1
)
call npm install
if errorlevel 1 (echo Dependency installation failed.&pause&exit /b 1)
call npm run build
if errorlevel 1 (echo Windows build failed.&pause&exit /b 1)
echo.
echo BUILD COMPLETE.
echo Open the dist folder and run the Setup EXE.
pause
