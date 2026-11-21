# world_bench v001 — review candidates, NOT production ready

A: three backrest slats, strongest traditional park identity, busiest at distant scale; seat plane too shallow.
B: two broad slats, simpler silhouette; seat plane still shallow.
C: two slats with deeper clear seat; preferred for targeted correction, not approved.

Actual master316x264, pivot158,252; footprint150x50cm, nominal seat45cm/top85cm. Measured seat front≈180, back≈122, base252 (±2px). Seat height72px vs90target =-20%, outside±10%; seat depth58px vs70=-17%, inside±25%. Correct leg/seat height anatomically while preserving50cm depth; do not vertically stretch whole image. Rear top width tapers slightly and lower legs look too short. No seating alignment claim. Original C was uniformly fitted300x217, no geometry warping. Raw A/B/C all preserved.

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
