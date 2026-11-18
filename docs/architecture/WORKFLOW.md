# Dual-agent workflow (Claude Code × Codex × GitHub)

```
Claude: spec + art request ──► reboot/foundation
                                   │
Codex:  branch codex/art/<id>-v### ┤ generate → fit-to-spec → validate → PR
                                   │
CI (art-submission.yml): ownership + technical checks → job summary + review-gallery artifact
                                   │
Claude: integration/consistency review comment on the PR
Creative Director: VISUAL PASS or change request (→ Codex makes v###+1)
                                   │
Claude (after CD approval): approve-asset.mjs → manifest + checksums → npm run qa → merge to reboot/foundation
```

## Branches
| Pattern | Who | Merges into |
|---|---|---|
| `reboot/foundation` | integration | never into `main` without Creative Director decision |
| `claude/<feature>` | Claude Code | `reboot/foundation` |
| `codex/art/<asset_id>-v###` | Codex | `reboot/foundation`, only after VISUAL PASS |

## Enforcement — what is actually enforced
- **CI checks** (`.github/workflows/*.yml`) fail a PR on ownership-path violations, technical art failures, manifest checksum mismatches, privacy findings, type errors, unit/e2e failures. They run on GitHub Actions once the workflows exist on the base branch.
- **CODEOWNERS** marks approved art/manifest/specs as owned by the repository owner. It only *blocks* merges if branch protection with "Require review from Code Owners" is enabled on `reboot/foundation`. **As of M1 this has not been verified/configured** — the Creative Director can enable it in GitHub → Settings → Branches.
- Codex must never merge; this is a rule in `AGENTS.md`, not a technical lock.

## Approval record
Each approved asset gets `docs/reviews/<asset_id>-<v###>.md` (CD decision, date, notes) and a manifest `approval` block with the master's SHA-256. `validate-manifest.mjs` fails if an approved file changes afterwards.
