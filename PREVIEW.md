# ZsRoom — World 01 P6 browser preview (Batuphat as an explorable 2D town)

An isolated **temporary** playable build of the P6 Draft PR (Issue #34). It is **not** the public OG game and does not replace the P3, P4 or P5 previews.

## Links
- **Static preview:** `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p6-static/index.html?fresh`
  - raw.githack is a third-party static proxy. On the first visit it shows a **"One more step" page: tap "Open the page"** once and the game starts.
  - `?fresh` starts a new game in Zila's bedroom; `?fresh&room=front_yard` starts in Zila's garden.
- **P5 preview** (unchanged, for comparison): `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p5-static/index.html?fresh`
- **Device benchmark:** append `?fresh&bench` (see `docs/production/ANDROID_PERF_TEST.md`).

## Source and integrity
- **Source:** branch `claude/world01-p6` (P6 Draft PR, stacked on the P5 PR #33).
- **Bundle:** `preview-world01-p6-static` holds only the production `vite build` output, built by `.github/workflows/p6-static-preview.yml` from this branch.
- **Untouched:** `main`, the original GitHub Pages site, the P3/P4/P5 previews, approved assets and pending PRs.

## What to try (as a player)
1. Leave the house: you stand in Zila's fenced garden. Walk out of the gate onto the residential lane.
2. **Route A:** go east along the lane, down **gang W2** to the main street, and on to **Indomaret**.
3. **Route B:** go further east to the **avenue**, south to the **crossroads**, then west to Indomaret.
4. **Loop:** go west, down **gang W1**, cross the road into the **park** (hedges, fountain, benches), leave by its east gate onto the **south lane**, up the **alley** to Indomaret, then back home through a gang.
5. Mixue and the warung are on the main street (west); the dimsum workplace is east. Every shop has an interior. The east road leads to Lhokseumawe and Unimal; the west road end is a locked border.
6. Zoom with the mouse wheel, pinch or ±. Walking behind a building fades it.

## QA caveats
- Visuals are TEMP, except the 20 approved bedroom assets. The layout is provisional, not real geography.
- Performance on a physical Galaxy A05 has **not** been measured.
