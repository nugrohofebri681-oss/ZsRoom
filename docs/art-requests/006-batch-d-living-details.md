# Art Request 006 — Batch D: Living details

**Read first:** [`BATCH_RULES.md`](BATCH_RULES.md) · Art Bible v1.5 · approved references (bed, nightstand) · in-room context `docs/reviews/foundation/desktop-slice-05-temp-labels-afternoon.png`

**Branch:** `codex/art/batch-d-r1` → one **draft** PR into `reboot/foundation`. Each asset gets its own folder, metadata, validation and approval.

## Assets (geometry from the specs; the spec JSON is authoritative)

| Asset | Size (cm) | Canvas | Pivot | Placement | Interaction | Template |
|---|---|---|---|---|---|---|
| `prop_plant_tall_zila` | 40×40, h 165 | 160×432 | (80, 408) | floor furniture (pivot = front floor edge) | Water the plant | [template](../../art-bible/perspective/prop_plant_tall_zila_template.png) |
| `prop_catbed_mochi` | 60×50, h 30 | 160×176 | (80, 152) | floor furniture (pivot = front floor edge) | Pet the cat | [template](../../art-bible/perspective/prop_catbed_mochi_template.png) |
| `prop_pouf_floor` | 50×50, h 38 | 144×192 | (72, 168) | floor furniture (pivot = front floor edge) | Sit on the pouf | [template](../../art-bible/perspective/prop_pouf_floor_template.png) |
| `prop_plant_small` | 35×35, h 60 | 144×224 | (72, 200) | floor furniture (pivot = front floor edge) | — | [template](../../art-bible/perspective/prop_plant_small_template.png) |

## Design notes per asset

### `prop_plant_tall_zila` — Tall Fiddle-Leaf Plant
Tall fiddle-leaf fig (165 cm overall) in a cream ceramic pot (40 cm). Large glossy leaves with 2–3 tone steps and a few individually readable leaves. Foliage may spread to 64 cm wide. It is a **free-standing occluder**: the player can walk behind it, so keep the silhouette clean.
- Heights: pot 40 cm, top 165 cm. artBounds x 12→148, y 14→416. Base line y 408 ± 8.
- Spec: [`specs/props/prop_plant_tall_zila.json`](../../specs/props/prop_plant_tall_zila.json)

### `prop_catbed_mochi` — Cat Bed with Sleeping Cat
Round plush cat bed (60×50 cm), blush rim and cream cushion, with a **sleeping grey cat** curled inside (the original room's cat). Peaceful, closed eyes, tail wrapped around.
- Heights: rim 22 cm, top 30 cm. artBounds x 12→148, y 14→160. Base line y 152 ± 8.
- Spec: [`specs/props/prop_catbed_mochi.json`](../../specs/props/prop_catbed_mochi.json)

### `prop_pouf_floor` — Floor Pouf
Round knitted floor pouf (50 cm across, 38 cm tall) in cream with chunky knit texture and a tufted top.
- Heights: seat 38 cm, top 38 cm. artBounds x 14→130, y 14→176. Base line y 168 ± 8.
- Spec: [`specs/props/prop_pouf_floor.json`](../../specs/props/prop_pouf_floor.json)

### `prop_plant_small` — Small Potted Plant
Small leafy plant (60 cm overall) in a blush-pink pot, for the corner by the door.
- Heights: pot 30 cm, top 60 cm. artBounds x 17→127, y 23→208. Base line y 200 ± 8.
- Spec: [`specs/props/prop_plant_small.json`](../../specs/props/prop_plant_small.json)

## Done when

- [ ] Every asset in the table has a master, `metadata.json` (with `"batch": "D"` in notes), `prompt.md` and raw outputs.
- [ ] `npm run validate:art` passes for every asset (or the failure is listed as a known issue).
- [ ] The gallery was reviewed beside the approved bed and nightstand. `notes.md` per asset names what still looks off.
- [ ] Draft PR opened. Not merged.
