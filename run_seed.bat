@echo off
title RoadWatch AI - Seed Script
echo ========================================================
echo Seeding Database with Default Admin & Sample Projects
echo ========================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)
set "PYTHONPATH=%~dp0backend"
python -m app.seed --reset
pause

