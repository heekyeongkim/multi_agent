# UTF-8 강제 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$env:PYTHONUTF8 = "1"

# API 키 확인
if (-not $env:OPENROUTER_API_KEY) {
    Write-Host "오류: OPENROUTER_API_KEY 환경변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "사용법: `$env:OPENROUTER_API_KEY='sk-or-...' ; .\driver\run.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "드라이버 시작 중..." -ForegroundColor Cyan
npx tsx driver/src/index.ts
