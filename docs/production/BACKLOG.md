# ZsRoom production backlog

**Current goal:** a beautiful, cohesive, playable HD bedroom (vertical slice). The slice is **playable now** with labelled TEMP art at final geometry; each approved illustration swaps in without layout changes.

Legend: ✅ done · 🟡 in progress or requested · ⏳ blocked by a dependency · ⬜ not started

## Group 0 — Engine foundation (done)
✅ Projection, collision, depth/occlusion, doors, save v2 · ✅ floor / surface / **wall** / **decal** layers · ✅ engine lights and shadows · ✅ time of day (4 phases, sky behind windows, ambient tint) · ✅ interactions: dialogue, rest/sleep, sit, outfit, curtains, lights · ✅ TEMP art renderer at exact asset geometry · ✅ budget and reachability tests

## Group A — Bedside set ✅ (bed v001, nightstand v001, lamp v002)
## Group B — Work & dress furniture ✅ (wardrobe v001, desk v002 + laptop v001 + mug v001, chair v002, vanity v002, stool v002)
**20 approved assets in the bedroom** (only the two shell tiles remain TEMP).

## Group C — Soft furnishings & wall ✅ (window, rug, shelf, photo string, fairy lights, neon — v001, CD VISUAL PASS, integrated with per-asset exceptions; [review](../reviews/batch-cd-r1.md))
⬜ Follow-up: a painted closed-curtains state for the window (the engine draws curtains behind the frame meanwhile).

## Group D — Living details ✅ (tall plant, cat bed Mochi, pouf with measured 30 cm seat, small plant — v001, CD VISUAL PASS, integrated)

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

## World 01 — Batuphat–Lhokseumawe → [WORLD_01_ROADMAP.md](WORLD_01_ROADMAP.md)
✅ **P0 checkpoint 1:**
- 7 connected maps (bedroom → hall → stairs → living room → yard → street → minimarket / workplace).
- Four-side, locked and story-gated doors; exterior maps; story events and dialogue data.
- NPCs with schedules; comms contract (placeholder content); save v3.
- Route e2e test through real doors.

✅ **P1:** kitchen (breakfast loop), Batuphat west block (park, becak motor, warung), Mixue (order loop), Indomaret TEMP identity, NPC yielding, test-only `?fast`, ground zones. **10 connected maps, 6 NPCs.**

All new locations are TEMP and **provisional** pending the Creative Director's world-map and story review.

## Ordering
1. **Now, in parallel:** Codex runs Batch C (`codex/art/batch-c-r1`) and Batch D (`codex/art/batch-d-r1`). Claude continues Group G (sound, interaction highlight, real-device performance) and character frame loading.
2. **After each batch:** Claude runs the in-game review (gallery, bed pairing, gameplay screenshots), the CD approves per asset, and Claude integrates the approved ones in a single merge.
3. **Characters:** start once the CD signs off the proportions sheet (Group F).

## Budgets (enforced by `tests/unit/bedroom-slice.test.ts`)
HD textures ≤ 48 MB, SD ≤ 16 MB per room · ≤ 6 engine lights · ≤ 40 props · every interaction reachable on foot from the spawn.
