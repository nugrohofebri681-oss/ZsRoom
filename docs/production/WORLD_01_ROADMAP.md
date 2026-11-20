# World 01 — Batuphat–Lhokseumawe roadmap

**Zila is the only playable character. Febri is always an NPC:** in long-distance chapters he appears through chat, voice or video calls; in later Travel maps, as a companion NPC.
**Every layout, route and location below is PROVISIONAL** until the Creative Director reviews the world map and story. Nothing here claims real-world geography.
The source of truth for the registry is [`src/data/world/world01.json`](../../src/data/world/world01.json); `tests/unit/world-graph.test.ts` keeps it consistent with the map data.

## Progress — P0 checkpoint 1 (branch `claude/world01-p0`)
| Measure | Now |
|---|---|
| Connected playable maps | **7**: bedroom, upstairs hall, living room, front yard, Batuphat street, minimarket, workplace |
| Enterable buildings / interiors | **3**: Zila's house (3 interior maps), minimarket, workplace |
| Complete traversable routes | **Bedroom → hall → stairs → living room → yard → street → minimarket / workplace → back home → bedroom**, walked through real doors in an e2e test (desktop + emulated Android) |
| Interactions (new) | 13: sofa and bench sit; dining table, calendar, shoe rack, motorbike, street sign; shelf browse; fridge pick-up → pay at counter; time clock in/out; 3 desk tasks; task board; neighbour / cashier / coworker NPCs; 2 locked road ends; locked kitchen |
| Story / event loops | Minimarket purchase (pick a drink → pay); workplace shift (clock in → 3 tasks → clock out); first street visit → placeholder chat from Febri (fires once per save) |
| Save / load across transitions | Save **v3** (visited maps; v2 → v3 migration tested). Resumes on the current map at the saved position; an invalid saved position falls back to the map's default spawn |
| NPCs | 3 TEMP NPCs (patrol, idle, wander), each with a time-of-day schedule |
| Tests | 105 unit tests (world graph, reachability, events, NPCs, save) + 57 e2e. The full `npm run qa` is green |

## Map registry
| Map | District | Kind | Status | Doors (→ destination) | Notes |
|---|---|---|---|---|---|
| `zila_bedroom` | Zila's home | interior | ✅ implemented | south → upper_hall | Approved HD art (10 assets), Batch C/D in review |
| `upper_hall` | Zila's home | interior | ✅ implemented | north → bedroom; **east stairs** → living_room | TEMP shell |
| `living_room` | Zila's home | interior | ✅ implemented (provisional) | north stairs → hall; south front door → yard; west kitchen 🔒 | TEMP furniture |
| `front_yard` | Zila's home | exterior | ✅ implemented (provisional) | north house door → living room; south gate → street | House front, motorbike, bench, tree |
| `batuphat_street` | Batuphat | exterior | ✅ implemented (provisional) | home gate, minimarket, workplace; east and west road ends 🔒 | 28 m street, road, street lights, neighbour NPC |
| `minimarket` | Batuphat | interior | ✅ implemented (provisional) | south → street (same door) | Generic minimarket: **no real brand name, logo or trade dress** |
| `workplace` | Batuphat | interior | ✅ implemented (**configurable placeholder**) | south → street (same door) | Name, type and task loop are pending the real story (`placeholders.workplace` in the registry) |
| `kitchen` | Zila's home | interior | ⬜ planned | — | Locked door in the living room |
| `batuphat_more_shops` | Batuphat | exterior | ⬜ planned | — | Behind the west road end |
| `lhokseumawe_centre` | Lhokseumawe city | exterior | ⏳ story-pending | — | Behind the east road end; needs the CD world map |
| `travel_maps` | — | exterior | ⏳ story-pending | — | Febri as a companion NPC; not in this sprint |

## Engine systems added (reusable, data-driven)
- **World graph:** world → district → building → map registry, with stable map ids.
- **Doors:**
  - Bidirectional and on any side (north, south, east, west), with explicit spawns and facings.
  - Styles: door, stairs, gate, or painted by the art.
  - **Locked or story-gated** doors (`locked.unlessFlag`).
  - Arrival never bounces you straight back through the door (doorways arm only after you step away).
