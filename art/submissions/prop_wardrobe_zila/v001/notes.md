# prop_wardrobe_zila v001 review

VISUAL PENDING. NOT PRODUCTION READY. Batch B round1; one original generated candidate for this asset. Wardrobe was generated first and selected as the batch finish reference; the four remaining assets were also conditioned on its fitted master. This is a working style reference, NOT a visual approval. Official approved bed and nightstand condition every asset. Measurements are manual approximate master-pixel readings, not a geometric certification.

![Master](prop_wardrobe_zila_v001.png)

## Raw candidates

![candidate-a](../../../source/prop_wardrobe_zila/v001/candidate-a.png)

## Measurements and limitations

- Measured approximate top-plane backEdgeY50, frontEdgeY111, floor520. Front height409 vs420 (-2.6%, within10%); depth61 vs84 (-27.4%, just outside25%). Slight trapezoid convergence remains; crown lip is not counted as top plane.
- Walnut and blush closely match approved furniture; large panel looks upholstered rather than unequivocally painted wood. Knob placement and crown thickness need visual review.

## Reproduction

Run npm ci, npm run validate:art and npm run gallery. The generated gallery is ignored, not committed; official PR CI uploads it when available. Existing gameplay screenshots are baseline evidence, not integration tests of this asset. Metadata records checksums and all references. No engine or approved asset changes.

Local technical result: TECHNICAL PASS, 23 checks, no validator errors; coverage 0.669. Privacy and branch ownership checked separately. Official gallery inspected in Chromium; all114 images loaded. Both approved references were visually compared at the same2px/cm scale, with light/dark and SD views. Warm wood/pink/cream family is coherent; the geometry issues above remain unresolved. No visual approval is granted.
