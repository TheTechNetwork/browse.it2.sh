# browse.it2.sh

One-line **portable browser launcher** — a small TUI that downloads a portable
browser, runs it, and cleans up when you close it (nothing installed, nothing
left behind). Made for backstage / support work: a throwaway session, a second
login, a clean-profile test.

Part of the [it2.sh](https://it2.sh) family of one-line tools.

```powershell
# Windows — PowerShell — menu (2Browse is the default)
irm browse.it2.sh | iex
```

Jump straight to one by putting it in the path:

```powershell
irm browse.it2.sh/2browse | iex     # Carifred 2Browse (default)
irm browse.it2.sh/kmeleon | iex     # K-Meleon
```

> `2browse.it2.sh` still works and launches 2Browse directly, so old links don't
> break — the Worker serves the same script on both domains.

## Browsers

A deliberately minimal, lightweight set (add more in the `$script:Browsers`
registry in [`public/browse.ps1`](public/browse.ps1)):

| Path | Browser | Source |
| --- | --- | --- |
| `/2browse` | **2Browse** (default) | vendor + in-repo copy |
| `/kmeleon` | K-Meleon | vendor (SourceForge) + mirror |
| `/midori` | Midori | mirror |
| `/qtweb` | QtWeb | mirror |
| `/otter` | Otter Browser | mirror |

## Same fallback style for every browser

Portable-browser download URLs are version-pinned and rot on each release, so
each entry has two sources and the script tries them in order:

1. **Vendor URL** — the author's download, where a stable one exists.
2. **GitHub mirror** — a copy you upload to this repo's `browsers` Release; the
   reliable source when the vendor URL is down or has moved.

2Browse additionally ships a copy **in this repo**
([`public/bin/2Browse.exe`](public/bin/2Browse.exe)), served by the Worker at
`/2Browse.exe`, so the default browser always works.

### Uploading a mirror

For any browser whose vendor URL isn't stable, upload the portable build to a
GitHub Release tagged `browsers` on this repo:

```
https://github.com/TheTechNetwork/browse.it2.sh/releases/download/browsers/<file>
```

- Single-exe browsers → upload the `.exe` (registry `Type = 'exe'`).
- Archive browsers → upload a `.zip` (`Type = 'zip'`, set `Exe` to the browser
  exe inside it). The script extracts to `%TEMP%`, runs it, and deletes the
  folder on exit.

## How it works (hosting)

- A Cloudflare Worker is bound to `browse.it2.sh` (and `2browse.it2.sh`) and does
  **content negotiation**: terminals get the raw `browse.ps1`; browsers get a
  self-contained explainer page; `/2Browse.exe` serves the committed binary.
- **Path routing:** the first path segment (`/kmeleon`, `/qtweb`, …) resolves
  through a fixed alias table and the Worker prepends `$script:BrowseTarget` so
  the script runs that browser non-interactively. Unknown segments get a `404`
  with the valid list. The value only ever comes from the allow-list, so it
  can't smuggle PowerShell into the script.
- The script and binary are served from the bound `./public` assets directory —
  single source of truth, no build step.

> Not affiliated with Carifred, K-Meleon, Midori, QtWeb, Otter, or any browser
> vendor. Each browser is their own software; this repo only wraps it in a
> one-liner and mirrors binaries as a fallback.

## Deploy

```bash
npx wrangler deploy
```

Both `browse.it2.sh` and `2browse.it2.sh` custom domains are configured in
[`wrangler.toml`](wrangler.toml).

## Endpoints

| Path | Response |
| --- | --- |
| `/` | Raw `browse.ps1` menu (terminal) or explainer page (browser) |
| `/<browser>` | `browse.ps1` with a direct target injected (`/kmeleon`, `/qtweb`, …) |
| `/2Browse.exe` | The hosted 2Browse binary (fallback source) |
| `/health` | `200 OK` — health check |
| `/favicon.ico` | `204 No Content` |
