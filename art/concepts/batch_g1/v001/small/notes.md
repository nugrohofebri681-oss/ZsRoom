# small G1 v001

A: simplest narrow roof and least ornate silhouette. B adds asymmetry but smaller-looking doorway; C is too close to the larger gabled home.

Known defects: Door about176cm vs210cm target at proposed420cm width. Enlarge doorway rather than stretch the whole sprite. Roof lacks full-depth representation of proposed320cm footprint.

Native source preserved; preview export only snaps alpha<=8 to0 and>=250 to255, trims transparent border, adds16px native/8px SD padding, uniformly downsamples to proposed width. No nonuniform stretch, invented geometry, paid API, or upscaling. Potential residual semi-transparent fringes need runtime review. Colored external fringe in original previews is near-transparent RGB; inspect normalized exports on light/dark backgrounds.

Master is native-density, not a contract-compliant final runtime master. Pivot is geometric base-center of preview, NOT an approved door/footprint anchor. P6 captures are browser-only visual substitutions: no change to collision, map or saves. Original generated roof hidden only in browser to avoid double roofs. Gameplay labels remain TEMP intentionally.
