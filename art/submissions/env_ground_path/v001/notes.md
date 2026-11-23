# Batch F — compacted earth fill v001

Three original candidates. A: warmer/orange with obvious pebbles that repeat. B: quieter but still orange. C (recommended): subtler warm taupe, lowest landmark detail and strongest reusable-fill potential. See candidate-repeat-comparison.png for HD256x126, SD128x63 and repeated fields. Recommendation is not visual approval.

Opposite-edge mean RGB delta (X/Y): A3.4339/3.0000; B1.7143/2.0951; C1.9709/2.2773. All below14, not byte-identical. C is selected for colour/detail, not the lowest numerical delta. Remaining limitations: low-frequency brush pattern still repeats; standalone dirt is not a believable completed path without edge blending, vegetation and path topology. Do not place sharp squares and call the transition finished.

Export: full sourceC downsampled with sharp Lanczos3 to256x126 RGBA sRGB fully opaque. No fit-to-spec or procedural texture generation. DecodedHD129024bytes, SD32256bytes before overhead. File bytes in validation.json. Conditioning was approved bed plus selected generated grassB, not direct nightstand; retain the one reference warning.

IMPORTANT: p5-material-proxy screenshots substitute grass with dirt only to inspect value/texture at the same gameplay scale. They are not a proposed all-dirt yard, a P6 layout, or an implemented grass-dirt transition. Fill only; masks, road geometry, edges/corners and other environment-kit pieces are not delivered in this first small batch.

## Validation scope and integration gate
TECHNICAL PASS in an isolated integration fixture using the actual production spec commit fbe3d46 and PR21 pipeline b8d6b66. These dependencies are not merged into foundation 7796f60. This is not a claim that the current foundation branch CI already passes these new submissions. Claude must review and land the specs/pipeline dependencies before integrating art. No VISUAL PASS or PRODUCTION READY status is granted.

The official validator passed all 24 checks per asset; see validation.json, including retained style-reference warnings. The official gallery was built and inspected on checker, light and dark backgrounds. Its generic bed-centric checklist and clipped scale-column screenshot are not asset-specific geometry evidence; use the comparison board and P5 screenshots instead.

Browser evidence: P5 1e5a03f, default camera, afternoon, desktop 1440x1000 DPR1 and touch/mobile emulation 800x360 / 360x800 DPR2. Three captures per asset, no JavaScript page errors. Existing TEMP texture pixels were substituted only in browser memory; source, gameplay maps, collision, manifests and camera code were not modified. TEMP labels remain intentionally. Screenshots demonstrate appearance, not interaction acceptance or A05 hardware performance. P6 was unavailable at audit; no P6 integration is claimed. Avatar is the existing temporary figure, not an approved final Zila.

All 20 approved assets and earlier submissions remain unchanged. Built-in image generation worked; no external paid service or API credits were used. Sources are original outputs, not procedural stand-ins. The Creative Director must approve identity/style and remaining perspective/colour issues. Do not merge automatically.
