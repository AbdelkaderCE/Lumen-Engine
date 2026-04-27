Write-Host "Starting Lumen Engine Frontend..." -ForegroundColor Cyan
$env:PORT=3000
$env:BASE_PATH="/"
pnpm --filter @workspace/search-engine dev
