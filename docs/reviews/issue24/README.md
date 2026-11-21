# Issue 24 — selective art audit and handoff

2026-11-21. Foundation `7796f60d873c23c0102aec17441a796996f95aaf`; isolated tooling `b8d6b66` (PR21). Existing Batch E `57c0e1` (PR19), concepts `2f141f8` (PR20). No artwork generated or approved. No engine/spec/manifest/approved-asset changes. PR21 is a dependency, not merged by this work.

## Actual results

- Official art checks: floor **24/24**, wall **23/23**; exact256×126 and120×540, RGBA fully opaque, relevant edge mean delta0.0. Environment tiles have no furniture-style pivot; repeat axes/physical dimensions define placement. No fit-to-spec, regeneration or new version.
- Concept-only checks **35/35**. Four PNG hashes match original PR20 bytes. Board and sources moved into the concept-only layout on `codex/art/char-zila-concept-r2` (v001 unchanged). This routing revision replaces PR20's misplaced production folder for integration; do not merge both. Branch r2 is NOT generated concept round2.
- **113 tests across17 files passed** on isolated PR21. Official gallery builds22 submissions +1 concept. Manifest check:24 entries,20 approved assets,40 runtime-file checksums verified. Privacy scan616files passed in validation workspace.
- Nine new browser screenshots, zero pageerrors: desktop1440×1000 DPR1; emulated Android360×800/800×360 DPR2 touch. Zoom.75 afternoon,1 night,1.6 morning. Tiles injected into browser TEMP textures only; manifest and source untouched. This is visual context evidence, NOT integration or a physical SamsungA05 performance result.
- `validation-art.json`, test logs, `browser-evidence.json`, capture script and PNGs accompany this review. Capture script contains environment-local paths; adjust root/import/port when reproducing. Gallery artifacts are generated locally, screenshots preserve the review. `checksums.json` hashes accompanying evidence files (excluding itself and this README).

## Visual findings

Floor: honey value separates walnut furniture clearly. No visible boundary seam in inspected repeats/game screenshots. Diagonal grain motifs recur faintly across open floor; this remains a limitation, not a reason to regenerate unprompted.

Wall: panel/rail rhythm coherent at game scale. Pink wallpaper plus pink curtains and unlit neon reduces daytime contrast, especially wide view. Night appearance tested with engine phase adjustment; no baked glow was added. Retainv001 for CD review. Optional narrow desaturation only if CD requests it, not automaticv002.

Portrait at high zoom intentionally crops peripheral room furniture; this demonstrates local readability, not full-room visibility. Do not use screenshot FPS to claim A05 performance. Current screenshots retain TEMPstatus labels because neither tile is approved. Older PR21 scratch screenshots show “22approved”; that scratch label does not grant approval.

The gallery's shared checklist still says Zila158cm and references bed-specific identity for tiles. Actual spec is165cm. Reported for Claude; no tooling edits here. PR21 also tracks generated dist-qa output; Claude should review whether those build artifacts belong in that tooling PR before merge.

## Zila refinement readiness

Request008 is prepared, not issued. B is a candidate, not approved final design. Current crown-to-chin ratio≈5.83 versus4.6target: at165cm, current head≈56.6pxHD/28.3pxSD, target≈71.7/35.9. Face features currently become too small at SD. Preserve soft finish, long layered brown hair, two symmetric pink bows and pink/cream outfit; refine silhouettes across front/¾/side/back with aligned soles and game elevation. Next artwork must have no baked floor shadow and support later layer separation. No image generation in this task.

CD must review B-based identity and one defining trait before issuance. Proposed discussion point only: fixed temple-height paired bows with a distinctive softly parted fringe. Keep target4.6 for next proof; do not imply the current B already achieves it. Febri remains NPC; no full movement production.

## Inventory and next small batch proposal

20 approved: bed, nightstand, lamp; desk, wardrobe, vanity, desk chair, vanity stool, laptop, mug; window, rug, bookshelf, photo string, fairy lights, neon; tall plant, sleeping cat/bed, pouf, small plant. All unchanged. Two environment tiles pending; two character entries TEMP/draft. World01 placeholders are separately specified under specs/world, not commissioned production artwork.

| Priority / existing ID | Existing geometry | Actual current use | Reuse case and gate |
|---|---|---|---|
|1 `world_plant_floor`|45×45cm base,120cm tall;154×327px,pivot77,315|yard,street,living room,minimarket,workplace|Highest existing reuse. First assess whether approved tall-plant art can serve without distortion; its geometry must not be silently substituted. If a distinct terracotta120cm plant is needed, commission it. Clean occlusion silhouette.|
|2 `world_bench`|150×50cm,seat45/top85;316×264px,pivot158,252|front yard|Potential later park/campus seating (not current placements). Walnut/neutral wood, no baked cushions/decor, validate seat anchor and top-plane depth.|
|3 `world_cabinet_low`|100×40cm,top50;216×180px,pivot108,168|living room|Potential office/shop storage (not current placements). Empty top, modular storage identity, measured attachment surface if props are hosted.|

Avoid another stool: approved vanity stool already covers much of the role. Avoid building facades/whole maps. Current dimensions are observed TEMP baselines, not newly approved production specifications. Claude must promote selected specs into the official prop/request/manifest route with bounds, transparency, export constraints, measured surface requirements and perspective templates. Then three conditioned candidates per commissioned asset, independent sources/checksums and HD/SDcontext review. No new game logic required by the proposal.

## Handoff order / approvals

1. Claude reviews/merges PR21 through normal authority; Codex has not merged it.
2. Review routed v001 concepts instead of PR20's production-routed board. Keep all original PR20 history.
3. CD reviews BatchEv001 floor and pink-wall contrast; only then integration via official approval tools.
4. CD resolves Zila identity trait, then issue008 refinement. No production animation yet.
5. Confirm small reusable batch IDs and complete art specs before generation.

This review makes no VISUALPASS or PRODUCTIONREADY claim. All20previous approvals preserved. No main/Pages/deployment changes.
