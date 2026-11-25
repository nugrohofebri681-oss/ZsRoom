# G1.1 — Contract audit and correction handoff

2026-11-25. **AUDIT ONLY. Production corrections blocked pending contract alignment.** This documentation folder is a new handoff checkpoint, not revised artwork or an approvable concept board. No replacement master, fake production specification or validator bypass was created.

## Evidence and conclusion

- Foundation `7796f60d873c23c0102aec17441a796996f95aaf` unchanged.
- [PR41](https://github.com/nugrohofebri681-oss/ZsRoom/pull/41), `claude/world01-p6.1` at `fc8b954441aafd6feda4f995aab80ef67969d3eb`.
- [PR42](https://github.com/nugrohofebri681-oss/ZsRoom/pull/42), original G1 `12bf7108522ad11e50a5530c972e943d5b19bbd3`.
- Fetched current branch refs and public PR descriptions/comments, plus [Issue40](https://github.com/nugrohofebri681-oss/ZsRoom/issues/40). PR41 has the runtime contract and a handoff comment requesting alignment. PR42 explicitly says to freeze dimensions, roof split, entrance and pivot **before** corrections. No subsequent frozen G1.1 agreement was found in the fetched branch/review content.
- Read `AGENTS.md`, Art Bible and previous G1 records. User instruction explicitly says to finish audit/handoff first if final contract is absent. Therefore image generation is deliberately not invoked in this checkpoint, despite being available. No new A/B/C exploration.

## Runtime source of truth vs old artwork

These are **verified current runtime dimensions**, not a newly approved final art contract. Building depth comes from archetypes.json; the facade spec's4cm is only panel thickness.

|Selected artwork|G1 width/depth proposal cm|P6.1 facade width / building depth / facade top cm|TEMP canvas / pivot px @1px/cm|Roof|
|---|---|---|---|---|
|Small A|420/320|380/360/300|396×324;198,312|gable|
|Large B|600/400|620/460/470|636×494;318,482|hip; two-storey house +150cm yard,130cm gate|
|Ruko B|420/500|420/400/430|436×454;218,442|flat + procedural water tank|
|Warung C|500/320|600/420/320|616×344;308,332|zinc|

Sources: `src/data/archetypes.json`, `specs/world/props/world_house_small.json`, `world_house_large.json`, `world_ruko.json`, `world_warkop_open.json`. All four specs remain `world-temp`, version0.1.0, density1. No production render bounds/baseline/transparency constraints or registered illustrated roof assets are supplied there. `runtime-contract-audit.json` records hashes and every applicable building placement/anchor (9small,2large,4ruko,1warung).

## Newly identified design conflicts

1. Large B is **one storey**, but runtime `house_large` explicitly means **two storeys**,470cm facade top. Adding a floor changes the chosen design; stretching B is unacceptable. Claude/CD must resolve this explicitly.
2. Ruko B has a pitched tiled roof; runtime roof is flat with a tank. Keeping the commercial facade identity is feasible, but roof geometry must be settled before authoring/splitting.
3. Nominal210cm painted doors and240cm warung clearance appear in G1 review, but are not frozen per-archetype numeric fields in runtime specs. Entrance placement is per-instance, not the empty `interactionAnchors` in facade specs.
4. Current renderer knows a facade texture and procedural roof; arbitrary authored roof/porch/door layers have no production binding contract. A cut-up raster alone will not be integrated correctly.
5. Warkop exterior600×420cm transitions to a separate780×560cm interior map. This is a game-space abstraction, not a physically continuous open bay. Do not bake visible interactive seating into a solid exterior shell.

## Safe work completed

- Verified91 historical G1 file checksums, including all candidates and selected masters. See preservation.json. No G1 images regenerated or changed.
- Extracted runtime width/depth/height, panel thickness, pivots, roof bands, placements, solid rectangles and door anchors into runtime-contract-audit.json.
- Read Claude's research register: READ/SEARCH-ONLY/NOT READ classifications retained. No new claim of inspecting source photographs or authentic exact Batuphat architecture.
- Separate unchanged P6.1 audit checkout:143unit tests/21files passed; geometry audit passed (see retained report for warnings); TypeScript + Vite production build passed. Full E2E and physical A05 tests were **not rerun**. These baseline results do not validate corrected art.
- New-art validator, before/after galleries and integration captures are **not applicable yet**, since no revised assets exist. Previous G1's319/320 concept result remains historical; the missing-spec issue is not fixed by this audit. This documentation folder is not a production submission and carries no TECHNICAL PASS/VISUAL PASS/PRODUCTION READY label.

## Next action

Claude should publish a versioned final facade/roof/entrance contract addressing HANDOFF.md. Then Codex can make one targeted correction per selected master, retain raw outputs, prepare layers, and run the isolated P6.1 integration matrix in TEST_PLAN.md. No G2/G3, engine changes, map edits, approval or deployment in this checkpoint.
