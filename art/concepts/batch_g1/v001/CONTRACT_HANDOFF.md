# Proposed archetype contract for Claude review — not adopted

|Archetype|Width × depth cm|Eave/ridge target cm|Preview base pivot px at1px/cm|Entrance|
|---|---|---|---|---|
|Small|420×320|270/350|218,358|center; target90×210; painted height~176|
|Large|600×400|280/400|308,465|near center; target90–120×210; painted height~165|
|Ruko|420×500|560/620|218,831|center; target210high; painted~189|
|Warung|500×320|240/320|258,361|left bay; target240clear; painted~200|

Dimensions are design proposals, not surveyed real buildings and not approved map contracts. Pivot is whole-silhouette baseline approximation; it is not a validated wall-layer origin. Painted doors measured visually approximately ±5cm. Native master padding16px, SD8px. Full measurements and effective density in measurements.json.

P6 separates facade and procedural roof (RoomScene.drawBuildings). New whole-building sprites cannot replace facade while leaving old roof enabled. Preferred review proposal: separate front facade, roof/back silhouette, porch/awning, blank sign, removable counter/seating layers. One canonical front ground line must drive depth sorting; solid polygon remains physical footprint including roof overhang only where appropriate. Collision footprint should NOT equal projected alpha bbox. Porch accessible area needs explicit solid/standable separation. North-side facades and roof occlusion remain unproven.

No external coordination message was sent and no agreement from Claude is claimed. This PR/package is the reviewable coordination artifact. Ask Claude to resolve these contracts before production submission or changing map buildings. Existing scene was only used for temporary visual mock capture with original collision left in place.
