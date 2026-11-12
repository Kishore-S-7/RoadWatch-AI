@echo off
title RoadWatch AI - Automated Test Suite
echo ========================================================
echo Running RoadWatch AI Backend Unit & Integration Tests
echo ========================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)
set "PYTHONPATH=%~dp0backend"
python -m pytest -v
pause

