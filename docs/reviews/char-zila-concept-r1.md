# Review — Zila concept board r1 (PR #20) · CONCEPT ONLY

**Status:** exploration board for identity review. **Not a production sprite, not approved, cannot be approved.** No image-generation credits are requested by this review.

## Why PR #20's CI failed, and the fix
- **Cause:** the board was placed in `art/submissions/char_zila/v001/`, so the strict production sprite validator correctly rejected it (1800×1958 RGB vs the 256×400 RGBA sprite canvas). The validator is **not** weakened.
- **Fix (tooling branch):** a dedicated **concept route**, `art/concepts/<id>/<v###>/` + `scripts/validate-concept.mjs`. It checks provenance, ownership, byte integrity and privacy instead of sprite geometry.
- **Codex action:** move the files on `codex/art/char-zila-concept-r1`:
  - the board, `metadata.json`, `notes.md` and `prompt.md` → `art/concepts/char_zila/v001/`;
  - `art/source/char_zila/v001/concept-*.png` → `art/concepts/char_zila/v001/sources/`;
  - update `files.rawCandidates[].path`, and set `submissionType` to contain "concept" (it already says "exploratory-concept-review-not-production").
- **Reproduced locally with that move:** all concept checks pass:
  - board and three sources byte-identical (SHA-256);
  - all decode;
  - no EXIF, XMP or IPTC;
  - ownership limited to `art/concepts/char_zila/`.

## Identity review (for the Creative Director)
- **Direction B is the best starting point** for refinement: warm finish consistent with the approved furniture, long brown hair with bangs and bows, pink top, cream skirt. **Not approved.**
- **Main issue: proportion.** B is ≈ 5.83 heads vs the Art Bible's ≈ 4.6. At SD (1 px/cm) her face shrinks to ≈ 14 px, against ≈ 18 px at 4.6 heads. See `char-zila-concept/01-concept-b-game-scale-vs-4.6-heads.png`.
- **Next step:** a targeted round-2 brief is prepared but **not issued**: [`docs/art-requests/008-zila-refinement-brief.md`](../art-requests/008-zila-refinement-brief.md). It needs the CD's decisions on head count, base direction and one identity trait.
