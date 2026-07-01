@echo off
title Ministry of Interior - Local Server
cd /d "C:\Users\Hossa\.claude\projects\Dubai Police\frontend"

echo.
echo  ============================================================
echo     Ministry of Interior  -  starting the local app server
echo  ============================================================
echo.
echo     * A browser tab will open automatically in ~15 seconds.
echo     * If it does not, open your browser and type:  localhost:3000
echo     * KEEP THIS BLACK WINDOW OPEN while using the app.
echo     * To STOP the app later, just close this window.
echo.
echo     Starting... please wait.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 15; Start-Process 'http://localhost:3000'"

call npm run dev

echo.
echo  The server stopped. You can close this window.
pause
