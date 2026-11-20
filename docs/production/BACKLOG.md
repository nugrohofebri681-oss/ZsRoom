# ZsRoom production backlog

**Current goal:** a beautiful, cohesive, playable HD bedroom (vertical slice). The slice is **playable now** with labelled TEMP art at final geometry; each approved illustration swaps in without layout changes.

Legend: ✅ done · 🟡 in progress or requested · ⏳ blocked by a dependency · ⬜ not started

## Group 0 — Engine foundation (done)
✅ Projection, collision, depth/occlusion, doors, save v2 · ✅ floor / surface / **wall** / **decal** layers · ✅ engine lights and shadows · ✅ time of day (4 phases, sky behind windows, ambient tint) · ✅ interactions: dialogue, rest/sleep, sit, outfit, curtains, lights · ✅ TEMP art renderer at exact asset geometry · ✅ budget and reachability tests

## Group A — Bedside set ✅ (bed v001, nightstand v001, lamp v002)
## Group B — Work & dress furniture ✅ (wardrobe v001, desk v002 + laptop v001 + mug v001, chair v002, vanity v002, stool v002)
**10 approved assets in the bedroom.**

## Group C — Soft furnishings & wall → [Request 005](../art-requests/005-batch-c-soft-wall.md) — **NEXT (highest visual impact: window, rug and wall cover the largest screen area)**
window + curtains · rug · wall shelf · photo string · fairy lights · neon sign — 🟡 **v001 submitted (PR #14), in-game review done: all six recommended for acceptance** ([review](../reviews/batch-cd-r1.md)); awaiting CD VISUAL PASS. Engine: per-bulb glow, self-lit neon, curtains behind the frame. Engine support done (wall layer, decal layer, sky behind glass, lights).
⬜ Follow-up: a closed-curtains art state for the window (the engine currently draws simple closed curtains).

## Group D — Living details → [Request 006](../art-requests/006-batch-d-living-details.md) — **NEXT, in parallel with C** (independent assets, separate branch)
tall plant · cat bed with sleeping cat · pouf · small plant — 🟡 **v001 submitted (PR #15), all four recommended for acceptance**; pouf seat measured at 30 cm; small plant moved beside the door. Awaiting CD VISUAL PASS.

## Group E — Room shell (environment art) → [Request 007](../art-requests/007-batch-e-room-shell.md)
- Engine ✅: tile shell (Blitter quads, edge-cropped frames, runtime density), spec type `environment`, seamless-edge check in `validate-art`, and the same render path for TEMP and approved tiles.
- Art 🟡: requested (floor tile + wall strip). Seamless tiling is the riskiest generator task; plan for a Krita/Photopea cleanup pass (free tools).

## Group F — Characters ⏳ (see [CHARACTER_PLAN.md](CHARACTER_PLAN.md))
Art is blocked on Creative Director approval of proportions and design references.
Engine ✅: layered rig (spec `rig`), facing resolution + mirroring rules (Febri's bag never mirrored), distance-synced walk frames (no foot sliding), idle/sit poses, outfit layer swap, and a TEMP vector figure using the same layer architecture.

## Group G — Polish & systems for the slice
✅ Tap/click-to-move (A* + path smoothing; tap furniture to walk there and use it) · ✅ camera look-ahead, wheel/pinch/button zoom · ✅ mobile HUD (safe-area insets, contextual E button label, compact badge) · ✅ baked single-quad lighting · ✅ frame-rate-independent movement (real elapsed time) · ✅ contact-resolving collision
✅ **Sound** (original procedural synthesis: day/night ambience, contact-frame footsteps on wood and rug, lamp click, sit/cloth/chime/door) · ✅ **audio unlock** on first gesture (Android-safe), suspended when hidden or muted · ✅ **sound panel** (mute, volume, room, effects; saved; M key) · ✅ **interaction highlight** (silhouette halo behind the usable prop, door floor glow) — see [living-bedroom-polish](../reviews/living-bedroom-polish.md)
- Sitting and sleeping poses once character art exists.
- Day-phase transitions with a short animated fade of the lights.
- Physical Android performance check (Galaxy A05 class): record fps and memory in `docs/reviews/`.
- Texture atlas packing when the approved art count exceeds ~10 per room.

## Ordering
1. **Now, in parallel:** Codex runs Batch C (`codex/art/batch-c-r1`) and Batch D (`codex/art/batch-d-r1`). Claude continues Group G (sound, interaction highlight, real-device performance) and character frame loading.
2. **After each batch:** Claude runs the in-game review (gallery, bed pairing, gameplay screenshots), the CD approves per asset, and Claude integrates the approved ones in a single merge.
3. **Characters:** start once the CD signs off the proportions sheet (Group F).

## Budgets (enforced by `tests/unit/bedroom-slice.test.ts`)
HD textures ≤ 48 MB, SD ≤ 16 MB per room · ≤ 6 engine lights · ≤ 40 props · every interaction reachable on foot from the spawn.
