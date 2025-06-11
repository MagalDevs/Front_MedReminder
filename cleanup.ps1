# Clean-Up Script for MedReminder Fixes
# Run this script after verifying that the medication doses issue is fixed

# List of backup files to be removed
$backupFiles = @(
    "cardCadastrar.tsx.backup_20250611_104658",
    "cardCadastrar.tsx.backup_20250611_123458",
    "cardCadastrar.tsx.bak",
    "cardCadastrar.tsx.fixed",
    "cardCadastrar.tsx.new"
)

# List of temporary documentation files
$docFiles = @(
    "fix_dadosDoses.txt",
    "fix_remedioId.txt",
    "fix-doses.txt",
    "remedioId-fix.txt"
)

# Check which files exist and remove them
Write-Host "Cleaning up temporary backup files..." -ForegroundColor Cyan

foreach ($file in $backupFiles) {
    $path = "src\app\components\CardCadastrar\$file"
    if (Test-Path $path) {
        Remove-Item $path
        Write-Host "Removed: $path" -ForegroundColor Green
    } else {
        Write-Host "File not found: $path" -ForegroundColor Yellow
    }
}

Write-Host "`nCleaning up temporary documentation files..." -ForegroundColor Cyan

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Remove-Item $file
        Write-Host "Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nClean-up completed!" -ForegroundColor Cyan
Write-Host "Remember to keep fixed-doses-summary.md as documentation of the changes made." -ForegroundColor Cyan
