#!/usr/bin/env node
// Validates art submissions and (on PRs) path ownership.
//   node scripts/validate-art.mjs                         → validate every submission
//   node scripts/validate-art.mjs --base origin/reboot/foundation --branch codex/art/prop_bed_zila-v001
//        → ownership check of changed files + validate only touched submissions
//   --report <file.json>  write machine-readable results (used by the gallery / CI summary)
import { execFileSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
import { listSubmissions, loadSpecs, ownershipViolations } from './lib.mjs';
import { validateSubmission } from './validate-submission.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const base = opt('--base');
const branch = opt('--branch') ?? process.env.GITHUB_HEAD_REF ?? '';
const reportPath = opt('--report');

let changed = null;
const errors = [];
if (base) {
  changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`], { encoding: 'utf8' }).split('\n').filter(Boolean);
  errors.push(...ownershipViolations(branch, changed));
}

const specs = loadSpecs();
let subs = listSubmissions();
if (changed) subs = subs.filter((s) => changed.some((f) => f.startsWith(`art/submissions/${s.assetId}/${s.version}/`)));
const results = [];
for (const s of subs) results.push(await validateSubmission(s, specs));

const lines = ['## Art validation (TECHNICAL checks only — not a visual approval)', ''];
if (changed) lines.push(`Branch \`${branch || '(unknown)'}\`, ${changed.length} changed file(s) vs \`${base}\`.`, '');
if (errors.length) lines.push('### Ownership', ...errors.map((e) => `- ❌ ${e}`), '');
if (!results.length) lines.push('_No art submissions to validate._');
for (const r of results) {
  lines.push(`### ${r.assetId} ${r.version} — ${r.errors.length ? '❌ TECHNICAL FAIL' : '✅ TECHNICAL PASS'} · VISUAL: pending Creative Director review`, '');
  for (const c of r.checks) lines.push(`- ${c.pass ? '✅' : '❌'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  for (const w of r.warnings) lines.push(`- ⚠️ ${w}`);
  lines.push('');
}
const text = lines.join('\n');
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
if (reportPath) writeFileSync(reportPath, JSON.stringify({ branch, changed, ownershipErrors: errors, results: results.map(({ meta, ...r }) => r) }, null, 2));
const failed = errors.length + results.reduce((n, r) => n + r.errors.length, 0);
process.exit(failed ? 1 : 0);
