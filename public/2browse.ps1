# 2browse.it2.sh — download, launch, and clean up Carifred's 2Browse.
#
# 2Browse is a tiny portable tool that opens a fresh, isolated browser session
# (handy for support work, second logins, quick throwaway browsing). This runs
# it in one line, then deletes the download when you close it:
#
#     irm 2browse.it2.sh | iex
#
# It pulls the exe from Carifred first and falls back to our hosted copy if
# that's unreachable. Nothing is left behind.
#
# Source: https://github.com/TheTechNetwork/2browse.it2.sh

$ErrorActionPreference = 'Stop'

# Primary = the author's site; fallback = our copy served by the Worker.
$Sources = @(
    'https://www.carifred.com/2browse/2Browse.exe',
    'https://2browse.it2.sh/2Browse.exe'
)

# Older Windows defaults to TLS 1.0; force 1.2 so the download works.
try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch { }

$dest = Join-Path $env:TEMP ("2Browse-{0}.exe" -f ([guid]::NewGuid().ToString('N')))

Write-Host 'Downloading 2Browse...' -ForegroundColor Cyan
$got = $false
foreach ($url in $Sources) {
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -ErrorAction Stop
        if ((Test-Path -LiteralPath $dest) -and (Get-Item -LiteralPath $dest).Length -gt 100kb) {
            Write-Host "  got it from $url" -ForegroundColor Gray
            $got = $true
            break
        }
    } catch {
        Write-Warning "  $url -> $($_.Exception.Message)"
    }
}
if (-not $got) {
    Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue
    throw 'Could not download 2Browse from any source.'
}

Write-Host 'Launching 2Browse — close the window when you are done.' -ForegroundColor Green
try {
    $proc = Start-Process -FilePath $dest -PassThru
    $proc.WaitForExit()
} finally {
    # Clean up the download whether 2Browse exited normally or the run was killed.
    Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path -LiteralPath $dest)) {
        Write-Host 'Cleaned up — nothing left behind.' -ForegroundColor Gray
    } else {
        Write-Warning "Could not remove $dest — delete it manually."
    }
}
