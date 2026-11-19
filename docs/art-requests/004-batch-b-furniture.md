# Art Request 004 — Batch B: Work & dress furniture

**Read first:** [`BATCH_RULES.md`](BATCH_RULES.md) · Art Bible v1.5 · approved references (bed, nightstand) · in-room context `docs/reviews/foundation/desktop-slice-05-temp-labels-afternoon.png`

**Branch:** `codex/art/batch-b-r1` → one **draft** PR into `reboot/foundation`. Each asset gets its own folder, metadata, validation and approval.

## Assets (geometry from the specs; the spec JSON is authoritative)

| Asset | Size (cm) | Canvas | Pivot | Placement | Interaction | Template |
|---|---|---|---|---|---|---|
| `prop_wardrobe_zila` | 110×60, h 210 | 272×544 | (136, 520) | floor furniture (pivot = front floor edge) | Change outfit | [template](../../art-bible/perspective/prop_wardrobe_zila_template.png) |
| `prop_desk_zila` | 120×60, h 75 | 288×288 | (144, 264) | floor furniture (pivot = front floor edge) | Open the laptop | [template](../../art-bible/perspective/prop_desk_zila_template.png) |
| `prop_vanity_zila` | 100×45, h 165 | 240×448 | (120, 424) | floor furniture (pivot = front floor edge) | Look in the mirror | [template](../../art-bible/perspective/prop_vanity_zila_template.png) |
| `prop_chair_desk` | 45×45, h 90 | 144×288 | (72, 264) | floor furniture (pivot = front floor edge) | Sit at the desk | [template](../../art-bible/perspective/prop_chair_desk_template.png) |
| `prop_stool_vanity` | 40×40, h 45 | 128×192 | (64, 168) | floor furniture (pivot = front floor edge) | Sit at the vanity | [template](../../art-bible/perspective/prop_stool_vanity_template.png) |

## Design notes per asset

### `prop_wardrobe_zila` — Zila's Wardrobe
Two-door walnut wardrobe, 210 cm. Panelled doors with **blush-pink inset panels** echoing the bed's headboard, small round knobs, crown moulding, low plinth with short feet. The largest asset: generate it first.
- Heights: top 210 cm. artBounds x 18→254, y 8→528. Base line y 520 ± 8.
- Spec: [`specs/props/prop_wardrobe_zila.json`](../../specs/props/prop_wardrobe_zila.json)

### `prop_desk_zila` — Zila's Desk
Walnut writing desk, 75 cm top, slim legs, a small drawer unit on the right. On the desktop: an **open laptop** (screen facing the wall, so we see its back and keyboard) and a cream mug. Keep the left half of the top clear.
- Heights: top 75 cm, legs 70 cm. artBounds x 16→272, y 22→272. Base line y 264 ± 8.
- Spec: [`specs/props/prop_desk_zila.json`](../../specs/props/prop_desk_zila.json)

### `prop_vanity_zila` — Zila's Vanity
Cream/warm-white vanity table (contrast with the walnut set), two small drawers, slim legs. An **oval mirror** at the back to 165 cm with a blush-pink frame and small round bulbs around it (painted **off**). The glass shows a soft pale-blue reflection gradient only, never a reflected room.
- Heights: top 75 cm, mirrorTop 165 cm. artBounds x 12→228, y 23→432. Base line y 424 ± 8.
- Spec: [`specs/props/prop_vanity_zila.json`](../../specs/props/prop_vanity_zila.json)

### `prop_chair_desk` — Desk Chair
Walnut desk chair with a blush cushion. It **faces north toward the desk**, so the backrest is on the near (south) side, seen from behind: the backrest rail and cushion, the seat behind it, four legs.
- Heights: seat 45 cm, top 90 cm. artBounds x 19→125, y 13→272. Base line y 264 ± 8.
- Spec: [`specs/props/prop_chair_desk.json`](../../specs/props/prop_chair_desk.json)

### `prop_stool_vanity` — Vanity Stool
Round upholstered stool, 45 cm, blush-pink velvet seat on four slim walnut legs.
- Heights: seat 45 cm, top 45 cm. artBounds x 16→112, y 14→176. Base line y 168 ± 8.
- Spec: [`specs/props/prop_stool_vanity.json`](../../specs/props/prop_stool_vanity.json)

## Done when

- [ ] Every asset in the table has a master, `metadata.json` (with `"batch": "B"` in notes), `prompt.md` and raw outputs.
- [ ] `npm run validate:art` passes for every asset (or the failure is listed as a known issue).
- [ ] The gallery was reviewed beside the approved bed and nightstand. `notes.md` per asset names what still looks off.
- [ ] Draft PR opened. Not merged.
