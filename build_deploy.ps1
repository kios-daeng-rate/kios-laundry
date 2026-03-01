# build_deploy.ps1
# Script untuk menyiapkan folder produksi (API + Dist) tanpa kredensial lokal.

$deployFolder = "deploy_prod"
$distFolder = "dist"
$apiFolder = "api"

Write-Host "--- Memulai Proses Build & Deploy ---" -ForegroundColor Cyan

# 1. Jalankan Build Frontend
Write-Host "[1/4] Menjalankan npm run build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build gagal!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Siapkan Folder Deploy
Write-Host "[2/4] Menyiapkan folder $deployFolder..." -ForegroundColor Yellow
if (Test-Path $deployFolder) {
    Remove-Item -Recurse -Force $deployFolder
}
New-Item -ItemType Directory -Path $deployFolder | Out-Null

# 3. Salin Hasil Build (Dist) ke Root Deploy
Write-Host "[3/4] Menyalin isi $distFolder ke root..." -ForegroundColor Yellow
Copy-Item -Path "$distFolder\*" -Destination $deployFolder -Recurse

# 4. Salin API Folder dan Bersihkan Kredensial
Write-Host "[4/4] Menyalin folder $apiFolder dan membersihkan konfigurasi..." -ForegroundColor Yellow
$destApi = Join-Path $deployFolder $apiFolder
Copy-Item -Path $apiFolder -Destination $deployFolder -Recurse

# Hapus file sensitif agar "polosan"
$sensitiveFiles = @(
    (Join-Path $destApi "config.php"),
    (Join-Path $destApi "email_config.php")
)

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "      - $file dihapus (Aman)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "--- SELESAI! ---" -ForegroundColor Green
Write-Host "Isi folder '$deployFolder' siap untuk di-upload/deploy ke Github atau Server Baru."
Write-Host "Folder ini berisi Frontend (dist) dan Backend (api) yang sudah bersih."
