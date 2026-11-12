@echo off
title Push RoadWatch AI to GitHub
echo ========================================================
echo Pushing RoadWatch AI to GitHub Repository
echo Repository: https://github.com/Kishore-S-7/RoadWatch-AI.git
echo ========================================================
echo.
set "PATH=C:\Users\kisho\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
cd /d "%~dp0"

echo Staging all changes...
git add .

echo Current branch: main
git branch -M main

echo.
echo Pushing to origin main...
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo SUCCESS: Code successfully pushed to GitHub!
    echo https://github.com/Kishore-S-7/RoadWatch-AI
    echo ========================================================
) else (
    echo ========================================================
    echo Push did not complete.
    echo If GitHub requests authentication, sign in with your
    echo GitHub account in the browser or use a Personal Access Token.
    echo ========================================================
)
echo.
pause
