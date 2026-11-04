@echo off
rem Double-click to start the VFD 200 SCADA simulator and open the SCADA screen and the 3D twin in your browser.
rem Close this window to stop the simulator.
title VFD 200 SCADA simulator
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org ^(version 18 or newer^), then double-click this file again.
  pause
  exit /b 1
)
node scada-sim.mjs --open
pause
