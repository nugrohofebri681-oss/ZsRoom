# Bench v002 — targeted correction of candidate C

One targeted edit, not another A/B/C round. Original v001 remains on PR30. Warm walnut, two backrest boards and unadorned park-bench identity retained. Feet are longer and the seat is raised. Manual highlight-rim readings (approximately ±1px): baseline252, front156, rear102. Seat rise96px vs nominal90 (+6.7%); top-plane54px vs nominal70 (-22.9%). v001 seat rise72px was -20%. Art Bible tolerances are front ±10%, top ±25%; both measured ranges now pass, but this is not exact geometry matching.

Remaining defects: slight rear-edge convergence and the shallow end of allowed top-plane tolerance. No sitting animation/contact alignment has been tested. Original seat anchors and collision are preserved, not moved to hide painting error. Stronger wood grain than the bed is visible at HD; SD remains readable. Review whether this finish is cohesive enough.

Conditioning used the actual original candidate C and geometry template; the approved bed/nightstand were inherited through C's provenance and inspected in the comparison, not directly attached in this correction. The validator's two missing-direct-reference warnings are retained honestly. No false references were added.

Export: official fit-to-spec.mjs with --despeckle 40; content300x238 at8,15, canvas316x264, baseline252; 9 detached islands / 11 pixels removed. Master PNG SHA is in metadata. Raw source remains byte-identical.

## Validation scope and integration gate
TECHNICAL PASS in an isolated integration fixture using the actual production spec commit fbe3d46 and PR21 pipeline b8d6b66. These dependencies are not merged into foundation 7796f60. This is not a claim that the current foundation branch CI already passes these new submissions. Claude must review and land the specs/pipeline dependencies before integrating art. No VISUAL PASS or PRODUCTION READY status is granted.

The official validator passed all 24 checks per asset; see validation.json, including retained style-reference warnings. The official gallery was built and inspected on checker, light and dark backgrounds. Its generic bed-centric checklist and clipped scale-column screenshot are not asset-specific geometry evidence; use the comparison board and P5 screenshots instead.

Browser evidence: P5 1e5a03f, default camera, afternoon, desktop 1440x1000 DPR1 and touch/mobile emulation 800x360 / 360x800 DPR2. Three captures per asset, no JavaScript page errors. Existing TEMP texture pixels were substituted only in browser memory; source, gameplay maps, collision, manifests and camera code were not modified. TEMP labels remain intentionally. Screenshots demonstrate appearance, not interaction acceptance or A05 hardware performance. P6 was unavailable at audit; no P6 integration is claimed. Avatar is the existing temporary figure, not an approved final Zila.

All 20 approved assets and earlier submissions remain unchanged. Built-in image generation worked; no external paid service or API credits were used. Sources are original outputs, not procedural stand-ins. The Creative Director must approve identity/style and remaining perspective/colour issues. Do not merge automatically.
