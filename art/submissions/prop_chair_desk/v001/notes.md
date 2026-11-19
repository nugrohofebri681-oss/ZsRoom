# prop_chair_desk v001 review

VISUAL PENDING. NOT PRODUCTION READY. Batch B round1; one original generated candidate for this asset. Wardrobe was generated first and selected as the batch finish reference; the four remaining assets were also conditioned on its fitted master. This is a working style reference, NOT a visual approval. Official approved bed and nightstand condition every asset. Measurements are manual approximate master-pixel readings, not a geometric certification.

![Master](prop_chair_desk_v001.png)

## Raw candidates

![candidate-a](../../../source/prop_chair_desk/v001/candidate-a.png)

## Measurements and limitations

- Measured approximate seat far/backEdgeY148, near/frontEdgeY171, floor264; backrest top96. Seat height93 vs90 (+3.3%, within10%); exposed seat depth23 vs63 (-63.5%). Backrest occludes part of seat so full depth cannot be established from visible pixels; do not certify geometry from this estimate.
- Near-side uprights overlap the cushion, consistent with rear view, but facing/readability is still ambiguous and needs a desk pairing check. No sit animation or contact alignment tested.
- Pink and walnut match reference family; cushion and backrest feel thick at SD scale.

## Reproduction

Run npm ci, npm run validate:art and npm run gallery. The generated gallery is ignored, not committed; official PR CI uploads it when available. Existing gameplay screenshots are baseline evidence, not integration tests of this asset. Metadata records checksums and all references. No engine or approved asset changes.

Local technical result: TECHNICAL PASS, 23 checks, no validator errors; coverage 0.245. Privacy and branch ownership checked separately. Official gallery inspected in Chromium; all114 images loaded. Both approved references were visually compared at the same2px/cm scale, with light/dark and SD views. Warm wood/pink/cream family is coherent; the geometry issues above remain unresolved. No visual approval is granted.
