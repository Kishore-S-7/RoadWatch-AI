@echo off
title RoadWatch AI - Backend Server
echo ========================================================
echo Starting RoadWatch AI Backend Server (FastAPI + Uvicorn)
echo Port: 8000 | Docs: http://localhost:8000/docs
echo ========================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)
set "PYTHONPATH=%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

