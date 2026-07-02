@echo off
cd /d "%~dp0"
title [서버] 픽셀에이전트
chcp 65001 > nul
node dist/cli.js
pause