- **Map kinds:** interior and **exterior**. Exteriors show the time-of-day sky above the building row. Per-map ambience: room, street (traffic, motorbikes, birds) or shop (fridge hum). All are original procedural audio.
- **Per-placement interactions:** generic world props, where one counter spec serves both the shop checkout and the office reception.
- **Story events** (`src/data/story/events.json`):
  - Conditions: flag, notFlag, varEq, varNe, varGte, varLt.
  - Effects: dialogue, say, toast, setFlag, setVar, incVar, comms.
  - `once` events. Map `onEnter` hooks.
  - **Dialogue is data**, never engine code.
- **NPCs** (`src/world/npc.ts`):
  - Deterministic idle, wander and patrol behaviours.
  - Stop and face Zila when she's near; block her movement.
  - Schedule by time of day; interact via dialogue or event.
  - No AI service.
- **Comms contract** (`src/story/comms.ts`): chat, voice and video thread data, plus a presenter interface. Today the dialogue panel shows "Febri · chat". Content is **fictional placeholder only** (unit-tested to be marked placeholder).
- **Memory:** only the active map's generated textures are kept; the previous map's TEMP art, glows, skies and lightmap are released on every map change (e2e-asserted).

## Temporary artwork (all clearly labelled TEMP in the HUD)
- **27 world placeholder props** in `specs/world/props`, each with a stable id, footprint, pivot and collision:
  - sofa, bench, tables, stools, cabinet, counter, plant, motorbike, tree, street light, sign
  - store shelf, fridge, office desk, chair, filing cabinet
  - window, calendar, whiteboard, time clock
  - storefront, workplace facade, house facade, gate
  - road, rug
- **10 placeholder tiles** in `specs/world/environments`.
- **3 TEMP NPC figures.** Zila is still the TEMP figure.
- These specs live **outside** the art pipeline: they are not art requests and are not in the manifest. To commission final art, move a spec to `specs/props` with full art fields, then raise an art request. The gameplay data does not change.

## Performance (headless software Chromium proxy — not a device measurement)
Measured at 1280×720 under identical conditions in one run (the machine was busy, so absolute numbers are low): bedroom 16.8 / 14.8 fps (afternoon/night), interiors 19.8–23.8 / 15.3–17.5, front yard 19.3 / 14.5, **street 13.0 / 12.0**.
- **Why the street is heaviest:** the proxy is fill-bound, and the street fills the whole screen where interiors leave dark margins. Each layer (ground tiles, lightmap, TEMP art) costs ≈ 4 fps; none dominates.
- **No leaks:** display objects and JS heap stay flat while walking the street.
- **Follow-ups:**
  1. A physical Galaxy A05-class test (still outstanding).
  2. If needed, a lower render resolution on exterior maps.
  3. Off-screen tile culling, or merging ground and road into one layer.

## Next work packages (Days 8–14 of the directive)
1. **Neighbourhood expansion:** further street blocks behind the west road end, side alleys, and more facades. Each is a new map plus registry entry, linked through the existing door system.
2. **Minimarket depth:** an item list in data (prices, a simple wallet var), a basket UI, and a cashier dialogue with choices.
3. **Workplace story config:** once the CD defines the real workplace, replace `placeholders.workplace` and its task loop data (no engine change).
4. **NPC schedules across maps:** an NPC present in different maps by time of day. Simple per-phase dialogue variants.
5. **Comms presenter:** a phone UI overlay (chat bubbles, incoming-call screen) behind the existing `CommsPresenter` contract.
6. **Codex art requests for World 01**, in priority order:
   1. living-room set (sofa, coffee table, dining set)
   2. house front plus yard
   3. street facades plus road
   4. minimarket interior
   5. workplace (after the story is defined)

## Creative Director decisions needed
- **Topology:** is the house layout right (bedroom upstairs, a downstairs living area, yard and gate onto one street)?
- **Street:** is the street order right (home → minimarket → workplace)?
- **Workplace:** its type, name and daily activity (currently a neutral office placeholder).
- **Kitchen and neighbourhood:** which further locations matter for the story, and which way the road leads to Lhokseumawe city.
