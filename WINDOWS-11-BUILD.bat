@echo off
title Smart Kisti Manager - Windows 11 Setup Builder
echo.
echo Smart Kisti Manager v11
echo ==============================
where node >nul 2>nul
if errorlevel 1 (
 echo.
 echo Node.js পাওয়া যায়নি।
 echo GitHub Actions ব্যবহার করতে চাইলে WINDOWS-11-SETUP-GUIDE-BN.txt পড়ুন।
 echo.
 pause
 exit /b 1
)
echo Installing dependencies...
call npm install
if errorlevel 1 goto fail
echo Building Setup.exe...
call npm run build
if errorlevel 1 goto fail
echo.
echo সফলভাবে build হয়েছে।
echo dist folder খুলুন এবং Setup EXE চালান।
explorer dist
pause
exit /b 0
:fail
echo.
echo Build ব্যর্থ হয়েছে।
pause
exit /b 1
