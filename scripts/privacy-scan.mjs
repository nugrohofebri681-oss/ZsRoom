#!/usr/bin/env node
// Blocks private or secret material from entering this PUBLIC branch.
// Scans every tracked file (or the working tree when not in git).
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, rel, walk } from './lib.mjs';

let files;
try {
  files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  files = walk(ROOT).map(rel).filter((f) => !/^(node_modules|dist|\.git)\//.test(f));
}

const FORBIDDEN_PATHS = [
  [/(^|\/)surat\//i, 'private letters folder from the original game'],
  [/(^|\/)private\//i, 'private folder'],
  [/(^|\/)\.env(\.|$)/, 'environment file'],
  [/\.(pem|key|p12|pfx|keystore|jks)$/i, 'key material'],
  [/(^|\/)id_(rsa|ed25519)/, 'SSH key'],
  [/(^|\/)(credentials|secrets?)\.(json|ya?ml|txt)$/i, 'credentials file'],
  [/^(assets|kamar|bali|bromo)\//, 'legacy OG asset folder (OG game stays on main)'],
  [/^(bali\.html|bromo\.(js|css)|motion\.(js|json)|navigation\.js|sw\.js|cek-file\.html)$/, 'legacy OG file'],
  [/\.(zip|7z|rar|bundle)$/i, 'archive/bundle (do not publish legacy exports)'],
];
const SECRET_PATTERNS = [
  [/gh[pousr]_[A-Za-z0-9]{36,}/, 'GitHub token'],
  [/github_pat_[A-Za-z0-9_]{40,}/, 'GitHub fine-grained token'],
  [/sk-(proj-)?[A-Za-z0-9_-]{32,}/, 'OpenAI-style API key'],
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic API key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const EMAIL_ALLOW = /@(example\.(com|org)|users\.noreply\.github\.com|anthropic\.com)$/i;
// Asset density variants such as `prop_bed_zila_v001@hd.webp` are file names, not e-mail addresses.
const ASSET_VARIANT = /@(hd|sd|[1-4]x)\.(webp|png|jpe?g|avif)$/i;
const TEXT_EXT = /\.(md|json|ts|js|mjs|cjs|html|css|ya?ml|txt|svg|toml)$/i;
const MAX_BYTES = 6_000_000;

const problems = [];
for (const f of files) {
  for (const [re, why] of FORBIDDEN_PATHS) if (re.test(f)) problems.push(`${f}: ${why}`);
  let size = 0;
  try { size = statSync(join(ROOT, f)).size; } catch { continue; }
  if (size > MAX_BYTES) problems.push(`${f}: ${size} bytes exceeds ${MAX_BYTES}`);
  if (!TEXT_EXT.test(f) || f === 'package-lock.json' || f === 'scripts/privacy-scan.mjs') continue;
  const text = readFileSync(join(ROOT, f), 'utf8');
  for (const [re, why] of SECRET_PATTERNS) if (re.test(text)) problems.push(`${f}: possible ${why}`);
  for (const m of text.match(EMAIL) ?? []) if (!EMAIL_ALLOW.test(m) && !ASSET_VARIANT.test(m)) problems.push(`${f}: personal e-mail address "${m.replace(/(.{2}).*@/, '$1…@')}"`);
}
if (problems.length) { console.error('Privacy scan FAILED:\n' + problems.map((p) => ` - ${p}`).join('\n')); process.exit(1); }
console.log(`Privacy scan OK — ${files.length} files checked.`);
