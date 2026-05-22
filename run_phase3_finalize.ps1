Write-Host "=== Phase 3 Finalize - Elevation + Dashboard Compaction ===" -ForegroundColor Cyan

# 1) Build check
Write-Host "[1/2] Running npm run build..." -ForegroundColor Cyan
Push-Location frontend
npm run build
$buildExit = $LASTEXITCODE
Pop-Location
if ($buildExit -eq 0) {
    Write-Host "[1/2] BUILD PASSED" -ForegroundColor Green
}
else {
    Write-Host "[1/2] BUILD FAILED (exit $buildExit)" -ForegroundColor Red
    exit 1
}

# 2) Git commit
Write-Host ""
Write-Host "[2/2] Git add + commit..." -ForegroundColor Cyan
git add -A
git commit -m "refactor(css): [P3] shadow elevation ladder + compact dashboard welcome"
Write-Host ""
git log -3 --oneline
Write-Host ""
git status

Write-Host ""
Write-Host "=== ALL 3 PHASES COMPLETE ===" -ForegroundColor Green
Write-Host "Phase 1: CSS consolidation + quarantine" -ForegroundColor Cyan
Write-Host "Phase 2: Tokenize spacing" -ForegroundColor Cyan
Write-Host "Phase 3: Shadow elevation + welcome compaction" -ForegroundColor Cyan
