# Low cabinet v002 — targeted correction of candidate B

One targeted edit, not another A/B/C round. Original v001 remains on PR31. Clean empty top, two doors, warm walnut and brass knobs retained. Manual highlight-rim readings (approximately ±1px): baseline168, front70, rear26. Front rise98px vs nominal100 (-2%); top-plane44px vs nominal56 (-21.4%), improved from v001 28px (-50%). Art Bible tolerances front ±10%, top ±25% now pass; this is not exact nominal matching.

Remaining defects: top still slightly shallow, with rear-edge taper rather than perfectly parallel oblique edges. Review together with approved nightstand/bed. No new host-placement anchors are approved. Collision and all pre-existing gameplay fields are unchanged; no gameplay resize was used to hide the error. HD grain is stronger than on softer approved pieces, though SD silhouette is clear.

Conditioning used actual candidate B and geometry template; approved bed/nightstand were indirect historical references, not direct attachments in this edit. Two missing-direct-reference warnings are retained, not hidden by inaccurate metadata.

Export: official fit-to-spec.mjs with --despeckle 40; content200x143 at8,26, canvas216x180, baseline168; 9 detached islands / 22 pixels removed. Raw remains byte-identical.

## Validation scope and integration gate
TECHNICAL PASS in an isolated integration fixture using the actual production spec commit fbe3d46 and PR21 pipeline b8d6b66. These dependencies are not merged into foundation 7796f60. This is not a claim that the current foundation branch CI already passes these new submissions. Claude must review and land the specs/pipeline dependencies before integrating art. No VISUAL PASS or PRODUCTION READY status is granted.

The official validator passed all 24 checks per asset; see validation.json, including retained style-reference warnings. The official gallery was built and inspected on checker, light and dark backgrounds. Its generic bed-centric checklist and clipped scale-column screenshot are not asset-specific geometry evidence; use the comparison board and P5 screenshots instead.

Browser evidence: P5 1e5a03f, default camera, afternoon, desktop 1440x1000 DPR1 and touch/mobile emulation 800x360 / 360x800 DPR2. Three captures per asset, no JavaScript page errors. Existing TEMP texture pixels were substituted only in browser memory; source, gameplay maps, collision, manifests and camera code were not modified. TEMP labels remain intentionally. Screenshots demonstrate appearance, not interaction acceptance or A05 hardware performance. P6 was unavailable at audit; no P6 integration is claimed. Avatar is the existing temporary figure, not an approved final Zila.

All 20 approved assets and earlier submissions remain unchanged. Built-in image generation worked; no external paid service or API credits were used. Sources are original outputs, not procedural stand-ins. The Creative Director must approve identity/style and remaining perspective/colour issues. Do not merge automatically.
