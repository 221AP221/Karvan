# Karvan: yüklənmiş arxivi MÖVCUD layihə qovluğunun üzərinə yazır.
#
# İstifadə (adətən yenile.cmd vasitəsilə çağırılır):
#   .\yenile.ps1                 → Masaüstündəki "karvan" qovluğu
#   .\yenile.ps1 karvan6         → həmin adlı qovluq
#   .\yenile.ps1 C:\yol\karvan   → tam yol
#   .\yenile.ps1 karvan6 -Dev:$false   → yeniləyir, amma saytı işə salmır
#
# Niyə lazımdır: arxivi birbaşa üzərinə açanda işləyən server faylları kilidləyir
# və açılma yarımçıq qalır (bir hissə yenilənir, bir hissə köhnə qalır). Bu skript
# əvvəlcə node-u dayandırır, sonra müvəqqəti qovluğa açıb oradan köçürür.
#
# Fayl UTF-8 BOM ilə saxlanılır: Windows PowerShell 5.1 onsuz Azərbaycan hərflərini pozur.

param(
  [string]$Proje = "karvan",
  [switch]$Dev = $true
)

function Info($text) { Write-Host $text }
function Ok($text) { Write-Host "[OK] $text" -ForegroundColor Green }
function Problem($text) { Write-Host "[X] $text" -ForegroundColor Red }

Write-Host ""
Write-Host "=== KARVAN YENİLƏNMƏSİ ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Layihə qovluğu ---
# Ardıcıllıq: verilən ad/yol → Masaüstündə həmin ad → Masaüstündəki ən son işlənmiş
# karvan* qovluğu. Beləcə qovluğun adı nə olursa olsun (karvan, karvan6...) işləyir
# və hər dəfə yeni qovluq yaratmağa ehtiyac qalmır.
$masaustu = [Environment]::GetFolderPath("Desktop")
$namizedler = @($Proje, (Join-Path $masaustu $Proje))
$yol = $namizedler | Where-Object { Test-Path -LiteralPath (Join-Path $_ "package.json") } | Select-Object -First 1

if (-not $yol) {
  $tapilan = Get-ChildItem -LiteralPath $masaustu -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "karvan*" -and (Test-Path -LiteralPath (Join-Path $_.FullName "package.json")) } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($tapilan) {
    $yol = $tapilan.FullName
    Write-Host "Qeyd: '$Proje' tapılmadı, Masaüstündəki ən son layihə götürüldü." -ForegroundColor Yellow
  }
}

if (-not $yol) {
  Problem "Layihə qovluğu tapılmadı: $Proje"
  Info "    Qovluğun adını verin, məsələn:  yenile.cmd karvan6"
  return
}
$yol = (Resolve-Path -LiteralPath $yol).Path
Info "Layihə qovluğu : $yol"

# --- 2. Ən yeni arxiv ---
$axtar = @(
  [Environment]::GetFolderPath("Desktop"),
  (Join-Path $env:USERPROFILE "Downloads")
) | Where-Object { Test-Path -LiteralPath $_ }

$zip = Get-ChildItem -Path $axtar -Filter "karvan*.zip" -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $zip) {
  Problem "karvan*.zip tapılmadı (Masaüstü və Downloads yoxlanıldı)."
  Info "    Arxivi yükləyin, sonra bu skripti yenidən işlədin."
  return
}
Info "Arxiv          : $($zip.FullName)"
Info "Arxivin tarixi : $($zip.LastWriteTime.ToString('dd.MM.yyyy HH:mm'))"
$yas = (Get-Date) - $zip.LastWriteTime
if ($yas.TotalHours -gt 24) {
  Write-Host "    Qeyd: arxiv $([int]$yas.TotalDays) gün əvvəlkidir - ən yenisini yüklədiyinizə əmin olun." -ForegroundColor Yellow
}
Write-Host ""

# --- 3. İşləyən server fayl kilidləri yaratmasın ---
$node = @(Get-Process node -ErrorAction SilentlyContinue)
if ($node.Count -gt 0) {
  Info "İşləyən server dayandırılır ($($node.Count) proses)..."
  $node | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

# --- 4. Müvəqqəti qovluğa açırıq ---
$tmp = Join-Path $env:TEMP "karvan-update"
if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

Info "Arxiv açılır..."
try {
  Expand-Archive -LiteralPath $zip.FullName -DestinationPath $tmp -Force
} catch {
  Problem "Arxiv açılmadı: $($_.Exception.Message)"
  Info "    Fayl yarımçıq yüklənmiş ola bilər - yenidən yükləyin."
  return
}

# Arxivin içində REKLAM qovluğu olur; olmasa, birbaşa kökə açılıb
$menbe = Join-Path $tmp "REKLAM"
if (-not (Test-Path -LiteralPath (Join-Path $menbe "package.json"))) { $menbe = $tmp }
if (-not (Test-Path -LiteralPath (Join-Path $menbe "package.json"))) {
  Problem "Arxivin içində layihə tapılmadı."
  return
}

# --- 5. Üzərinə köçürürük ---
# robocopy işlənir: Copy-Item qovluqları bəzən iç-içə salır, robocopy isə birləşdirir
# və kilidli faylı dəqiq göstərir. Çıxış kodu 8-dən kiçikdirsə, hər şey qaydasındadır.
Info "Fayllar köçürülür..."
$log = Join-Path $env:TEMP "karvan-robocopy.log"
robocopy $menbe $yol /E /IS /IT /R:2 /W:1 /NP /NFL /NDL /NJH /NJS "/LOG:$log" | Out-Null
$kod = $LASTEXITCODE
if ($kod -ge 8) {
  Problem "Bəzi fayllar köçürülmədi (robocopy kodu $kod)."
  Info "    VS Code və bütün terminalları bağlayıb yenidən cəhd edin."
  Info "    Ətraflı: $log"
  return
}

# Köhnə keş yeni koda qarışmasın
$next = Join-Path $yol ".next"
if (Test-Path -LiteralPath $next) { Remove-Item -LiteralPath $next -Recurse -Force -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue

Ok "Fayllar yeniləndi."
Write-Host ""

# --- 6. Paketlər ---
Set-Location -LiteralPath $yol
Info "Paketlər yoxlanılır (bir neçə dəqiqə çəkə bilər)..."
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
  Problem "npm install xəta verdi. Yuxarıdakı mətni göndərin."
  return
}

if (-not $Dev) {
  Ok "Hazırdır. İşə salmaq üçün: npm run dev"
  return
}

Write-Host ""
Write-Host "=== HAZIRDIR, sayt işə salınır ===" -ForegroundColor Cyan
Info "Brauzerdə: http://localhost:3000"
Info "Dayandırmaq üçün: Ctrl+C"
Write-Host ""
& npm run dev
