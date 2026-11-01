$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $root 'client')
try { & npm.cmd run build:online; if ($LASTEXITCODE -ne 0) { throw 'Online build failed.' } } finally { Pop-Location }
$release = Join-Path $root 'release/XomNhaLa-Online-Pages'
if (Test-Path $release) { Remove-Item -LiteralPath $release -Recurse -Force }
New-Item -ItemType Directory -Force -Path $release | Out-Null
Copy-Item -Path (Join-Path $root 'client/dist-online/*') -Destination $release -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'client/cloudflare/schema.sql') -Destination (Join-Path $release 'schema.sql') -Force
Copy-Item -LiteralPath (Join-Path $root 'client/wrangler.toml.example') -Destination (Join-Path $release 'wrangler.toml.example') -Force
Copy-Item -LiteralPath (Join-Path $root 'client/firebase.database.rules.json') -Destination (Join-Path $release 'firebase.database.rules.json') -Force
Copy-Item -LiteralPath (Join-Path $root 'client/.env.online.example') -Destination (Join-Path $release '.env.online.example') -Force
Copy-Item -LiteralPath (Join-Path $root 'client/ONLINE-UNO-SETUP.md') -Destination (Join-Path $release 'ONLINE-UNO-SETUP.md') -Force
Copy-Item -LiteralPath (Join-Path $root 'release/HUONG-DAN-ONLINE.md') -Destination (Join-Path $release 'HUONG-DAN-ONLINE.md') -Force
Write-Output "Online Pages build ready: $release"
