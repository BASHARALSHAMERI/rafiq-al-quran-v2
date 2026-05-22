Write-Host "=== Phase 2 Finalize - Tokenize Spacing ===" -ForegroundColor Cyan

# 1) Build check
Write-Host "[1/3] Running npm run build..." -ForegroundColor Cyan
Push-Location frontend
npm run build
$buildExit = $LASTEXITCODE
Pop-Location
if ($buildExit -eq 0) {
    Write-Host "[1/3] BUILD PASSED" -ForegroundColor Green
}
else {
    Write-Host "[1/3] BUILD FAILED (exit $buildExit)" -ForegroundColor Red
    exit 1
}

# 2) Git commit
Write-Host ""
Write-Host "[2/3] Git add + commit..." -ForegroundColor Cyan
git add -A
git commit -m "refactor(css): [P2] tokenize spacing across shared, tables, admin, users"
Write-Host ""
git log -1 --oneline
Write-Host ""
git status

Write-Host ""
Write-Host "=== Phase 2 Complete ===" -ForegroundColor Cyan
