#!/usr/bin/env node
// Fail the build when a public bundle contains a credential.
//
// Vite inlines every referenced `import.meta.env.VITE_*` value into the
// client bundle. That is correct for hosts, IDs and the Supabase publishable
// (anon) key, but a `VITE_` variable holding a server secret is published to
// every visitor. Scan the built output for the common key shapes and for
// Supabase service-role JWTs before Pages can deploy it.
//
// Usage: node scripts/check-public-dist.mjs [distDir]

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] || 'dist');
const EXT = new Set(['.js', '.html']);
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

const PATTERNS = [
  ['OpenAI-style secret key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ['Stripe secret key', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{10,}/],
  ['Resend API key', /\bre_[A-Za-z0-9]{20,}/],
  ['SendGrid API key', /\bSG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}/],
  ['Private key', /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
];

function jwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && EXT.has(path.extname(entry.name))) yield full;
  }
}

let hits = 0;
for await (const file of walk(DIST)) {
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [name, re] of PATTERNS) {
      if (re.test(line)) {
        hits++;
        console.error(`${file}:${i + 1}: possible ${name}`);
      }
    }
    for (const match of line.matchAll(JWT_RE)) {
      const role = jwtRole(match[0]);
      if (role && role !== 'anon') {
        hits++;
        console.error(`${file}:${i + 1}: JWT with role "${role}" (expected anon)`);
      }
    }
  }
}

if (hits > 0) {
  console.error(`\nPublic bundle contains ${hits} possible credential(s).`);
  console.error('Move the value to a server secret and rebuild; do not deploy this bundle.');
  process.exit(1);
}

console.log('Public bundle secret scan: clean');
