@echo off
title RoadWatch AI Launcher
echo ========================================================
echo Launching RoadWatch AI Full-Stack System
echo ========================================================
echo Starting Backend (FastAPI on http://localhost:8000)...
start "RoadWatch AI - Backend" cmd /c "%~dp0run_backend.bat"

echo Starting Frontend (Vite on http://localhost:5173)...
start "RoadWatch AI - Frontend" cmd /c "%~dp0run_frontend.bat"

echo Waiting for backend API to be ready...
powershell -Command "for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 1 -UseBasicParsing; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Seconds 1 }"

echo Opening Web Portal in default browser...
start http://localhost:5173
echo.
echo Both services are online and ready!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api
echo - API Docs: http://localhost:8000/docs
echo - Login: admin@roadwatch.com / Admin@123
echo.
pause
