@echo off
call npm install
call npm run build:portable
echo Portable EXE is inside dist\
pause
