# world_cabinet_low v001 — review candidates, NOT production ready

A: two recessed-panel doors, brass knobs, warmer/taller-looking cabinet; good material match but shallow top.
B: similar doors, quieter grain and compact form; preferred neutral reusable direction. Generator did not follow requested plain slabs/wood pulls, so this is NOT three equally distinct designs.
C: empty open shelves left/one door right, useful shoe-storage identity but far too squat at width fit; not selected.

Actual master216x180,pivot108,168; footprint100x40cm,nominal top50cm. Measured top rear≈42,front≈70,base168(±2px). Front height98px vs100=-2%, inside±10%; plane28px vs56=-50%, outside±25%. Needs deeper rectangular top plane and parallel edges; current top narrows toward rear. Do not place surface props on nominal top before corrected art has measured anchors. Original B uniformly fitted200x127; no nonuniform stretch or decor added. Top is empty.

## Scope and pipeline status
Foundation7796f60; latest P4 inspected2b81591. PR19/21/26/27 unchanged from previous audit. All20approved bedroom assets and BatchEv001 preserved. No engine, gameplay map, manifest, Art Bible or official spec edits. Built-in imagegen worked: three actual original candidates per asset, no paid API. Candidate comparison PNG shows originals fitted uniformly at HD/SD and a distant scale illustration; no procedural artwork substituted.

Geometry/canvas/pivot/collision copied unchanged from specs/world/props in foundation and P4. production-spec.proposed.json adds bounds/export constraints for review, not an approved spec. To use unchanged official fit/validate/gallery scripts, that contract was placed in specs/props in a disposable worktree ONLY. Standard foundation loadSpecs does not read world-temp specs: ordinary branch validation is BLOCKED (missing production spec). Conditional isolated export validation passes24checks; painted-geometry review does NOT pass. The generated official gallery's TECHNICAL PASS badge refers ONLY to that proposed-contract export test, not overall readiness. Do not integrate these candidates or change collision/seat anchors to accommodate the artwork.

## P4 visual evidence
Four screenshots per asset: desktop default, desktop near object, Android landscape800x360DPR2, portrait360x800DPR2. No engine file changed: the candidate PNG replaced the existing TEMP canvas texture in browser memory only. No map placements changed; status labels correctly remain TEMP. Default P4 zoom retained. Zero pageerrors in8captures. These are actual P4 screenshots, not a static full-room composition or physical A05 performance benchmark. Character shown is still TEMP Zila. p4-evidence.json records camera and state. Source and runtime assets remain unchanged.

## Reuse and character gates
No plant generated. Approved tall plant is165cm high/base40x40, while world_plant_floor is120cm/base45x45. Reuse approved plant at its true scale and approved collision only where clearance allows; do not swap IDs, shrink it or silently inherit the placeholder collider. Small approved plant is a surface prop, not a replacement for a floor plant. Claude handles placements after review.

Zila B remains candidate only: target4.6heads, current≈5.83. No character regeneration or animation. Future refinement must test face/paired pink bows at actual P4 wide camera; current portrait polish does not prove distant face readability. Keep long brown hair, consistent bangs and identity review before production. BatchE floor/wall remainv001 pending CDdecision, no automatic desaturation.

## Next review
CD: choose preferred furniture design, not final approval. Recommendation: narrow geometry revision of selected candidate rather than more broad designs. Claude: review/promote production contract and provide official template/request before final exports; preserve current gameplay geometry. No merge, approval or deployment performed.
