$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression

$clientRoot = Split-Path $PSScriptRoot -Parent
$distRoot = Join-Path $clientRoot 'dist'
$outputPath = Join-Path (Split-Path $clientRoot -Parent) 'release\PhoXom-Offline-PWA.zip'
$indexPath = Join-Path $distRoot 'index.html'

if (!(Test-Path $indexPath)) {
  throw 'Missing client/dist/index.html. Run npm run build first.'
}

$requiredFiles = @('index.html', 'manifest.webmanifest', 'sw.js')
foreach ($file in $requiredFiles) {
  if (!(Test-Path (Join-Path $distRoot $file))) {
    throw "Missing required PWA file: $file"
  }
}

$html = Get-Content $indexPath -Raw
$assetPaths = [regex]::Matches($html, '(?:src|href)="(/?assets/[^"]+)"') |
  ForEach-Object { $_.Groups[1].Value.TrimStart('/') }
foreach ($assetPath in $assetPaths) {
  if (!(Test-Path (Join-Path $distRoot ($assetPath -replace '/', '\')))) {
    throw "Missing asset referenced by index.html: $assetPath"
  }
}

[System.IO.Directory]::CreateDirectory((Split-Path $outputPath -Parent)) | Out-Null
$stream = $null
$archive = $null
try {
  $stream = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
  $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)

  Get-ChildItem $distRoot -File -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($distRoot.Length).TrimStart('\', '/') -replace '\\', '/'
    $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
    $sourceStream = [System.IO.File]::OpenRead($_.FullName)
    $entryStream = $entry.Open()
    try {
      $sourceStream.CopyTo($entryStream)
    } finally {
      $entryStream.Dispose()
      $sourceStream.Dispose()
    }
  }
} finally {
  if ($null -ne $archive) {
    $archive.Dispose()
  } elseif ($null -ne $stream) {
    $stream.Dispose()
  }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$verify = [System.IO.Compression.ZipFile]::OpenRead($outputPath)
try {
  $entryNames = @($verify.Entries | ForEach-Object FullName)
  foreach ($assetPath in $assetPaths) {
    if ($assetPath -notin $entryNames) {
      throw "ZIP is missing an asset referenced by index.html: $assetPath"
    }
  }
  foreach ($file in $requiredFiles) {
    if ($file -notin $entryNames) {
      throw "ZIP is missing a required PWA file: $file"
    }
  }
  if ($entryNames | Where-Object { $_ -match '\\' }) {
    throw 'ZIP contains backslashes in entry paths; hosting may not find assets.'
  }
} finally {
  $verify.Dispose()
}

Get-Item $outputPath | Select-Object FullName, Length, LastWriteTime
