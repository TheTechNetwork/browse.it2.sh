// Cloudflare Worker for 2browse.it2.sh
//
// One-line launcher for Carifred's 2Browse (a small portable "fresh isolated
// browser session" tool). Content negotiation, same as the it2.sh family:
//
//   • Terminals (curl / PowerShell / wget) → the raw 2browse.ps1 launcher
//   • Browsers (Accept: text/html)         → a styled explainer page
//   • /2Browse.exe                         → our hosted copy of the binary,
//                                            the fallback the script uses when
//                                            carifred.com is unreachable.
//
// The script and the binary are both served from the bound ./public assets
// directory, so there's a single source of truth and no build step.

const TITLE = "2browse.it2.sh";
const TAGLINE = "Launch Carifred's 2Browse in one line — download, run, clean up.";
const REPO = "https://github.com/TheTechNetwork/2browse.it2.sh";
const RUN_CMD = "irm 2browse.it2.sh | iex";
const UPSTREAM = "https://www.carifred.com/2browse/";

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Terminal clients (curl, wget, PowerShell) don't ask for HTML.
function wantsHtml(request) {
  const accept = (request.headers.get("Accept") || "").toLowerCase();
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();
  if (/\bcurl\b|\bwget\b|powershell|libcurl/.test(ua)) return false;
  return accept.includes("text/html");
}

function renderHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(TITLE)} — one-line 2Browse launcher</title>
<meta name="description" content="${escapeHtml(TAGLINE)}">
<style>
  :root {
    --bg: #0d1117; --panel: #161b22; --border: #30363d;
    --fg: #e6edf3; --muted: #8b949e; --accent: #58a6ff; --code: #0b0f14;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
  h1 { font-size: 2.4rem; margin: 0 0 .25rem; letter-spacing: -.02em; }
  h1 .dot { color: var(--accent); }
  .tagline { color: var(--muted); margin: 0 0 2rem; }
  .card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem 1.4rem; margin-bottom: 1.1rem;
  }
  h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 0 0 .8rem; }
  .cmd-label { display: block; font-size: .75rem; color: var(--muted); margin-bottom: .2rem; }
  code {
    position: relative; display: block; background: var(--code); border: 1px solid var(--border);
    border-radius: 8px; padding: .6rem 2.4rem .6rem .8rem;
    font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: .95rem; cursor: pointer; overflow-x: auto; transition: border-color .15s;
  }
  code:hover { border-color: var(--accent); }
  .copy-ic {
    position: absolute; top: 50%; right: .6rem; transform: translateY(-50%);
    display: inline-flex; color: var(--muted); transition: color .15s; pointer-events: none;
  }
  code:hover .copy-ic { color: var(--accent); }
  .copy-ic .ic-check { display: none; }
  code.copied { border-color: #3fb950; }
  code.copied .copy-ic { color: #3fb950; }
  code.copied .ic-copy { display: none; }
  code.copied .ic-check { display: inline; }
  code.failed { border-color: #f85149; }
  code.failed .copy-ic { color: #f85149; }
  p { margin: .3rem 0 0; }
  .muted { color: var(--muted); }
  a { color: var(--accent); }
  .repo { display: inline-block; margin-top: .6rem; color: var(--muted); text-decoration: none; font-size: .9rem; }
  .repo:hover { color: var(--accent); }
  footer { margin-top: 2.5rem; color: var(--muted); font-size: .85rem; text-align: center; }
  footer a { color: var(--accent); text-decoration: none; }
</style>
</head>
<body>
  <main class="wrap">
    <h1>2browse<span class="dot">.</span>it2<span class="dot">.</span>sh</h1>
    <p class="tagline">${escapeHtml(TAGLINE)}</p>

    <article class="card">
      <h2>Run it</h2>
      <span class="cmd-label">Windows — PowerShell</span>
      <code data-copy="${escapeHtml(RUN_CMD)}">${escapeHtml(RUN_CMD)}<span class="copy-ic" aria-hidden="true"><svg class="ic-copy" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><svg class="ic-check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span></code>
      <p class="muted" style="margin:.6rem 0 0;font-size:.9rem">Downloads 2Browse, launches it, and deletes the download when you close it.</p>
    </article>

    <article class="card">
      <h2>What it is</h2>
      <p><a href="${escapeHtml(UPSTREAM)}" target="_blank" rel="noopener">2Browse</a> by Carifred is a small portable tool that opens a fresh,
      isolated browser session — handy for support work, a second login, or quick
      throwaway browsing. This wrapper just fetches and runs it, then cleans up.</p>
      <p class="muted" style="margin:.7rem 0 0;font-size:.9rem">
        The script pulls the exe from carifred.com first and falls back to our hosted
        copy (<a href="/2Browse.exe">/2Browse.exe</a>) if the author's site is unreachable.
        Not affiliated with Carifred — all credit for 2Browse is theirs.
      </p>
      <a class="repo" href="${escapeHtml(REPO)}" target="_blank" rel="noopener">source ↗</a>
    </article>

    <footer>
      Click the command to copy &middot; part of the
      <a href="https://it2.sh" target="_blank" rel="noopener">it2.sh</a> family
      <br><a href="${escapeHtml(REPO)}" target="_blank" rel="noopener">2browse.it2.sh source ↗</a>
    </footer>
  </main>
<script>
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; }
      catch (e) { /* fall through to legacy path */ }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  document.querySelectorAll("code[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      el.classList.remove("copied", "failed");
      const ok = await copyText(el.dataset.copy);
      el.classList.add(ok ? "copied" : "failed");
      setTimeout(() => el.classList.remove("copied", "failed"), 1400);
    });
  });
</script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Ignore browser noise
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    // Hosted binary fallback: /2Browse.exe (case-insensitive) → our copy.
    if (/\/2browse\.exe$/i.test(url.pathname)) {
      const bin = await env.ASSETS.fetch(new Request("https://assets.local/bin/2Browse.exe"));
      if (!bin.ok) {
        return new Response("2Browse.exe not available", { status: 502 });
      }
      return new Response(bin.body, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="2Browse.exe"',
          "Cache-Control": "public, max-age=86400",
          "X-Source": "2browse.it2.sh",
        },
      });
    }

    // Browsers get the styled explainer page.
    if (wantsHtml(request)) {
      return new Response(renderHtml(), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "X-Source": "2browse.it2.sh",
        },
      });
    }

    // Terminals get the raw PowerShell launcher, served from the assets dir.
    const assetResponse = await env.ASSETS.fetch(
      new Request("https://assets.local/2browse.ps1")
    );
    if (!assetResponse.ok) {
      return new Response("Failed to load 2browse.ps1", { status: 502 });
    }
    const body = await assetResponse.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Source": "2browse.it2.sh",
        "X-Script": "2browse.ps1",
      },
    });
  },
};
