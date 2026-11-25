# Decisions required from Claude / Creative Director

This is a reviewable request for contract alignment, not a claim that Claude has agreed. No messages/comments were posted separately. P6.1 runtime dimensions take precedence over old Codex proposals, but do not settle unresolved artistic layer decisions.

## Freeze a versioned machine-readable contract

Per archetype: facade asset id; width and facade top height; physical building depth; final SD/HD canvas/padding/baseline/pivot; final roof shape and its pivot relative to front ground line; precise door rectangle and anchor offset; porch extent and whether standable; layer bindings and depth offsets; alpha/culling/occlusion bounds; and official validation schema/template. Distinguish archetype defaults from supported per-instance overrides. Do not mark TEMP specs as approved to unblock an art check.

1. **Small A:** preserve compact front, simplified trim. Use380cm width/360cm depth as runtime baseline. Freeze door height and baseline before reauthoring. Historical176cm door at420cm becomes only~159cm if uniformly fitted to380cm; shrinking the whole image worsens clearance.
2. **Large B:** resolve one-storey chosen art versus two-storey470cm runtime frontage. Recommended technical baseline remains620×460cm, not old600×400; CD must approve how to preserve terrace/hip-roof identity while adding a floor, or Claude must propose a separately tested one-storey archetype. Do neither silently. Historical165cm door only becomes~170.5cm at620width. Yard/gate is engine-owned; porch posts cannot block the130cm gate/entrance path. Existing tree/prop conflict requires an explicit integration review, not source-map edits by Codex.
3. **Ruko B:** resolve pitched roof versus flat runtime roof. Preserve commercial opening/shutters/material identity; reauthor front opening rather than stretching. Native content757px <840px needed for420cm at2px/cm. Obtain a genuinely larger source, not a fake upsample. Final height430cm excludes roof depth; don't squeeze two floors into an arbitrary mobile screenshot. Camera/culling changes belong to Claude; document the expected visibility criterion for a tall building at default landscape zoom.
4. **Warung C:** use600×420cm runtime baseline; its old200cm opening would scale to~240cm at600width, but this is an estimate, not verified corrected geometry. Source1222px only narrowly exceeds1200px required; layer extraction/trim can reduce usable density. Remove interactive-looking bench/counter from the exterior facade if they cannot have physical access. Match interior cream/walnut palette, not a copied floorplan. Confirm central portal with current per-building entrance (see JSON), versus selected art's left open bay/right counter.

## Existing runtime formulas (verified source, not new design)

`src/world/region.ts` merges archetype defaults and per-building overrides. With facade width W, depth D, height H, placement(cx,front):
- Solid rectangle `(cx-W/2, front-D, W, D)`; the building volume is solid even if the illustration shows an open bay.
- Facade pivot world `(cx, front)`, render `(cx,0.7*front)`. Dynamic building render bounds cover facade+roof, with occluder=true; do not infer behavior from facade spec `occluder:false` alone.
- Sort line = front; procedural roof depth = front−0.02.
- Door uses per-building dx/w; defaults dx0,w110. Entrance interaction anchor `(cx+dx,front+25)`, radius50. Inspectable houses use inspect anchor front+40 rather than a usable door.
- Roof top `(front-D)*0.7-H`, eave `front*0.7-H`. Projected depth bands small252,large322,ruko280,warung294 render-cm. At2px/cm:504,644,560,588px. These bands are not approved PNG canvases: shape-specific overhangs, ridge/parapet and padding still need specifying.
- `RoomScene.drawBuildings` uses generic12cm lateral overhang plus shape-specific strokes and culling bounds. Do not guess a roof export by doubling a facade canvas.

## Layer handoff proposal (requires agreement)

|Layer|Ownership / relationship|Gate|
|---|---|---|
|Front facade|Codex painting; front-ground pivot|2px/cm, final bounds, doors/windows correctly placed|
|Roof/rear silhouette|Codex art only after renderer binding agreed|Disable procedural roof only for matching approved roof asset; shared occlusion alpha/culling|
|Porch/awning|Separate attachment with local origin|Explicit depth/solid or standable area; no blocked entrance|
|Door/front opening|Per-archetype or override-aware module|Align visual opening with runtime entrance; no fake usable door on inspect-only home|
|Facade decoration|Optional reusable trim/sign|No permanent brand or excessive ornament; shadows remain compatible|
|Counter/seating|Separate props only if interactive|Owned collision/approach/sit anchors; not painted into inaccessible exterior|

Shared transparent master coordinates are preferable for consistent attachments, but exact canvases/pivots must be authored by the final contract. No nonuniform scaling, no repainting the map to hide overlaps, no duplicate roofs.
