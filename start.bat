@echo off
title Cake Shop
cd /d "%~dp0"

echo.
echo  =========================================
echo    CAKE SHOP - Starting Dev Servers
echo  =========================================
echo.
echo  API  ^>  http://localhost:3000
echo  Web  ^>  http://localhost:5173
echo.
echo  Catalog:    http://localhost:5173/catalog
echo  3D Builder: http://localhost:5173/custom-cake
echo  Admin:      http://localhost:5173/admin/orders
echo.
echo  Logins:
echo    Admin:    admin@cakeshop.dev    /  Admin1234
echo    Customer: customer@cakeshop.dev /  Customer1234
echo.
echo  =========================================
echo.

REM Open browser after servers have time to boot
start "" cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:5173/catalog"

REM Start API server in its own window
start "API :3000" cmd /k "cd /d "%~dp0apps\api" && node ..\..\node_modules\@nestjs\cli\bin\nest.js start --watch"

REM Short delay so API window appears first
timeout /t 2 /nobreak >nul

REM Start Web server in its own window
start "Web :5173" cmd /k "cd /d "%~dp0apps\web" && ..\..\node_modules\.bin\vite.cmd"

echo  Both servers are starting in their own windows.
echo  Browser will open in ~12 seconds.
echo  Close this window — servers stay running.
echo.
pause
