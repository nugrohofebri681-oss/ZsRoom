# Living Bedroom Polish Sprint — sound, highlight, audio controls

**Branch:** `claude/living-bedroom-polish` (from `reboot/foundation` `7e3706d`) · **Status:** engine/UI only. No artwork, `main` or GitHub Pages changes.

## What was added
| Feature | How | Cost |
|---|---|---|
| **Room ambience** | Two original 7.5 s loops synthesized in code (`src/audio/synth.ts`): soft room tone plus sparse bird chirps (morning/afternoon) or crickets (evening/night). Crossfaded seamlessly at the loop point; switches with the time of day. | One looping buffer source; ~0.66 MB |
| **Footsteps** | Fire on the walk cycle's **contact frames** (`crossedContacts`, from the rig spec: 112 cm stride, contacts at frames 0 and 4), so they are locked to the animation, never doubled, and frame-rate independent. **Wood:** brighter knock. **Rug:** muffled, quieter, shorter (the rug decal footprint is the soft-floor area). 4 variants plus slight pitch variation. | one-shot buffers |
| **Interaction sounds** | Lamp switch click (lower pitch when switching off), sit / stand rustle, cloth (outfit, curtains), two-note chime (messages), bell (sleep/rest fade), soft door whoosh, dialogue tick | one-shot buffers |
| **Interaction highlight** | One reused silhouette sprite of the usable prop, tinted soft pink-white, ~6 px larger, drawn **behind** the art with a slow breathing pulse. Doors get a soft floor ellipse. Hidden when nothing is in reach, during dialogue and during room transitions. Approved pixels are never modified. | 1 sprite, alpha update per frame |
| **Sound panel** | Speaker button: top-right under the clock on desktop, beside the zoom buttons on touch. Panel has Mute/Unmute plus Volume / Room / Effects sliders with ≥ 44 px rows; tap or drag. Saved per device (`localStorage` `zsroom.audio`, validated and clamped on load). **M** toggles mute. Taps on the panel never reach the world, and a tap outside closes it without walking. | — |
| **Audio unlock** | No `AudioContext` exists until the first user activation. It listens to `pointerup`/`touchend`/`click`/`keydown` in the capture phase, because a touch `pointerdown` is not a user activation on Android Chrome; it also plays a 1-sample silent buffer for WebKit. Re-unlocks if the OS interrupts the context. | — |
| **Power** | The context is **suspended** while the tab is hidden or the game is muted. No analysers, script processors or per-frame audio work. Phaser's own sound manager is disabled (`audio.noAudio`): previously it created an unused AudioContext at boot. | — |

All audio is **original procedural synthesis**: no samples, no third-party audio, no licensing questions.

## Evidence
- **Unit** (`tests/unit/audio.test.ts`, 9 tests):
  - Every sound renders, is audible, never clips and is under 1 s.
  - Rug steps are quieter and shorter than wood steps.
  - Rendering is deterministic per seed, and the variants differ.
  - Ambience is quiet (RMS < 0.05), seamless at the loop seam, and < 0.8 MB.
  - Two steps per stride, none when standing, and identical counts whether walked in small or large frame steps.
  - Prefs round-trip, and corrupt values are clamped or repaired.
- **E2E** (`tests/e2e/polish.spec.ts`, desktop and emulated Android, 10 tests):
  - Context `not-created` before a gesture, `running` after one.
  - Ambience switches night→day with the phase.
  - Hidden tab → `suspended` → `running`.
  - Footstep counts match 2 per 112 cm on wood and on the rug, with no wood steps while on the rug and none while standing.
  - The lamp click is counted, and sitting plays a sound.
  - Panel: volume set by tap, ambience to 0, mute; all persist across reload. While muted, a gesture leaves the context suspended and nothing plays. M unmutes.
  - Highlight: target, behind-art depth, follows focus, at most 1 extra display object, hidden in dialogue and when nothing is in reach.
- **Regression:** the full `npm run qa` is green: privacy, manifest, art, typecheck, 91 unit tests, build, 46 e2e (desktop and emulated Android) and gallery. Movement, collision, save/load, sitting, lighting, tap-to-move, zoom and the approved-asset checks are unchanged.
- **Screenshots** (`docs/reviews/foundation/`): `desktop-20-sound-panel.png`, `mobile-20-sound-panel.png`, `desktop-21-highlight-lamp.png`, `mobile-21-highlight-lamp.png`, `desktop-22-highlight-wardrobe.png`.

## Overhead (headless software-rendered Chromium, 1280×720, walking across wood and rug for 8 s; two runs each)
| | fps samples | JS heap | audio buffers |
|---|---|---|---|
| muted (context suspended) | 41, 29–32, 25–27, 23 | 20.8 MB | 0.66 MB |
| sound on | 41–42, 31–32, 27, 24 | 20.1–21.1 MB | 0.74 MB |

No measurable frame-time difference in this proxy (it is fill-bound, see the lighting review). **This is not a physical-device measurement.** The Galaxy A05-class Android test is still outstanding (BACKLOG Group G).

## Notes for the Creative Director
- The sound is deliberately quiet by default (master 80 %, room 60 %, effects 90 %). Every level can be tuned in the panel or in `DEFAULT_PREFS`.
- The highlight strength (pulse 0.34–0.54 alpha, ~6 px halo) is a single constant pair in `RoomScene.updateHighlight`/`setHighlight`, if you want it softer or stronger.
