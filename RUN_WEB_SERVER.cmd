@echo off
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=3000
cd /d "%~dp0"
node ".\scripts\serve-next.mjs" %PORT%
