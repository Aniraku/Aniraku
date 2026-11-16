// shared/mediaShield.js — opaque media links.
//
// The /stream and /servers responses carry raw upstream URLs (and the
// Referer/User-Agent headers needed to fetch them); /api/v1/proxy?url=
// echoes those URLs back in plain text. Every one of them is readable in
// the browser's Network tab — and, worse, copyable. This module lets the
// proxy swap them for self-contained opaque tokens:
//
//     /api/v1/proxy?k=<b64url( iv || AES-GCM(json{url,headers,exp}) )>
//
// The token is minted and opened ONLY inside the Pages Function with a
// deployment-time key (env.PROXY_LINK_KEY), so the browser sees and
// stores nothing but random-looking bytes. Tokens expire (default 6h),
// cannot be forged (GCM auth), and cannot be read without the key.
//
// Failure philosophy: shielding must never break playback. Every rewrite
// is best-effort — callers catch and fall back to the untouched response.

const TTL_MS = 6 * 60 * 60 * 1000; // token lifetime

// Public CDNs whose URLs are not secrets (posters, covers, art). They are
// loaded by the browser directly; opaque-wrapping them would only add
// proxy latency and invocation cost, so they are left untouched.
const PUBLIC_HOST_RE =
  /(^|\.)(anilist\.co|anili\.st|tmdb\.org|thetvdb\.com|myanimelist\.net|ytimg\.com|youtube\.com|imgur\.com|githubusercontent\.com|discordapp\.net|discord\.com|shields\.io)$/i;

const K_PREFIX = '/api/v1/proxy?k=';
const K_PATH_RE = /^\/api\/v1\/proxy\/k\/([A-Za-z0-9_-]+)(?:\/(.*))?$/;

// --- key handling -----------------------------------------------------------

const keyCache = new Map(); // hex string -> Promise<CryptoKey>

function hexToBytes(hex) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex || '')) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++)
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function shieldEnabled(env) {
  return hexToBytes(env.PROXY_LINK_KEY) !== null;
}

async function getKey(env) {
  const hex = env.PROXY_LINK_KEY;
  let cached = keyCache.get(hex);
  if (!cached) {
    const raw = hexToBytes(hex);
    if (!raw) throw new Error('mediaShield: invalid PROXY_LINK_KEY');
    cached = crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    keyCache.set(hex, cached);
  }
  return cached;
}

// --- token mint / open ------------------------------------------------------

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s) {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Mints an opaque link for one upstream resource.
 * @param {string} origin the request's own origin (links stay same-origin)
 * @param {string} url absolute upstream URL
 * @param {Record<string,string>|null} headers request headers the upstream
 *        host requires (Referer / User-Agent / …) — sealed inside the token
 * @param {Environment} env CF Pages env bindings
 */
export async function mintK(origin, url, headers, env) {
  const key = await getKey(env);
  const payload = { u: url, h: headers || undefined, e: Date.now() + TTL_MS };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(payload)),
    ),
  );
  const token = bytesToB64url(new Uint8Array([...iv, ...ct]));
  return `${origin}${K_PREFIX}${token}`;
}

/**
 * Opens an opaque token. Returns { url, headers } or null (bad/expired).
 * @param {string} token
 * @param {Environment} env
 */
export async function openK(token, env) {
  try {
    const raw = b64urlToBytes(token);
    const iv = raw.subarray(0, 12);
    const key = await getKey(env);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      raw.subarray(12),
    );
    const payload = JSON.parse(new TextDecoder().decode(plain));
    if (!payload || typeof payload.u !== 'string' || payload.e < Date.now()) {
      return null;
    }
    return { url: payload.u, headers: payload.h || {} };
  } catch {
    return null;
  }
}

export { K_PATH_RE };

// --- JSON shielding ---------------------------------------------------------

