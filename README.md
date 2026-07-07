# 2browse.it2.sh

One-line launcher for **[2Browse](https://www.carifred.com/2browse/)** by Carifred
— a small portable tool that opens a fresh, isolated browser session (handy for
support work, a second login, or quick throwaway browsing).

Part of the [it2.sh](https://it2.sh) family of one-line tools.

```powershell
# Windows — PowerShell
irm 2browse.it2.sh | iex
```

It downloads 2Browse, launches it, and **deletes the download when you close it**
— nothing is left behind.

## How it works

- A Cloudflare Worker is bound to the `2browse.it2.sh` custom domain and does
  **content negotiation**:
  - Terminals (`curl` / `wget` / PowerShell) → the raw `2browse.ps1` launcher.
  - Browsers (`Accept: text/html`) → a self-contained explainer page.
  - `/2Browse.exe` → our hosted copy of the binary.
- The launcher pulls the exe from **carifred.com first**, and falls back to the
  hosted copy at `https://2browse.it2.sh/2Browse.exe` if the author's site is
  unreachable — so it keeps working even if upstream is down.
- The script and the binary are both served from the bound `./public` assets
  directory, so there's a single source of truth and no build step.

## The fallback copy

[`public/bin/2Browse.exe`](public/bin/2Browse.exe) is a mirror of Carifred's
2Browse, kept in-repo so the Worker can serve it when upstream is unavailable.
Refresh it when Carifred ships a new build:

```bash
curl -sL https://www.carifred.com/2browse/2Browse.exe -o public/bin/2Browse.exe
```

> Not affiliated with Carifred. 2Browse is their freeware — all credit is theirs;
> this repo only wraps it in a one-liner and mirrors the binary as a fallback.

## Deploy

```bash
npx wrangler deploy
```

The route and custom domain are configured in [`wrangler.toml`](wrangler.toml).

## Endpoints

| Path | Response |
| --- | --- |
| `/` | Raw `2browse.ps1` (terminal) or explainer page (browser) |
| `/2Browse.exe` | The hosted 2Browse binary (fallback source) |
| `/health` | `200 OK` — health check |
| `/favicon.ico` | `204 No Content` |
