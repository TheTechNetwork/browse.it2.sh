# browse.it2.sh — portable browser launcher TUI
#
# A get.activated.win-style menu for launching a portable browser on any box in
# one line — download, run, then clean up (nothing installed, nothing left
# behind). Handy for backstage/support work: a throwaway session, a second
# login, a quick test in a clean profile.
#
#     irm browse.it2.sh | iex            # menu (2Browse is the default)
#     irm browse.it2.sh/2browse | iex    # straight to 2Browse
#     irm browse.it2.sh/kmeleon | iex    # straight to K-Meleon
#
# Every browser uses the same fallback style: download from the vendor first,
# then from our GitHub mirror if the vendor URL is down or has rotted. 2Browse
# also ships a copy in this repo, so it always works offline of the vendor.
#
# Source: https://github.com/TheTechNetwork/2browse.it2.sh

$ErrorActionPreference = 'Stop'

# The Worker may inject $script:LaunchCommand and $script:BrowseTarget ahead of
# this script (path routing), so only default them when nothing was injected.
if (-not $script:LaunchCommand) { $script:LaunchCommand = 'irm browse.it2.sh | iex' }

# GitHub Release that mirrors the portable-browser binaries. Upload each browser
# here (tag `browsers`) so the fallback works when a vendor URL rots.
$MirrorBase = 'https://github.com/TheTechNetwork/2browse.it2.sh/releases/download/browsers'

# ---------------------------------------------------------------------------
# Browser registry — the single source of truth for the menu.
#
#   Key/Name/Blurb : menu display + path target
#   Default        : picked when you press Enter with no choice
#   Type           : 'exe' (run directly) or 'zip' (extract, then run Exe)
#   Exe            : for zip types, the browser exe to launch inside the archive
#   Url            : vendor download (best-effort; may be $null if none is stable)
#   Fallback       : our mirror copy — the reliable source
# ---------------------------------------------------------------------------
$script:Browsers = @(
    [pscustomobject]@{
        Key = '2browse'; Name = '2Browse'; Default = $true
        Blurb = "Carifred 2Browse — fresh, isolated browser session (~1 MB)"
        Type = 'exe'; Exe = $null
        Url = 'https://www.carifred.com/2browse/2Browse.exe'
        Fallback = 'https://2browse.it2.sh/2Browse.exe'   # copy committed in this repo
    }
    [pscustomobject]@{
        # Note: the SourceForge vendor URL is an INSTALLER (leaves K-Meleon
        # installed) — upload a portable K-Meleon build to the mirror for a
        # clean, nothing-left-behind launch, and it'll be preferred.
        Key = 'kmeleon'; Name = 'K-Meleon'; Default = $false
        Blurb = "Lightweight Gecko browser (vendor = installer; mirror a portable build for clean launch)"
        Type = 'exe'; Exe = $null
        Url = 'https://sourceforge.net/projects/kmeleon/files/latest/download'
        Fallback = "$MirrorBase/kmeleon.exe"
    }
    [pscustomobject]@{
        Key = 'midori'; Name = 'Midori'; Default = $false
        Blurb = "Minimal, fast browser (mirror-hosted)"
        Type = 'zip'; Exe = 'midori.exe'
        Url = $null
        Fallback = "$MirrorBase/midori.zip"
    }
    [pscustomobject]@{
        Key = 'qtweb'; Name = 'QtWeb'; Default = $false
        Blurb = "Tiny single-exe portable browser (mirror-hosted)"
        Type = 'exe'; Exe = $null
        Url = $null
        Fallback = "$MirrorBase/QtWeb.exe"
    }
    [pscustomobject]@{
        Key = 'otter'; Name = 'Otter Browser'; Default = $false
        Blurb = "Lightweight Qt browser, classic UI (mirror-hosted)"
        Type = 'zip'; Exe = 'otter-browser.exe'
        Url = $null
        Fallback = "$MirrorBase/otter.zip"
    }
)

# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------
function Write-Ok  { param([string]$T) Write-Host "  [+] $T" -ForegroundColor Green }
function Write-Bad { param([string]$T) Write-Host "  [!] $T" -ForegroundColor Yellow }

function Show-Banner {
    Clear-Host
    Write-Host ''
    Write-Host '   browse.it2.sh' -ForegroundColor Cyan -NoNewline
    Write-Host '  —  portable browser launcher' -ForegroundColor DarkGray
    Write-Host ''
}

