# ZsRoom production backlog

**Current goal:** a beautiful, cohesive, playable HD bedroom (vertical slice). The slice is **playable now** with labelled TEMP art at final geometry; each approved illustration swaps in without layout changes.

Legend: ✅ done · 🟡 in progress or requested · ⏳ blocked by a dependency · ⬜ not started

## Group 0 — Engine foundation (done)
✅ Projection, collision, depth/occlusion, doors, save v2 · ✅ floor / surface / **wall** / **decal** layers · ✅ engine lights and shadows · ✅ time of day (4 phases, sky behind windows, ambient tint) · ✅ interactions: dialogue, rest/sleep, sit, outfit, curtains, lights · ✅ TEMP art renderer at exact asset geometry · ✅ budget and reachability tests

## Group A — Bedside set (art)
| Asset | Status | Depends on |
|---|---|---|
| `prop_bed_zila` | ✅ approved v001 | — |
| `prop_nightstand_zila` | ✅ approved v001 (CD geometry exception) | — |
| `prop_lamp_zila` | 🟡 Request 003 | nightstand measured surface ✅ |

## Group B — Work & dress furniture → [Request 004](../art-requests/004-batch-b-furniture.md)
wardrobe · desk · vanity · desk chair · vanity stool — 🟡 requested. Depends on the approved furniture references ✅. No engine dependency (already playable with TEMP).

## Group C — Soft furnishings & wall → [Request 005](../art-requests/005-batch-c-soft-wall.md)
window + curtains · rug · wall shelf · photo string · fairy lights · neon sign — 🟡 requested. Engine support done (wall layer, decal layer, sky behind glass, lights).
⬜ Follow-up: a closed-curtains art state for the window (the engine currently draws simple closed curtains).

## Group D — Living details → [Request 006](../art-requests/006-batch-d-living-details.md)
tall plant · cat bed with sleeping cat · pouf · small plant — 🟡 requested.

## Group E — Room shell (environment art) ⏳
Seamless floor planks (honey oak), wallpaper + wainscot strip, skirting/crown trims, south doorway threshold.
- Engine ⬜: tile-based shell renderer (TileSprite) replacing the TEMP canvas shell; spec type `environment` (tile size in cm, seamless check in the validator).
- Art ⏳: request after Groups B/C. Seamless tiling is the riskiest generator task; plan for a Krita/Photopea cleanup pass (free tools).

## Group F — Characters ⏳ (see [CHARACTER_PLAN.md](CHARACTER_PLAN.md))
Blocked on Creative Director approval of proportions and design references. The engine-side layered rig and animation player can start in parallel.

## Group G — Polish & systems for the slice ⬜
- Sound: room ambience, lamp click, footsteps on wood and rug (free/CC0 sources only).
- Interaction feedback: highlight outline on the focused prop; sitting and sleeping poses once character art exists.
- Day-phase transitions with a short animated fade of the lights.
- Physical Android performance check (Galaxy A05 class): record fps and memory in `docs/reviews/`.
- Texture atlas packing when the approved art count exceeds ~10 per room.

## Ordering
1. **Now, in parallel:** Codex runs Requests 003 → 004 → 005 → 006 (one draft PR per batch). Claude builds Group E engine support and Group G polish.
2. **After each batch:** Claude runs the in-game review (gallery, bed pairing, gameplay screenshots), the CD approves per asset, and Claude integrates the approved ones in a single merge.
3. **Characters:** start once the CD signs off the proportions sheet (Group F).

## Budgets (enforced by `tests/unit/bedroom-slice.test.ts`)
HD textures ≤ 48 MB, SD ≤ 16 MB per room · ≤ 6 engine lights · ≤ 40 props · every interaction reachable on foot from the spawn.
