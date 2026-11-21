# ZsRoom — World 01 P3 browser preview

This is an isolated **temporary** playable build of PR #25 (World 01 P3), not the public OG game.

## Source and integrity
- Source commit: `1b6a2f8d45f8c835f0d85facc0baec0f4b33a599` (PR #25)
- This branch is a deployment-only copy of that commit.
- The workflow `.github/workflows/p3-static-preview.yml` builds Vite and publishes only the static output to `preview-world01-p3-static`.
- `main`, the original GitHub Pages site, approved assets and pending PRs are not changed by this preview process.
- Static preview candidate: `https://raw.githack.com/nugrohofebri681-oss/ZsRoom/preview-world01-p3-static/index.html` (third-party static proxy; verify before sharing)
- Browser development preview: `https://stackblitz.com/github/nugrohofebri681-oss/ZsRoom/tree/preview-world01-p3-source?startScript=dev`

## QA caveats
- All worlds beyond World 01 are future work; current World 01 uses TEMP visuals.
- Performance on a physical Galaxy A05 has **not** been measured.
- Preview is intended for testing; real names, locations and story events are provisional.
- Never publish private WhatsApp chats, personal photos or unreviewed brand logos.