# ---------------------------------------------------------------------------
# Download helper — vendor first, then mirror. Returns $true on success.
# ---------------------------------------------------------------------------
function Get-File {
    param([string[]]$Sources, [string]$OutFile)
    try {
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch { }
    foreach ($u in ($Sources | Where-Object { $_ })) {
        try {
            Write-Host "  downloading from $u" -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $u -OutFile $OutFile -UseBasicParsing -ErrorAction Stop
            if ((Test-Path -LiteralPath $OutFile) -and (Get-Item -LiteralPath $OutFile).Length -gt 100kb) {
                return $true
            }
        } catch {
            Write-Bad "  $u -> $($_.Exception.Message)"
        }
    }
    return $false
}

# ---------------------------------------------------------------------------
# Launch a browser: download -> run (extracting first for zips) -> clean up.
# ---------------------------------------------------------------------------
function Invoke-Browser {
    param([Parameter(Mandatory = $true)][pscustomobject]$Browser)

    $stamp = [guid]::NewGuid().ToString('N')
    $sources = @($Browser.Url, $Browser.Fallback)

    Write-Host ''
    Write-Host "  Launching $($Browser.Name)..." -ForegroundColor Cyan

    if ($Browser.Type -eq 'zip') {
        $zip = Join-Path $env:TEMP "browse-$($Browser.Key)-$stamp.zip"
        $dir = Join-Path $env:TEMP "browse-$($Browser.Key)-$stamp"
        if (-not (Get-File -Sources $sources -OutFile $zip)) {
            Write-Bad "Could not download $($Browser.Name). Upload a mirror to $MirrorBase, or fix its vendor URL."
            Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
            return
        }
        try {
            Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force
            # Prefer the named exe; otherwise take the first browser-looking exe.
            $target = $null
            if ($Browser.Exe) {
                $target = Get-ChildItem -LiteralPath $dir -Recurse -Filter $Browser.Exe -ErrorAction SilentlyContinue |
                          Select-Object -First 1
            }
            if (-not $target) {
                $target = Get-ChildItem -LiteralPath $dir -Recurse -Filter '*.exe' -ErrorAction SilentlyContinue |
                          Select-Object -First 1
            }
            if (-not $target) { Write-Bad "No .exe found inside the $($Browser.Name) archive."; return }
            Write-Ok "Running $($target.Name) — close it when you're done."
            $proc = Start-Process -FilePath $target.FullName -PassThru
            $proc.WaitForExit()
        } finally {
            Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host '  Cleaned up — nothing left behind.' -ForegroundColor Gray
        }
    } else {
        $exe = Join-Path $env:TEMP "browse-$($Browser.Key)-$stamp.exe"
        if (-not (Get-File -Sources $sources -OutFile $exe)) {
            Write-Bad "Could not download $($Browser.Name). Upload a mirror to $MirrorBase, or fix its vendor URL."
            Remove-Item -LiteralPath $exe -Force -ErrorAction SilentlyContinue
            return
        }
        try {
            Write-Ok "Running $($Browser.Name) — close it when you're done."
            $proc = Start-Process -FilePath $exe -PassThru
            $proc.WaitForExit()
        } finally {
            Remove-Item -LiteralPath $exe -Force -ErrorAction SilentlyContinue
            Write-Host '  Cleaned up — nothing left behind.' -ForegroundColor Gray
        }
    }
}

# ---------------------------------------------------------------------------
# Menu (TUI)
# ---------------------------------------------------------------------------
function Show-Menu {
    Show-Banner
    Write-Host '  Pick a portable browser to launch:' -ForegroundColor White
    Write-Host ''
    for ($i = 0; $i -lt $script:Browsers.Count; $i++) {
        $b = $script:Browsers[$i]
        $tag = if ($b.Default) { ' (default)' } else { '' }
        Write-Host ("   {0}) " -f ($i + 1)) -ForegroundColor White -NoNewline
        Write-Host "$($b.Name)$tag" -ForegroundColor Green -NoNewline
        Write-Host "  —  $($b.Blurb)" -ForegroundColor DarkGray
    }
    Write-Host ''
    Write-Host '   Enter = default · Q = quit' -ForegroundColor DarkGray
    Write-Host ''
}

function Get-DefaultBrowser {
    $d = $script:Browsers | Where-Object { $_.Default } | Select-Object -First 1
    if (-not $d) { $d = $script:Browsers[0] }
    return $d
}

function Start-BrowseTui {
    # Direct target from the URL path (browse.it2.sh/<key>) — skip the menu.
    if ($script:BrowseTarget) {
        $b = $script:Browsers | Where-Object { $_.Key -eq $script:BrowseTarget } | Select-Object -First 1
        if (-not $b) {
            Write-Bad "Unknown browser '$script:BrowseTarget'. Valid: $(( $script:Browsers.Key ) -join ', ')."
            return
        }
        Invoke-Browser -Browser $b
        return
    }

    while ($true) {
        Show-Menu
        $choice = Read-Host '  Choice'
        if ($choice -match '^(q|quit|exit)$') { Write-Host '  Bye.' -ForegroundColor Gray; return }
        if ([string]::IsNullOrWhiteSpace($choice)) {
            Invoke-Browser -Browser (Get-DefaultBrowser)
        } else {
            $n = 0
            if (-not [int]::TryParse($choice, [ref]$n) -or $n -lt 1 -or $n -gt $script:Browsers.Count) {
                Write-Bad 'Invalid choice.'; Start-Sleep -Seconds 1; continue
            }
            Invoke-Browser -Browser $script:Browsers[$n - 1]
        }
        Write-Host ''
        Read-Host '  Press Enter to return to the menu'
    }
}

Start-BrowseTui
