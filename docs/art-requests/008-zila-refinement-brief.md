# Request 008 — Zila refinement brief (concept round 2) · DRAFT, not yet issued

**Status:** prepared, **not sent**. No Codex image-generation credits are to be used until the Creative Director (CD) approves this brief.
**Source:** PR #20 (concept board r1, directions A/B/C).
- **Direction B is the refinement candidate. It is NOT approved.**
- The board is exploration only. It goes through the concept route (`art/concepts/char_zila/v001/`), never production validation.

**Fixed rules:**
- Zila is the **only playable character**.
- Febri is an NPC only, with no movement sprites in this round. The height difference between them must stay 3–6 cm in every pose.

## What r1 showed (measured)
| | Concept B (as drawn) | Art Bible target (`specs/characters/char_zila.json`) |
|---|---|---|
| Height | 165 cm (scaled) | 165 cm |
| Head count (crown → chin) | **≈ 5.83–5.9** | **≈ 4.6** |
| Head height | ≈ 28 cm → **56 px HD / 28 px SD** | ≈ 36 cm → **72 px HD / 36 px SD** |
| Face (brow → chin) at SD | ≈ 14 px | ≈ 18 px |

- Evidence: `docs/reviews/char-zila-concept/01-concept-b-game-scale-vs-4.6-heads.png`. It shows concept B next to the approved bed and nightstand at HD 2 px/cm and SD 1 px/cm, with 5.83- and 4.6-head silhouettes.
- **At game scale, B's head is about 22 % shorter than the target.** At SD the eyes, brows and mouth compress to a few pixels, and the expressions in the board's portraits will not survive in the sprite.
- The Art Bible's 4.6-head proportion exists for exactly this reason: a recognisable face and readable emotions in a 330 px (HD) / 165 px (SD) character, while staying more mature than the OG chibi.

## Keep from B
- Warm, soft illustrated finish consistent with the approved furniture: colour line work, upper-left light.
- Long brown hair with bangs and pink hair bows.
- Pink short-sleeve top with cream trim, cream A-line skirt, cream flats (the default outfit; others come from the outfit system).
- Calm, friendly expression range: neutral, smile, thoughtful.

## Change (targeted, round 2)
1. **Proportion:** 4.6 heads at 165 cm (head ≈ 36 cm crown to chin), with the same head size as Febri's future spec. Shorten the legs and torso slightly. **Do not** enlarge the head by squashing the body into chibi; target "storybook", not 2.5–3 heads.
2. **Face readability at SD:** larger eye shapes with a clear iris and highlight, defined brows and a simple mouth that still reads at 165 px. Test by downscaling to 1 px/cm before submitting.
3. **Identity:** less generic. One distinctive, CD-approved trait (hairline, bangs shape, or how the bows are worn) consistent across all views. **No real photos of real people in prompts or references** (public repository).
4. **Views:** front, ¾ front, side and back on one sheet. Same height, soles on one baseline, **transparent background, no baked floor shadow**, neutral pose with arms slightly away from the body (rig-friendly).
5. **Camera:** the game's elevated ×0.7 view (slightly top-down), not a straight-on fashion turnaround.

## Deliverable and route
- A **concept board** in `art/concepts/char_zila/v002/` (board + raw sources in `sources/`, with metadata declaring `submissionType: "concept"`).
- Branch: `codex/art/char-zila-concept-r2`.
- It is validated by the concept route only: provenance, integrity, privacy and ownership.
- **Production sprites come later**, after the CD approves the proportions. They go through `art/submissions/char_zila/` and the strict sprite validator (256×400 canvas, RGBA, pivot (128, 376), layered rig).

## Decisions needed before issuing
1. Confirm 4.6 heads (or give a different target, e.g. 5.0) after viewing the game-scale comparison.
2. Approve B as the base direction, or ask for an A/B hybrid.
3. Name the one distinctive identity trait to keep consistent.
