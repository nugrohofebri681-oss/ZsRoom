# Art Request 005 — Batch C: Soft furnishings & wall

**Read first:** [`BATCH_RULES.md`](BATCH_RULES.md) · Art Bible v1.5 · approved references (bed, nightstand) · in-room context `docs/reviews/foundation/desktop-slice-05-temp-labels-afternoon.png`

**Branch:** `codex/art/batch-c-r1` → one **draft** PR into `reboot/foundation`. Each asset gets its own folder, metadata, validation and approval.

## Assets (geometry from the specs; the spec JSON is authoritative)

| Asset | Size (cm) | Canvas | Pivot | Placement | Interaction | Template |
|---|---|---|---|---|---|---|
| `wall_window_bedroom` | 140×8, h 125 | 448×304 | (224, 288) | north wall (pivot = front-face bottom centre) | Open / close the curtains | [template](../../art-bible/perspective/wall_window_bedroom_template.png) |
| `decal_rug_zila` | 260×180, h 1 | 560×288 | (280, 144) | floor decal (pivot = centre) | — | [template](../../art-bible/perspective/decal_rug_zila_template.png) |
| `wall_shelf_books` | 90×24, h 36 | 224×144 | (112, 128) | north wall (pivot = front-face bottom centre) | — | [template](../../art-bible/perspective/wall_shelf_books_template.png) |
| `wall_photos_string` | 80×2, h 40 | 192×128 | (96, 112) | north wall (pivot = front-face bottom centre) | Look at the photos | [template](../../art-bible/perspective/wall_photos_string_template.png) |
| `wall_fairy_lights` | 600×3, h 22 | 1232×96 | (616, 80) | north wall (pivot = front-face bottom centre) | — · engine light (paint UNLIT) | [template](../../art-bible/perspective/wall_fairy_lights_template.png) |
| `wall_neon_goodvibes` | 70×4, h 32 | 176×112 | (88, 96) | north wall (pivot = front-face bottom centre) | — · engine light (paint UNLIT) | [template](../../art-bible/perspective/wall_neon_goodvibes_template.png) |

## Design notes per asset

### `wall_window_bedroom` — Bedroom Window with Curtains
Cream-framed double window (140×125 cm, sill at 95 cm) with a cross muntin, a slim sill ledge, and **blush curtains tied back** on both sides of a walnut rod (curtains may extend 32 cm past each side). **The glass area must be fully transparent**: the engine draws the sky for each time of day behind it (see the dashed GLASS box on the template). Generate it first.
- Heights: top 125 cm. artBounds x 16→432, y 22→291. Base line y 288 ± 8.
- Spec: [`specs/props/wall_window_bedroom.json`](../../specs/props/wall_window_bedroom.json)

### `decal_rug_zila` — Bedroom Rug
Soft rounded-rectangle rug, 260×180 cm, lying **flat** on the floor (seen at ×0.7). Rose pink with a lighter blush border, a subtle tone-on-tone heart or petal pattern, plush texture, a hint of fringe on the short ends. No shadow and no thickness beyond ~1 cm.
- Heights: top 1 cm. artBounds x 10→550, y 10→278.
- Spec: [`specs/props/decal_rug_zila.json`](../../specs/props/decal_rug_zila.json)

### `wall_shelf_books` — Wall Shelf with Books
Floating walnut wall shelf (90 cm) on two small brackets, holding upright and leaning books in the palette colours and a tiny potted succulent.
- Heights: top 36 cm. artBounds x 18→206, y 18→131. Base line y 128 ± 8.
- Spec: [`specs/props/wall_shelf_books.json`](../../specs/props/wall_shelf_books.json)

### `wall_photos_string` — Photo String
A string of four polaroid photos hung with tiny pink clips on a thin cord with a gentle sag. The photo contents are soft, abstract travel scenes (sea, mountain, temple, sunset). **No people and no faces.**
- Heights: top 40 cm. artBounds x 12→180, y 25→115. Base line y 112 ± 8.
- Spec: [`specs/props/wall_photos_string.json`](../../specs/props/wall_photos_string.json)

### `wall_fairy_lights` — Fairy Lights
A 6 m string of small warm fairy-light bulbs in gentle swags across the top of the wall. Bulbs painted **off** (cream glass, no glow). The canvas is wide and thin. Keep the cord delicate.
- Heights: top 22 cm. artBounds x 12→1220, y 27→83. Base line y 80 ± 8.
- Spec: [`specs/props/wall_fairy_lights.json`](../../specs/props/wall_fairy_lights.json)

### `wall_neon_goodvibes` — Neon Sign “good vibes”
A small neon sign reading **“good vibes”** in a soft handwritten script, with pale pink glass tubes painted **off** (no glow), mounted on a clear acrylic backing with tiny standoffs.
- Heights: top 32 cm. artBounds x 14→162, y 22→99. Base line y 96 ± 8.
- Spec: [`specs/props/wall_neon_goodvibes.json`](../../specs/props/wall_neon_goodvibes.json)

## Done when

- [ ] Every asset in the table has a master, `metadata.json` (with `"batch": "C"` in notes), `prompt.md` and raw outputs.
- [ ] `npm run validate:art` passes for every asset (or the failure is listed as a known issue).
- [ ] The gallery was reviewed beside the approved bed and nightstand. `notes.md` per asset names what still looks off.
- [ ] Draft PR opened. Not merged.
