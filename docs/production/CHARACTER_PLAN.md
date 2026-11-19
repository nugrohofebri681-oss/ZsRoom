# Character production plan — Zila & Febri

**Status:** planning. **No character illustration is final** until the Creative Director approves the proportions and the design references (step 1).

## Fixed constraints
- The specs' heights (Zila 165 cm, Febri 170 cm) are **draft artistic scales**, not real-world measurements. What matters is the **visible height difference of 3–6 cm**, enforced by `tests/unit/characters.test.ts`. Hair volume and shoes count toward the visible difference.
- Same head size for both (the difference is in neck, torso and legs). Storybook proportions are proposed at about 4.6 / 4.75 heads.
- Identity locks: Art Bible §8 and `art-bible/characters/ZILA.md`, `FEBRI.md`.
- HD illustrated, consistent with the approved furniture finish. Not chibi pixel sprites, not generic anime.

## Steps and gates
| # | Deliverable | Who | Gate |
|---|---|---|---|
| 1 | **Proportion and identity sheet**: front, side and back turnaround silhouettes for both, at true relative scale beside the bed, plus 2–3 face and expression studies each | Codex (art) + Claude (scale overlay) | **CD approves the proportions and look** |
| 2 | **Layered master, one facing (S)** for Zila: body, face, hair-back, hair-front, outfit-top, outfit-bottom, shoes, accessories on one canvas and pivot | Codex | CD approves the layer quality |
| 3 | **Walk cycle quality gate**: Zila, S facing, 8 frames, foot contact on the pivot line, stride matched to 150 cm/s | Codex frames + Claude in-engine playback | CD approves the motion |
| 4 | Remaining authored facings (SE, E, NE, N). W-side mirrored only for symmetric layers | Codex | technical + CD spot check |
| 5 | Febri: steps 2–4 (bag layer never mirrored) | Codex | CD |
| 6 | Outfit sets (wardrobe cycle: default, cream, blue, maroon, cocoa, night out) as swappable outfit layers | Codex | per outfit |
| 7 | Poses for interactions: sit (desk, stool, pouf), sleep/rest on the bed, look in the mirror | Codex + Claude anchors | CD |

## Engine work (Claude) — done in the sprint after PR #5
Layered rig (`src/animation/rig.ts`, `character.ts`), distance-synced walk (`strideCm` 112, 8 frames → 14 cm per frame: the slide-free contract for animators), 8 facings from 5 authored + mirroring rules, outfit layer swap, idle and sit poses, TEMP figure. Remaining: frame-atlas loading for approved layers, foot-contact markers in the gallery.

## Engine work originally planned
- Layered character rig: draw order per facing, a shared pivot, and outfit layer swapping (replaces the TEMP figure).
- Animation player: frame timing, foot-contact markers, and facing selection from the 8-direction vector.
- Character spec v1.0: frame canvas, layer list, anchors (hand, head, seat contact), validator checks for layer alignment.
- Gallery: a character turnaround page with a scale overlay beside the bed and nightstand.

## Asset requests (to be written after gate 1)
- `char_zila_sheet_v001`, `char_febri_sheet_v001`: proportion and identity sheets (step 1).
- Request numbers will follow the bedroom batches (007+).
