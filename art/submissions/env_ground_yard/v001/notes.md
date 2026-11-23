# Batch F — grass fill v001

Three original candidates. A: brighter broad directional strokes, higher repeat visibility. B (recommended): finer/quietest surface, softer local value changes. C: busier blade texture and less calm at wide zoom. See candidate-repeat-comparison.png for HD256x126, SD128x63 and repeated fields. Selected B is a review candidate, not approved.

Opposite-edge mean RGB delta (X/Y): A3.8519/4.6471; B3.2619/3.0091; C3.6984/4.3438. All below spec14; edges are not byte-identical. Repeated mosaics do not show strong hard seams, but diagonal motifs recur. Green remains brighter/yellower than the intended muted sage; broad lawns may need a future approved colour adjustment or low-frequency variants. No seam-free claim based only on numeric tests.

Export: full generated B image downsampled with sharp Lanczos3 to256x126 RGBA sRGB, fully opaque. No fit-to-spec, procedural noise, painted edge patches or synthetic replacement. Ground footprint128x90cm, no object collision/pivot. Single HD decoded texture129024bytes, SD32256bytes, before mipmaps/driver overhead. File bytes are in validation.json. Raw candidates preserved.

This is fill only, not the complete P6 environment kit. Transitions, corners, terrain masks, roads/junctions, fences and vegetation remain future work after their contracts are agreed. Reuse approved plants where suitable; no duplicates made. No map dimensions or placements locked.

## Validation scope and integration gate
TECHNICAL PASS in an isolated integration fixture using the actual production spec commit fbe3d46 and PR21 pipeline b8d6b66. These dependencies are not merged into foundation 7796f60. This is not a claim that the current foundation branch CI already passes these new submissions. Claude must review and land the specs/pipeline dependencies before integrating art. No VISUAL PASS or PRODUCTION READY status is granted.

The official validator passed all 24 checks per asset; see validation.json, including retained style-reference warnings. The official gallery was built and inspected on checker, light and dark backgrounds. Its generic bed-centric checklist and clipped scale-column screenshot are not asset-specific geometry evidence; use the comparison board and P5 screenshots instead.

Browser evidence: P5 1e5a03f, default camera, afternoon, desktop 1440x1000 DPR1 and touch/mobile emulation 800x360 / 360x800 DPR2. Three captures per asset, no JavaScript page errors. Existing TEMP texture pixels were substituted only in browser memory; source, gameplay maps, collision, manifests and camera code were not modified. TEMP labels remain intentionally. Screenshots demonstrate appearance, not interaction acceptance or A05 hardware performance. P6 was unavailable at audit; no P6 integration is claimed. Avatar is the existing temporary figure, not an approved final Zila.

All 20 approved assets and earlier submissions remain unchanged. Built-in image generation worked; no external paid service or API credits were used. Sources are original outputs, not procedural stand-ins. The Creative Director must approve identity/style and remaining perspective/colour issues. Do not merge automatically.
