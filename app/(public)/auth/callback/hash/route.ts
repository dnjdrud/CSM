/**
 * GET /auth/callback/hash — Plain HTML callback (CDN Supabase = localStorage only).
 * Do NOT use as magic link redirectTo: server reads cookies, so session would never be seen.
 * Magic link should use /auth/callback/session (createBrowserClient = cookies).
 */
import { NextResponse } from "next/server";

// ESM bundle that works in browser (esm.sh resolves deps; fallback: jsdelivr +esm)
const SUPABASE_ESM = "https://esm.sh/@supabase/supabase-js@2";

function escapeJs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anon) {
    const html = `<!DOCTYPE html><html><body><p>Server misconfigured.</p><a href="/onboarding">Continue</a></body></html>`;
    return new NextResponse(html, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing in…</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    p { color: #374151; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <p id="msg">Signing you in…</p>
  <a id="link" href="/feed" style="display:none; margin-top: 1rem;">Continue to feed</a>
  <script>
    window.__SUPABASE_URL = '${escapeJs(url)}';
    window.__SUPABASE_ANON = '${escapeJs(anon)}';
  </script>
  <script type="module">
(function() {
  var SUPABASE_URL = window.__SUPABASE_URL;
  var SUPABASE_ANON = window.__SUPABASE_ANON;
  var hash = (window.location.hash || '').slice(1);
  var search = window.location.search || '';
  var params = new URLSearchParams(search);
  var nextPath = params.get('next') || '/feed';
  if (!nextPath.startsWith('/')) nextPath = '/feed';

  var msg = document.getElementById('msg');
  var linkEl = document.getElementById('link');

  function showError(text, href) {
    msg.textContent = text;
    linkEl.href = href || '/onboarding';
    linkEl.style.display = 'inline';
  }

  if (!hash) {
    showError('No sign-in data. Redirecting…', '/onboarding');
    window.location.href = '/onboarding';
    return;
  }

  var map = {};
  hash.split('&').forEach(function(p) {
    var i = p.indexOf('=');
    if (i >= 0) {
      var k = decodeURIComponent(p.slice(0, i).replace(/\\+/g, ' '));
      var v = decodeURIComponent((p.slice(i + 1) || '').replace(/\\+/g, ' '));
      map[k] = v;
    }
  });

  var access_token = map.access_token;
  var refresh_token = map.refresh_token;
  var err = map.error;

  if (err) {
    showError('Error: ' + (map.error_description || err), '/onboarding?error=' + encodeURIComponent(err));
    return;
  }

  if (!access_token || !refresh_token) {
    showError('Missing tokens. Redirecting…', '/onboarding');
    window.location.href = '/onboarding';
    return;
  }

  (async function() {
    try {
      var mod = await import('${SUPABASE_ESM}');
      var createClient = mod.createClient;
      if (typeof createClient !== 'function') {
        showError('Auth library load failed. Use the link below.', nextPath);
        linkEl.href = nextPath;
        linkEl.style.display = 'inline';
        return;
      }
      var sb = createClient(SUPABASE_URL, SUPABASE_ANON);
      var result = await sb.auth.setSession({ access_token: access_token, refresh_token: refresh_token });
      if (result.error) {
        showError('Sign-in failed: ' + (result.error.message || 'Unknown error'), '/onboarding');
        return;
      }
      msg.textContent = 'Redirecting…';
      await new Promise(function(r) { setTimeout(r, 1000); });
      window.location.replace(nextPath);
    } catch (e) {
      showError('Error: ' + (e && e.message ? e.message : 'Unknown'), '/onboarding');
    }
  })();
})();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
