# large G1 v001

B: strongest porch and hip-roof silhouette. A has undersized door and squat wall; C reads like a heritage cottage rather than a neutral contemporary home.

Known defects: Door about165cm vs210cm target at600cm width. Facade needs proportion correction. Porch/tree overlap visible in P6 preview; footprint would change480→600cm and must be explicitly reviewed, not silently applied.

Native source preserved; preview export only snaps alpha<=8 to0 and>=250 to255, trims transparent border, adds16px native/8px SD padding, uniformly downsamples to proposed width. No nonuniform stretch, invented geometry, paid API, or upscaling. Potential residual semi-transparent fringes need runtime review. Colored external fringe in original previews is near-transparent RGB; inspect normalized exports on light/dark backgrounds.

Master is native-density, not a contract-compliant final runtime master. Pivot is geometric base-center of preview, NOT an approved door/footprint anchor. P6 captures are browser-only visual substitutions: no change to collision, map or saves. Original generated roof hidden only in browser to avoid double roofs. Gameplay labels remain TEMP intentionally.
