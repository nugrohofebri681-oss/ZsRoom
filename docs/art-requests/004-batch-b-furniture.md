# Art Request 004 — Batch B: Work & dress furniture

**Read first:** [`BATCH_RULES.md`](BATCH_RULES.md) · Art Bible v1.5 · approved references (bed, nightstand) · in-room context `docs/reviews/foundation/desktop-slice-05-temp-labels-afternoon.png`

**Branch:** `codex/art/batch-b-r1` → one **draft** PR into `reboot/foundation`. Each asset gets its own folder, metadata, validation and approval.

## Assets (geometry from the specs; the spec JSON is authoritative)

| Asset | Size (cm) | Canvas | Pivot | Placement | Interaction | Template |
|---|---|---|---|---|---|---|
| `prop_wardrobe_zila` | 110×60, h 210 | 272×544 | (136, 520) | floor furniture (pivot = front floor edge) | Change outfit | [template](../../art-bible/perspective/prop_wardrobe_zila_template.png) |
| `prop_desk_zila` | 120×60, h 75 | 288×288 | (144, 264) | floor furniture (pivot = front floor edge) | — (the laptop is its own prop) | [template](../../art-bible/perspective/prop_desk_zila_template.png) |
| `prop_vanity_zila` | 100×45, h 165 | 240×448 | (120, 424) | floor furniture (pivot = front floor edge) | Look in the mirror | [template](../../art-bible/perspective/prop_vanity_zila_template.png) |
| `prop_chair_desk` | 45×45, h 90 | 144×288 | (72, 264) | floor furniture (pivot = front floor edge) | Sit at the desk | [template](../../art-bible/perspective/prop_chair_desk_template.png) |
| `prop_stool_vanity` | 40×40, h 45 | 128×192 | (64, 168) | floor furniture (pivot = front floor edge) | Sit at the vanity | [template](../../art-bible/perspective/prop_stool_vanity_template.png) |

## Design notes per asset

### `prop_wardrobe_zila` — Zila's Wardrobe
Two-door walnut wardrobe, 210 cm. Panelled doors with **blush-pink inset panels** echoing the bed's headboard, small round knobs, crown moulding, low plinth with short feet. The largest asset: generate it first.
- Heights: top 210 cm. artBounds x 18→254, y 8→528. Base line y 520 ± 8.
- Spec: [`specs/props/prop_wardrobe_zila.json`](../../specs/props/prop_wardrobe_zila.json)

### `prop_desk_zila` — Zila's Desk
Walnut writing desk, 75 cm top, a small drawer unit on the right, open knee space on the left. **CORRECTED (r2): the desk is CLEAN — nothing on the top.** The laptop and mug are separate surface props (`prop_laptop_zila`, `prop_mug_zila`, below) placed by the engine on the desk's measured top surface.
> ~~On the desktop: an open laptop (screen facing the wall…)~~ This r1 instruction was **wrong**. Zila sits on the chair SOUTH of the desk, so a laptop's screen faces SOUTH, toward her and the viewer (see the laptop spec).
- Heights: top 75 cm, legs 70 cm. artBounds x 16→272, y 22→272. Base line y 264 ± 8.
- Spec: [`specs/props/prop_desk_zila.json`](../../specs/props/prop_desk_zila.json)

### `prop_vanity_zila` — Zila's Vanity
Cream/warm-white vanity table (contrast with the walnut set), two small drawers, slim legs. An **oval mirror** at the back to 165 cm with a blush-pink frame and small round bulbs around it (painted **off**). The glass shows a soft pale-blue reflection gradient only, never a reflected room.
- Heights: top 75 cm, mirrorTop 165 cm. artBounds x 12→228, y 23→432. Base line y 424 ± 8.
- Spec: [`specs/props/prop_vanity_zila.json`](../../specs/props/prop_vanity_zila.json)

### `prop_chair_desk` — Desk Chair
Walnut desk chair with a blush cushion. It **faces NORTH toward the desk**, so the game camera sees it **from behind**: the **backrest is the nearest part** (lowest on screen), and it covers most of the seat. Only the seat's side edges and a sliver of cushion show *above and behind* the backrest; the two back legs are in front, the two front legs further back. **Not** a front view: no full seat cushion visible below the backrest.
- Heights: seat 45 cm, top 90 cm. artBounds x 19→125, y 13→272. Base line y 264 ± 8.
- Spec: [`specs/props/prop_chair_desk.json`](../../specs/props/prop_chair_desk.json)

