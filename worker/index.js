// Cloudflare Worker for browse.it2.sh (and the original 2browse.it2.sh)
//
// A one-line portable-browser launcher. Content negotiation, same as the rest
// of the it2.sh family:
//
//   • Terminals (curl / PowerShell / wget) → the raw browse.ps1 TUI
//   • Browsers (Accept: text/html)         → a styled explainer page
//   • /2Browse.exe                         → our hosted copy of the 2Browse
//                                            binary (the fallback the script uses)
//
// Path routing (like nuke.it2.sh): browse.it2.sh/<key> runs that browser
// straight away. The legacy host 2browse.it2.sh defaults to the 2Browse target,
// so `irm 2browse.it2.sh | iex` keeps launching 2Browse directly.

const TITLE = "browse.it2.sh";
const TAGLINE = "Launch a portable browser in one line — download, run, clean up.";
const REPO = "https://github.com/TheTechNetwork/2browse.it2.sh";
const RUN_CMD = "irm browse.it2.sh | iex";

// Path targets → canonical browser Key in browse.ps1's $script:Browsers registry.
// Injected only from this fixed allow-list, so there's no script-injection surface.
const TARGETS = {
  "2browse": "2browse", browse: "2browse",
  kmeleon: "kmeleon", km: "kmeleon",
  midori: "midori",
  qtweb: "qtweb",
  otter: "otter",
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function wantsHtml(request) {
  const accept = (request.headers.get("Accept") || "").toLowerCase();
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();
  if (/\bcurl\b|\bwget\b|powershell|libcurl/.test(ua)) return false;
  return accept.includes("text/html");
}

function renderHtml() {
  const icon =
    '<span class="copy-ic" aria-hidden="true"><svg class="ic-copy" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><svg class="ic-check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(TITLE)} — one-line portable browser launcher</title>
<meta name="description" content="${escapeHtml(TAGLINE)}">
<style>
  :root {
    --bg: #0d1117; --panel: #161b22; --border: #30363d;
    --fg: #e6edf3; --muted: #8b949e; --accent: #58a6ff; --code: #0b0f14;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg);
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
  h1 { font-size: 2.4rem; margin: 0 0 .25rem; letter-spacing: -.02em; }
  h1 .dot { color: var(--accent); }
  .tagline { color: var(--muted); margin: 0 0 2rem; }
  .card { background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem 1.4rem; margin-bottom: 1.1rem; }
  h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 0 0 .8rem; }
  .cmd-label { display: block; font-size: .75rem; color: var(--muted); margin: .5rem 0 .2rem; }
  code {
    position: relative; display: block; background: var(--code); border: 1px solid var(--border);
    border-radius: 8px; padding: .6rem 2.4rem .6rem .8rem;
    font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: .95rem; cursor: pointer; overflow-x: auto; transition: border-color .15s; }
  code:hover { border-color: var(--accent); }
  .copy-ic { position: absolute; top: 50%; right: .6rem; transform: translateY(-50%);
    display: inline-flex; color: var(--muted); transition: color .15s; pointer-events: none; }
  code:hover .copy-ic { color: var(--accent); }
  .copy-ic .ic-check { display: none; }
  code.copied { border-color: #3fb950; }
  code.copied .copy-ic { color: #3fb950; }
  code.copied .ic-copy { display: none; }
  code.copied .ic-check { display: inline; }
  code.failed { border-color: #f85149; }
  code.failed .copy-ic { color: #f85149; }
  ul { margin: .3rem 0 0; padding-left: 1.2rem; }
  li { margin: .25rem 0; }
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
    <h1>browse<span class="dot">.</span>it2<span class="dot">.</span>sh</h1>
    <p class="tagline">${escapeHtml(TAGLINE)}</p>

    <article class="card">
      <h2>Run it</h2>
      <span class="cmd-label">Windows — PowerShell · menu (2Browse is the default)</span>
      <code data-copy="${escapeHtml(RUN_CMD)}">${escapeHtml(RUN_CMD)}${icon}</code>
      <span class="cmd-label">Or jump straight to one</span>
      <code data-copy="irm browse.it2.sh/kmeleon | iex">irm browse.it2.sh/kmeleon | iex${icon}</code>
      <p class="muted" style="margin:.5rem 0 0;font-size:.88rem">
        <code style="display:inline;padding:.05rem .3rem">/2browse</code>
        <code style="display:inline;padding:.05rem .3rem">/kmeleon</code>
        <code style="display:inline;padding:.05rem .3rem">/midori</code>
        <code style="display:inline;padding:.05rem .3rem">/qtweb</code>
        <code style="display:inline;padding:.05rem .3rem">/otter</code>
      </p>
    </article>

    <article class="card">
      <h2>What it does</h2>
      <p>Downloads a portable browser, launches it, and deletes the download when
      you close it — nothing installed, nothing left behind. Made for backstage /
      support work: a throwaway session, a second login, a clean-profile test.</p>
      <p class="muted" style="margin:.7rem 0 0;font-size:.9rem">
        Same fallback style for every browser: pull from the vendor first, then from
        our GitHub mirror if the vendor URL is down or has rotted. 2Browse also ships
        a copy in this repo (<a href="/2Browse.exe">/2Browse.exe</a>), so it always works.
        Not affiliated with any browser vendor.
      </p>
      <a class="repo" href="${escapeHtml(REPO)}" target="_blank" rel="noopener">source ↗</a>
    </article>

    <footer>
      Click a command to copy &middot; part of the
      <a href="https://it2.sh" target="_blank" rel="noopener">it2.sh</a> family
      <br><a href="${escapeHtml(REPO)}" target="_blank" rel="noopener">browse.it2.sh source ↗</a>
    </footer>
  </main>
<script>
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.top = "-9999px";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
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

    if (url.pathname === "/health") return new Response("OK", { status: 200 });
    if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });

    // Hosted binary fallback: /2Browse.exe (any case) → our committed copy.
    if (/\/2browse\.exe$/i.test(url.pathname)) {
      const bin = await env.ASSETS.fetch(new Request("https://assets.local/bin/2Browse.exe"));
      if (!bin.ok) return new Response("2Browse.exe not available", { status: 502 });
      return new Response(bin.body, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="2Browse.exe"',
          "Cache-Control": "public, max-age=86400",
          "X-Source": "browse.it2.sh",
        },
      });
    }

    if (wantsHtml(request)) {
      return new Response(renderHtml(), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "X-Source": "browse.it2.sh",
        },
      });
    }

    // Resolve a direct target: explicit path segment wins; otherwise the legacy
    // 2browse.it2.sh host defaults to the 2Browse target for back-compat.
    const segment = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "").split("/")[0].toLowerCase();
    let target = segment ? TARGETS[segment] : null;
    if (segment && !target) {
      const valid = Object.keys(TARGETS).join(", ");
      return new Response(
        `Unknown browser: "${segment}".\nValid: ${valid}\nOr run the menu: irm browse.it2.sh | iex\n`,
        { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    if (!target && /(^|\.)2browse\.it2\.sh$/i.test(url.hostname)) {
      target = "2browse";
    }

    const assetResponse = await env.ASSETS.fetch(new Request("https://assets.local/browse.ps1"));
    if (!assetResponse.ok) return new Response("Failed to load browse.ps1", { status: 502 });
    let body = await assetResponse.text();

    if (target) {
      const relaunchPath = segment && TARGETS[segment] ? segment : target;
      const header =
        `$script:BrowseTarget = '${target}'\n` +
        `$script:LaunchCommand = 'irm browse.it2.sh/${relaunchPath} | iex'\n`;
      body = header + body;
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Source": "browse.it2.sh",
        "X-Script": "browse.ps1",
        "X-Target": target || "(menu)",
      },
    });
  },
};
