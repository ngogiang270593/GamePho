$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $projectRoot 'client')
try {
    & npm.cmd run build -- --mode offline
    if ($LASTEXITCODE -ne 0) { throw 'Offline PWA build failed.' }
} finally { Pop-Location }
$releasePath = Join-Path $projectRoot 'release'
New-Item -ItemType Directory -Force -Path $releasePath | Out-Null
$zipPath = Join-Path $releasePath 'PhoXom-Offline-PWA.zip'
# ZIP entry names must use forward slashes, including when built on Windows.
# Compress-Archive on Windows PowerShell can emit backslashes that hosting
# uploaders treat as literal filenames instead of asset directories.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$distPath = (Resolve-Path (Join-Path $projectRoot 'client/dist')).Path
$zipStream = [IO.File]::Open($zipPath, [IO.FileMode]::Create)
try {
    $archive = [IO.Compression.ZipArchive]::new($zipStream, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($assetFile in Get-ChildItem -LiteralPath $distPath -File -Recurse) {
            $entryName = $assetFile.FullName.Substring($distPath.Length + 1).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $assetFile.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $releasePath 'HUONG-DAN-OFFLINE.md'), 'HUONG-DAN-OFFLINE.md') | Out-Null
    } finally { $archive.Dispose() }
} finally { $zipStream.Dispose() }

# Check the deployable archive itself, not only the original dist directory.
$archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    if ($entryNames | Where-Object { $_.Contains('\') }) { throw 'ZIP contains invalid backslash paths.' }
    $indexEntry = $archive.GetEntry('index.html')
    if (!$indexEntry) { throw 'ZIP is missing index.html at the root.' }
    $indexReader = [IO.StreamReader]::new($indexEntry.Open())
    try { $indexText = $indexReader.ReadToEnd() } finally { $indexReader.Dispose() }
    foreach ($assetMatch in [regex]::Matches($indexText, '(?:src|href)="(/[^"?#]+)"')) {
        $assetName = $assetMatch.Groups[1].Value.TrimStart('/')
        if ($assetName -notin $entryNames) { throw "ZIP is missing an asset referenced by index.html: $assetName" }
    }
    $workerEntry = $archive.GetEntry('sw.js')
    if (!$workerEntry) { throw 'ZIP is missing the offline service worker.' }
    $workerReader = [IO.StreamReader]::new($workerEntry.Open())
    try { $workerText = $workerReader.ReadToEnd() } finally { $workerReader.Dispose() }
    $precacheMatch = [regex]::Match($workerText, 'const FILES = (\[[^\r\n]+\]);')
    if (!$precacheMatch.Success) { throw 'Cannot verify offline precache assets.' }
    foreach ($precachePath in ($precacheMatch.Groups[1].Value | ConvertFrom-Json)) {
        $assetName = $precachePath.TrimStart('/')
        if ($assetName -notin $entryNames) { throw "ZIP is missing an offline precache asset: $assetName" }
    }
} finally { $archive.Dispose() }
Write-Output "Packaged and verified: $zipPath"
