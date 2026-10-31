// Self-healing CSP: compute the sha256 hash of EVERY executable inline
// script in dist/index.html and rewrite the script-src hashes in
// dist/_headers + vercel.json.
//
// Why: the CSP whitelists inline bootstrap scripts by content hash. Any
// edit to those scripts (or a build-env difference that changes what gets
// injected) silently invalidates the hash and the site blocks its own boot
// code. This script runs after `vite build` and keeps the policies in sync
// with whatever the build actually produced.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');

const hashes = [];
for (const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
  const attrs = match[1];
  const body = match[2];
  // Data blocks (JSON-LD, speculation rules, importmaps) are never executed.
  if (/ld\+json|speculationrules|importmap/i.test(attrs)) continue;
  if (body.trim() === '') continue;
  hashes.push(
    "'sha256-" + createHash('sha256').update(body).digest('base64') + "'",
  );
}

if (hashes.length === 0) {
  console.warn('[sync-csp] no inline scripts found — CSP left untouched');
  process.exit(0);
}

const hashList = hashes.join(' ');
console.log(`[sync-csp] ${hashes.length} inline script(s): ${hashList}`);

function patchScriptSrc(file, isJson) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return false;
  }
  let changed = false;
  // Rebuild: strip ALL existing sha256 tokens, then re-insert the fresh set
  // right after 'script-src 'self'' (order in CSP is irrelevant).
  const withoutOld = content.replace(/ ?'sha256-[^']*'/g, '');
  const fresh = ' ' + [...new Set(hashes)].join(' ');
  let out;
  if (isJson) {
    out = withoutOld.replace(/"script-src 'self'"/g, `"script-src 'self'${fresh}"`);
  } else {
    out = withoutOld.replace(/script-src 'self'/g, `script-src 'self'${fresh}`);
  }
  if (out !== content) {
    writeFileSync(file, out);
    changed = true;
  }
  return changed;
}

const a = patchScriptSrc('dist/_headers', false);
const b = patchScriptSrc('vercel.json', true);
console.log(`[sync-csp] dist/_headers updated: ${a} | vercel.json updated: ${b}`);