### `prop_stool_vanity` — Vanity Stool
Round upholstered stool, 45 cm, blush-pink velvet seat on four slim walnut legs.
- Heights: seat 45 cm, top 45 cm. artBounds x 16→112, y 14→176. Base line y 168 ± 8.
- Spec: [`specs/props/prop_stool_vanity.json`](../../specs/props/prop_stool_vanity.json)

## Round 2 (`codex/art/batch-b-r2`) — targeted revisions only

Decided from the in-game review of r1 (`docs/reviews/batch-b-r1-lamp-v001.md`). **Do not regenerate the wardrobe.** Keep each asset's approved-looking design, colours and finish; change only what is listed.

| Asset | v002 change | Regenerate? |
|---|---|---|
| `prop_desk_zila` | (1) **Remove the laptop and mug**: a clean, empty desktop. (2) Deeper top plane: back edge at about **y 30**, front edge at about **y 114** (the top plane is 84 px deep; r1 was 45 px). Keep the pedestal with pink drawers, the knee space, the wood and the proportions. | yes, conditioned on the r1 master |
| `prop_chair_desk` | **Rear view** (see the design notes above). Same wood, cushion colour and size. Seat at 45 cm, backrest top at 90 cm. | yes, conditioned on the r1 master |
| `prop_stool_vanity` | Seat top at **45 cm**: front edge of the seat at about **y 78** (r1 ≈ y 94, too low). The round seat reads as an ellipse with **height ≈ 0.7 × width** (r1 ≈ 0.45, too side-on). Same velvet and legs. | yes, conditioned on the r1 master |
| `prop_vanity_zila` | (1) Deeper tabletop: front edge ≈ y 274, back edge ≈ y 211 (63 px; r1 was 25). (2) Mirror about 15 % smaller and centred. (3) Clean alpha: no stray flecks. Run `fit-to-spec … --despeckle 60`, which is cleanup only, not repainting. Keep the bulbs, colours and drawers. | yes, conditioned on the r1 master |
| `prop_lamp_zila` (PR #6) | **No regeneration.** Re-export candidate B by height: `node scripts/fit-to-spec.mjs art/source/prop_lamp_zila/v001/candidate-b.png prop_lamp_zila art/submissions/prop_lamp_zila/v002/prop_lamp_zila_v002.png --height 106`, then copy the raw source to `art/source/prop_lamp_zila/v002/` and write new metadata. | no |
| `prop_laptop_zila` | **New** (spec below). | new |
| `prop_mug_zila` | **New** (spec below). | new |

### `prop_laptop_zila` — open laptop (surface prop on the desk)
Spec: [`specs/props/prop_laptop_zila.json`](../../specs/props/prop_laptop_zila.json) · canvas 96×112 · pivot (48, 76) = **centre of the base** · base front edge y 91.

**Orientation (Creative Director correction):** Zila sits SOUTH of the desk, facing NORTH.
- The **keyboard deck** is the southern half of the base, nearest the viewer and the chair.
- The **hinge is at the NORTH** (rear) edge of the base.
- The **screen stands at the back**, opened about 100°, with its **DISPLAY facing SOUTH**: the game camera sees the screen's face (switched off, dark glossy, with a soft reflection), never the back of the lid.
- Blush-pink aluminium body to match the room; no logo or text. Painted unlit: the engine handles any screen glow.

### `prop_mug_zila` — cream mug (surface prop on the desk)
Spec: [`specs/props/prop_mug_zila.json`](../../specs/props/prop_mug_zila.json) · canvas 48×56 · pivot (24, 38) = centre of the base. A cream ceramic mug, 8 cm across and 10 cm tall, handle to the right, a little cocoa visible inside. Seen from above at the game angle (rim ellipse ≈ 0.7).

## Done when

- [ ] Every asset in the table has a master, `metadata.json` (with `"batch": "B"` in notes), `prompt.md` and raw outputs.
- [ ] `npm run validate:art` passes for every asset (or the failure is listed as a known issue).
- [ ] The gallery was reviewed beside the approved bed and nightstand. `notes.md` per asset names what still looks off.
- [ ] Draft PR opened. Not merged.
