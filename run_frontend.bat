@echo off
title RoadWatch AI - Frontend Server
echo ========================================================
echo Starting RoadWatch AI Frontend (Vite + React)
echo URL: http://localhost:5173
echo ========================================================
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
cd /d "%~dp0frontend"
npm run dev
pause

