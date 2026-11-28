# Actual test output

## Pipeline + contract unit tests

```text

 RUN  v5.1.0 /workspace/ZsRoom-g12-validation


 Test Files  2 passed (2)
      Tests  44 passed (44)
   Start at  05:03:47
   Duration  2.89s (tests 75%, transform 15%, import 10%)


```

## Official P6.1 regression on unmodified43926cf QA baseline

No G1.2 candidate registered during this suite.4 passed,4 failed at final no-console-error assertions because of2 resource404s. Do not label suite PASS. Separate candidate fixture uses actual v002 art.

```text
[WebServer] (node:3244) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:3282) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 8 tests using 2 workers

(node:3305) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:3306) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✘  1 [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty (28.9s)
(node:3680) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✘  2 [mobile-android] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty (46.2s)
(node:3847) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✘  3 [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door (27.3s)
(node:3998) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  5 [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:82:3 › P6.1 Batuphat life › quiet places stay quiet: residential lanes never crowded; LOD keeps far-away people idle (6.2s)
  ✓  6 [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:95:3 › P6.1 Batuphat life › G1 architecture contract in game: one roof per building, contract sizes, fade behind a two-storey ruko, none in front (9.5s)
  ✘  4 [mobile-android] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door (40.8s)
(node:4454) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  7 [mobile-android] › tests/e2e/world01-p6.1.spec.ts:82:3 › P6.1 Batuphat life › quiet places stay quiet: residential lanes never crowded; LOD keeps far-away people idle (6.6s)
  ✓  8 [mobile-android] › tests/e2e/world01-p6.1.spec.ts:95:3 › P6.1 Batuphat life › G1 architecture contract in game: one roof per building, contract sizes, fade behind a two-storey ruko, none in front (7.5s)


  1) [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 4

    - Array []
    + Array [
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    + ]

      50 |     expect((await S(page)).vars.market_veg).toBe(1);
      51 |     expect(s.npcs.some((n: any) => n.id.startsWith('night_food_') && n.visible)).toBe(true);
    > 52 |     expect(errors).toEqual([]);
         |                    ^
      53 |   });
      54 |
      55 |   test('warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door', async ({ page, isMobile }) => {
        at /workspace/ZsRoom-g12-validation/tests/e2e/world01-p6.1.spec.ts:52:20

    Error Context: ../../tmp/g12-e2e-results/world01-p6.1-P6-1-Batuphat-0505c-closed-and-the-market-empty-desktop-chromium/error-context.md

  2) [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 4

    - Array []
    + Array [
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    + ]

      77 |     await useDoor(page, isMobile, 'exit', TOWN);
      78 |     expect((await S(page)).player).toMatchObject(spawnPos('batuphat_west', 'from_warkop'));
    > 79 |     expect(errors).toEqual([]);
         |                    ^
      80 |   });
      81 |
      82 |   test('quiet places stay quiet: residential lanes never crowded; LOD keeps far-away people idle', async ({ page }) => {
        at /workspace/ZsRoom-g12-validation/tests/e2e/world01-p6.1.spec.ts:79:20

    Error Context: ../../tmp/g12-e2e-results/world01-p6.1-P6-1-Batuphat-49425-lars-leave-by-the-same-door-desktop-chromium/error-context.md

  3) [mobile-android] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 4

    - Array []
    + Array [
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    + ]

      50 |     expect((await S(page)).vars.market_veg).toBe(1);
      51 |     expect(s.npcs.some((n: any) => n.id.startsWith('night_food_') && n.visible)).toBe(true);
    > 52 |     expect(errors).toEqual([]);
         |                    ^
      53 |   });
      54 |
      55 |   test('warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door', async ({ page, isMobile }) => {
        at /workspace/ZsRoom-g12-validation/tests/e2e/world01-p6.1.spec.ts:52:20

    Error Context: ../../tmp/g12-e2e-results/world01-p6.1-P6-1-Batuphat-0505c-closed-and-the-market-empty-mobile-android/error-context.md

  4) [mobile-android] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 4

    - Array []
    + Array [
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    +   "Failed to load resource: the server responded with a status of 404 (Not Found)",
    + ]

      77 |     await useDoor(page, isMobile, 'exit', TOWN);
      78 |     expect((await S(page)).player).toMatchObject(spawnPos('batuphat_west', 'from_warkop'));
    > 79 |     expect(errors).toEqual([]);
         |                    ^
      80 |   });
      81 |
      82 |   test('quiet places stay quiet: residential lanes never crowded; LOD keeps far-away people idle', async ({ page }) => {
        at /workspace/ZsRoom-g12-validation/tests/e2e/world01-p6.1.spec.ts:79:20

    Error Context: ../../tmp/g12-e2e-results/world01-p6.1-P6-1-Batuphat-49425-lars-leave-by-the-same-door-mobile-android/error-context.md

  4 failed
    [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty
    [desktop-chromium] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door
    [mobile-android] › tests/e2e/world01-p6.1.spec.ts:18:3 › P6.1 Batuphat life › morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty
    [mobile-android] › tests/e2e/world01-p6.1.spec.ts:55:3 › P6.1 Batuphat life › warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door
  4 passed (1.9m)

```
