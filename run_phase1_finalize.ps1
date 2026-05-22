Write-Host "=== Phase 1 Finalize Script ===" -ForegroundColor Cyan

# 1) Ensure __legacy directory exists
New-Item -ItemType Directory -Force -Path frontend\__legacy | Out-Null
Write-Host "[1/6] __legacy directory ready" -ForegroundColor Green

# 2) Move final-polish-v4.css to quarantine (if still in original location)
if (Test-Path "frontend\src\styles\pages\final-polish-v4.css") {
    Move-Item -Force "frontend\src\styles\pages\final-polish-v4.css" "frontend\__legacy\final-polish-v4.css"
    Write-Host "[2/6] final-polish-v4.css moved to __legacy" -ForegroundColor Green
} else {
    Write-Host "[2/6] final-polish-v4.css already moved (skipped)" -ForegroundColor Yellow
}

# 3) Verify enterprise-overrides.css is in __legacy
if (Test-Path "frontend\__legacy\enterprise-overrides.css") {
    Write-Host "[3/6] enterprise-overrides.css confirmed in __legacy" -ForegroundColor Green
} else {
    Write-Host "[3/6] WARNING: enterprise-overrides.css NOT in __legacy!" -ForegroundColor Red
}

# 4) Build check
Write-Host "`n[4/6] Running npm run build..." -ForegroundColor Cyan
Push-Location frontend
npm run build
$buildExit = $LASTEXITCODE
Pop-Location
if ($buildExit -eq 0) {
    Write-Host "[4/6] BUILD PASSED" -ForegroundColor Green
} else {
    Write-Host "[4/6] BUILD FAILED (exit $buildExit)" -ForegroundColor Red
    exit 1
}

# 5) Verify imports are removed from index.css
Write-Host "`n[5/6] Checking index.css for removed imports..." -ForegroundColor Cyan
$found = Select-String -Path frontend\src\index.css -Pattern "final-polish-v4|enterprise-overrides" -ErrorAction SilentlyContinue
if ($found) {
    Write-Host "[5/6] WARNING: Still found references:" -ForegroundColor Red
    $found | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "[5/6] CLEAN - no references to removed files" -ForegroundColor Green
}

# 6) Git commit
Write-Host "`n[6/6] Git add + commit..." -ForegroundColor Cyan
git add -A
git commit -m "refactor(css): [P1-B1.1+B1.2+B1.3+B1.4] merge all overrides, quarantine to __legacy"
Write-Host ""
git log -1 --oneline
Write-Host ""
git status

Write-Host "`n=== Phase 1 Complete ===" -ForegroundColor Cyan
