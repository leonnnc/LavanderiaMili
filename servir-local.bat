@echo off
setlocal
cd /d "%~dp0"

rem ---------------------------------------------------------------
rem  Lavanderia Mili - servidor local
rem  Doble clic para abrir la app en http://localhost:8137
rem  Cierra esta ventana para detener el servidor.
rem ---------------------------------------------------------------

set "PY=python"
where python >nul 2>nul || set "PY=py"

%PY% -c "import sys" >nul 2>nul
if errorlevel 1 goto :sinpython

echo.
echo   Lavanderia Mili - servidor local
echo   http://localhost:8137/index.html
echo   Cierra esta ventana para detenerlo.
echo.

rem Abre el navegador dos segundos despues de arrancar el servidor
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8137/index.html"

%PY% -m http.server 8137 --bind 127.0.0.1

echo.
echo Servidor detenido.
pause
exit /b 0

:sinpython
echo.
echo No se encontro Python para levantar el servidor.
echo Alternativa publicada: https://leonnnc.github.io/LavanderiaMili/
echo.
pause
exit /b 1
