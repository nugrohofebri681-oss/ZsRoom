# ZsRoom — World 01 P4 browser preview (continuous floors + exploration camera)

An isolated **temporary** playable build of PR #29 (World 01 P4). It is **not** the public OG game and does not replace the P3 preview.

## Links
- **Static preview:** `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p4-static/index.html`
  - raw.githack is a third-party static proxy. On the first visit it shows a **"One more step" page: tap "Open the page"** once and the game starts.
  - **Verified on 2026-11-21** in headless Chromium (desktop 1280×720 and emulated Galaxy S9+ landscape) after that click:
    - the game boots with 20 approved assets;
    - bedroom → hall without a scene restart;
    - stairs down;
    - living room → kitchen without a scene restart.

    Not yet verified on a physical phone.
  - Add `?fresh` to start a new game in Zila's bedroom, e.g. `.../index.html?fresh`.
- **P3 preview** (unchanged, for comparison): `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p3-static/index.html`
- **Development preview** (runs from source in the browser): `https://stackblitz.com/github/nugrohofebri681-oss/ZsRoom/tree/preview-world01-p4-source?startScript=dev`
- **Device benchmark:** append `?fresh&bench` (see `docs/production/ANDROID_PERF_TEST.md`).

## Source and integrity
- **Source commit:** `2b81591` (PR #29, branch `claude/world01-p4`).
- **Bundle:** `preview-world01-p4-static` holds only the production `vite build` output, built from that commit. The workflow `.github/workflows/p4-static-preview.yml` can rebuild it from this branch.
- **Untouched:** `main`, the original GitHub Pages site, the P3 preview, approved assets and pending PRs.

## What to try
1. **Upstairs:** walk from the bedroom east through the doorway into the hall. There is no fade, and the HUD title changes. Then come back.
2. **Downstairs:** take the stairs down, then walk west from the living room into the kitchen (no fade). The front door, the street, Indomaret, Mixue, the city and Unimal all still work.
3. **Camera:** the wider camera follows Zila. Use the mouse wheel, pinch or the ± buttons to zoom.

## QA caveats
- Visuals are TEMP except the 20 approved bedroom assets. The layout is provisional.
- Performance on a physical Galaxy A05 has **not** been measured.
