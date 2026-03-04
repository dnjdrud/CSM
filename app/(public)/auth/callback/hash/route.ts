/**
 * GET /auth/callback/hash — Plain HTML callback for hash fragment flow.
 * No React; inline script parses hash, sets Supabase session, redirects.
 * Use this as redirectTo for magic link so tokens are applied without waiting for React.
 */
import { NextResponse } from "next/server";

const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

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
(function() {
  var SUPABASE_URL = '${escapeJs(url)}';
  var SUPABASE_ANON = '${escapeJs(anon)}';
  var hash = (window.location.hash || '').slice(1);
  var search = window.location.search || '';
  var params = new URLSearchParams(search);
  var nextPath = params.get('next') || '/feed';
  if (!nextPath.startsWith('/')) nextPath = '/feed';

  var msg = document.getElementById('msg');
  var linkEl = document.getElementById('link');

  if (!hash) {
    msg.textContent = 'No sign-in data. Redirecting…';
    linkEl.href = '/onboarding';
    linkEl.style.display = 'inline';
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
    msg.textContent = 'Error: ' + (map.error_description || err);
    linkEl.href = '/onboarding?error=' + encodeURIComponent(err);
    linkEl.style.display = 'inline';
    return;
  }

  if (!access_token || !refresh_token) {
    msg.textContent = 'Missing tokens. Redirecting…';
    linkEl.href = '/onboarding';
    linkEl.style.display = 'inline';
    window.location.href = '/onboarding';
    return;
  }

  var script = document.createElement('script');
  script.src = '${SUPABASE_CDN}';
  script.async = false;
  script.onload = function() {
    try {
      var supabase = window.supabase;
      if (!supabase || typeof supabase.createClient !== 'function') {
        msg.textContent = 'Could not load auth. Use the link below.';
        linkEl.href = nextPath;
        linkEl.style.display = 'inline';
        window.location.href = nextPath;
        return;
      }
      var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      sb.auth.setSession({ access_token: access_token, refresh_token: refresh_token })
        .then(function() {
          msg.textContent = 'Redirecting…';
          setTimeout(function() { window.location.href = nextPath; }, 150);
        })
        .catch(function(e) {
          msg.textContent = 'Sign-in failed: ' + (e && e.message ? e.message : 'Unknown error');
          linkEl.href = '/onboarding';
          linkEl.style.display = 'inline';
        });
    } catch (e) {
      msg.textContent = 'Error: ' + (e && e.message ? e.message : 'Unknown');
      linkEl.href = '/onboarding';
      linkEl.style.display = 'inline';
    }
  };
  script.onerror = function() {
    msg.textContent = 'Could not load auth library. Use the link below.';
    linkEl.href = nextPath;
    linkEl.style.display = 'inline';
  };
  document.body.appendChild(script);
})();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
