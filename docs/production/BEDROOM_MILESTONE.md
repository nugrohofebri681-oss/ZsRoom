# Milestone M2 — Zila's Bedroom (premium HD, playable)

Goal: one complete, cohesive bedroom that preserves the original room's warmth, built asset by asset with the approved pipeline. Each asset is one request → Codex draft PR → Claude in-game review → Creative Director VISUAL PASS → integration.

## Status
| # | Asset | Category / engine need | Status |
|---|---|---|---|
| 001 | `prop_bed_zila` | floor furniture | ✅ approved v001 |
| 002 | `prop_nightstand_zila` | floor furniture + measured surface | ✅ approved v001 (geometry exception) |
| 003 | `prop_lamp_zila` | **surface prop + engine light** | 📝 requested |
| 004 | `prop_desk_zila` + `prop_chair_desk` | furniture pair; sit interaction; desk surface (laptop, books later) | planned |
| 005 | `prop_wardrobe_zila` | tall occluder against the wall (fade rule) | planned |
| 006 | `prop_vanity_zila` + stool | furniture pair, mirror (no live reflection) | planned |
| 007 | `decal_rug_zila` | **new: floor decal layer** (always below actors, no collision) | needs engine + spec type |
| 008 | `wall_window_city` + curtains | **new: wall-mounted layer** (back wall, night city) | needs engine + spec type |
| 009 | room shell: floor planks, walls, skirting | **new: environment tiles** (replaces the grey-box shell) | needs environment spec |
| 010 | small set dressing: teddy, plants, books, fairy lights | surface props / wall props | after 004–009 |

Engine work alongside: night/time-of-day lighting overlay (the lamp pool is tuned against it), floor-decal and wall-mounted layers, sit interaction, texture atlas packing once there are more than ~8 props in the room (Android memory), and a physical-device performance check.

## Order rationale
003 proves surface props and engine light. 004/005 add the remaining large silhouettes and test sitting and tall-object occlusion. 007–009 introduce the three new categories that the room shell needs. Small dressing comes last, so it's placed on final surfaces.

## Budget guardrails (Galaxy A05 class)
- Room texture budget ≤ 16 MB GPU at SD, ≤ 48 MB at HD. Today: bed + nightstand ≈ 0.6 MB GPU at HD.
- ≤ 2 additive light sprites per light; ≤ 6 lights per room.
- Approved masters stay at 2 px/cm; runtime SD 1 px/cm.