const URL_RE = /https?:\/\/[^\s"'<>\\]+/g;

function isShieldable(url) {
  let host;
  try {
    host = new URL(url).host;
  } catch {
    return false;
  }
  return !PUBLIC_HOST_RE.test(host);
}

/** True when a string value is already one of our opaque links. */
function alreadyOpaque(s) {
  return s.includes('/api/v1/proxy?k=') || s.includes('/api/v1/proxy/k/');
}

/**
 * Rewrites every non-public http(s) URL inside a JSON document into opaque
 * links (async because minting is crypto). `headers` objects are captured
 * BEFORE their sibling URLs are minted (JSON key order can't be trusted)
 * and sealed inside the tokens — the upstream host still gets the Referer/
 * User-Agent it requires, but the client never sees them again. The client
 * treats missing headers as optional everywhere, so deleting them is safe.
 */
export async function shieldJsonText(
  text,
  env,
  origin,
  inheritedHeaders = null,
) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return text; // not JSON — pass through
  }

  const walkString = async (s, ctxHeaders) => {
    if (alreadyOpaque(s)) return s;
    let out = s;
    const matches = [...new Set(s.match(URL_RE) || [])];
    for (const url of matches) {
      if (!isShieldable(url)) continue;
      try {
        out = out.split(url).join(await mintK(origin, url, ctxHeaders, env));
      } catch {
        // mint failure — leave the original URL (availability first)
      }
    }
    return out;
  };

  const walk = async (node, ctx) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) node[i] = await walk(node[i], ctx);
      return node;
    }
    if (node && typeof node === 'object') {
      // Embed sources are third-party iframe pages, not media files —
      // they must load in their own frame, never through our proxy.
      if (node.type === 'embed') return node;
      // Capture header objects FIRST (document order can't be trusted),
      // merge with inherited context, then delete them from the output.
      let ctxHeaders = ctx;
      if (
        node.headers &&
        typeof node.headers === 'object' &&
        !Array.isArray(node.headers)
      ) {
        ctxHeaders = { ...ctx, ...node.headers };
        delete node.headers;
      }
      for (const key of Object.keys(node)) {
        if (key === 'headers') {
          delete node[key];
          continue;
        }
        const value = node[key];
        if (typeof value === 'string') {
          node[key] = await walkString(value, ctxHeaders);
        } else if (value && typeof value === 'object') {
          node[key] = await walk(value, ctxHeaders);
        }
      }
      return node;
    }
    return node;
  };

  try {
    await walk(doc, inheritedHeaders || {});
  } catch {
    return text; // any shield failure — pass the original through
  }
  return JSON.stringify(doc);
}

// --- m3u8 shielding ---------------------------------------------------------

/**
 * Rewrites a playlist so that every resource URI (variant playlists,
 * segments, keys, maps, subtitle tracks) becomes an opaque link. Relative
 * URIs are resolved server-side against the playlist's upstream URL, so
 * the client never sees the upstream origin in any form.
 * @param {string} text playlist body
 * @param {Environment} env
 * @param {string} origin request origin
 * @param {string} baseUrl the playlist's upstream URL (absolute)
 * @param {Record<string,string>|null} headers provider headers the upstream
 *        host requires — sealed into every minted segment token
 */
export async function shieldM3u8Text(
  text,
  env,
  origin,
  baseUrl,
  headers = null,
) {
  const lines = text.split('\n');
  const out = new Array(lines.length);

  const mintFrom = async (uri) => {
    if (alreadyOpaque(uri) || uri.startsWith('data:')) return uri;
    let abs;
    try {
      abs = new URL(uri, baseUrl).href;
    } catch {
      return uri;
    }
    if (!isShieldable(abs)) return uri;
    try {
      return await mintK(origin, abs, headers, env);
    } catch {
      return uri;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      out[i] = await replaceAsync(
        line,
        /URI="([^"]+)"/g,
        async (_m, uri) => `URI="${await mintFrom(uri)}"`,
      );
    } else if (trimmed) {
      out[i] = await mintFrom(trimmed);
    } else {
      out[i] = line;
    }
  }
  return out.join('\n');
}

async function replaceAsync(str, re, fn) {
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(re)) {
    parts.push(str.slice(last, m.index), await fn(...m));
    last = m.index + m[0].length;
  }
  parts.push(str.slice(last));
  return parts.join('');
}

// --- detection helpers ------------------------------------------------------

/** Playlist bodies start with the #EXTM3U tag (some CDNs lie about type). */
export function looksLikeM3u8(text) {
  return text.trimStart().startsWith('#EXTM3U');
}

export function looksLikeJson(text) {
  const t = text.trimStart();
  return t.startsWith('{') || t.startsWith('[');
}
