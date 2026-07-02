@echo off
cd /d "%~dp0"
title [드라이버] 픽셀에이전트
chcp 65001 > nul

:: OPENROUTER_API_KEY 환경변수가 없으면 입력 요청
if "%OPENROUTER_API_KEY%"=="" (
    set /p OPENROUTER_API_KEY="OpenRouter API 키를 입력하세요: "
)

node_modules\.bin\tsx.cmd driver/src/index.ts
pause
