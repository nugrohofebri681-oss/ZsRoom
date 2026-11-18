# ZsRoom Architecture (M1)

## Principles
- **Data-driven.** Rooms (`src/data/rooms/*.json`) and assets (`specs/**.json`) are data; scenes contain no per-room logic.
- **World ≠ pixels.** World unit = 1 cm on the ground plane; `render = (x, y·0.7 − z)`. Sprites scale by `1/density` (HD 2 px/cm, SD 1 px/cm), so art resolution never affects gameplay.
- **Pure core, thin Phaser shell.** Projection, collision, depth/occlusion, direction, anchors, save and manifest logic are framework-free and unit-tested; Phaser scenes wire them up.
- **Budget-Android first.** Target 30 FPS on Galaxy A05-class devices (60 where feasible). Render resolution capped at 2× DPR; SD textures on low-res screens; one texture per prop now, atlases from M2.

## Runtime flow
`BootScene` loads `assets/manifest.json` → loads textures only for **approved** assets (density variant per device) → reads the versioned save → starts `RoomScene` + `UIScene`.

`RoomScene` compiles room data → solids (walls, door stoppers, prop collision), prop instances (sortables), interaction anchors. Each frame: input → `moveWithCollision` (circle vs AABB, axis-separated, sub-stepped) → facing → `actorSortDepth` (pivot y, with the *beside-a-deep-prop* rule) → `occludingProps` fade → nearest anchor prompt → door triggers. Props without approved art render as labelled grey-boxes built from their spec.

`UIScene` is screen-space (CSS px, zoom = DPR): HUD, prompts, toasts, touch joystick (left 55 % of the screen) and interact button.

## Implemented in M1
| Requirement | Status |
|---|---|
| 8-direction free movement, walk/run | ✅ `src/actors/direction.ts`, RoomScene |
| Camera follow, readable zoom, centred small rooms | ✅ |
| Keyboard + touch controls | ✅ `src/systems/input.ts`, UIScene |
| Collision | ✅ `src/world/collision.ts` |
| Dynamic depth sorting + occlusion fade | ✅ `src/world/depth.ts` |
| Modular data-driven rooms + door transitions | ✅ two rooms, south/north doors |
| Interaction anchors | ✅ prompt + event (actions are placeholders) |
| Versioned save/load with migrations | ✅ `src/systems/save.ts` |
| Asset manifest with checksum-verified approved assets | ✅ |

## Planned (not built yet — do not assume they exist)
Multi-floor interiors & stairs (M2) · NPCs & schedules · dialogue · inventory · outfits (layered character rig) · time of day & weather (lighting overlays, engine-rendered cast shadows) · memory/photo features · Tiled map import (room JSON stays the runtime format; Tiled becomes an authoring source) · texture atlases · physical-device performance validation.

## Performance notes
No physical Android device has been tested. Emulated mobile tests verify touch input and layout only. Before claiming 30 FPS on Galaxy A05-class hardware, run the build on a real device (Chrome remote debugging → Performance panel) and record results in `docs/reviews/`.
