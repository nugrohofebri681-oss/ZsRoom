# ZsRoom — World 01 P5 browser preview (one walkable Batuphat outdoor district)

An isolated **temporary** playable build of the P5 Draft PR (Issue #32). It is **not** the public OG game and does not replace the P3 or P4 previews.

## Links
- **Static preview:** `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p5-static/index.html`
  - raw.githack is a third-party static proxy. On the first visit it shows a **"One more step" page: tap "Open the page"** once and the game starts.
  - Add `?fresh` to start a new game in Zila's bedroom; `?fresh&room=front_yard` starts right outside the house.
- **P4 preview** (unchanged, for comparison): `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p4-static/index.html`
- **Device benchmark:** append `?fresh&bench` (see `docs/production/ANDROID_PERF_TEST.md`).

## Source and integrity
- **Source:** branch `claude/world01-p5` (P5 Draft PR, stacked on PR #29).
- **Bundle:** `preview-world01-p5-static` holds only the production `vite build` output, built by `.github/workflows/p5-static-preview.yml` from this branch.
- **Untouched:** `main`, the original GitHub Pages site, the P3/P4 previews, approved assets and pending PRs.

## What to try
1. Leave the house through the front door: you appear right outside the facade.
2. Walk through the yard, out of the gate, east along the street to Indomaret and the workplace — **no fade, no loading**; the camera follows.
3. Walk west to the park (becak, warung kopi) and Mixue. The west road end is a locked planned border.
4. Enter Indomaret / Mixue / the workplace and come back out at the same door. The east road still leads to Lhokseumawe and Unimal.
5. Zoom with the mouse wheel, pinch or ±.

## QA caveats
- Visuals are TEMP except the 20 approved bedroom assets. The layout is provisional, not real geography.
- Performance on a physical Galaxy A05 has **not** been measured.
