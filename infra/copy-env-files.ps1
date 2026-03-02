# copy-env-files.ps1
# Run from the infra folder
$sourceDir = "env_files"
$files = Get-ChildItem -Path $sourceDir -Filter "*.env.example" -File

foreach ($file in $files) {
    $target = Join-Path $sourceDir ($file.BaseName -replace '\.example$', '')
    if (-not (Test-Path $target)) {
        Copy-Item $file.FullName $target
        Write-Host "Created:" $target
    } else {
        Write-Host "Skipped (already exists):" $target
    }
}

Write-Host "`n✅ Environment files ready in '$sourceDir'"
