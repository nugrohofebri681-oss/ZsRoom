# ZsRoom — A Living World of Memories (clean rebuild)

> Branch `reboot/foundation` — the isolated foundation of the ZsRoom rebuild.
> The original game lives on `main` and is untouched.

A premium HD illustrated 2D exploration and life-simulation game about Zila and Febri: a Dream Home, a Living City, and travel destinations — built with Phaser 4, TypeScript and Vite.

**Current milestone: M1 Foundation Proof** — Art Bible v1, specs, a data-driven Phaser test room with collision, depth sorting and occlusion, an automated art-validation pipeline, and the first art request (`prop_bed_zila` v001).

- Art Bible: [`art-bible/ART_BIBLE.md`](art-bible/ART_BIBLE.md)
- First art request: [`docs/art-requests/001-prop_bed_zila.md`](docs/art-requests/001-prop_bed_zila.md)
- Architecture: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- Dual-agent workflow: [`docs/architecture/WORKFLOW.md`](docs/architecture/WORKFLOW.md)
- Agent rules: [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md)

```bash
npm ci
npm run dev        # http://localhost:5173  (WASD/arrows, Shift run, E interact; touch joystick on phones)
npm run qa         # full quality pipeline
```

Everything visible in the test room is **grey-box** (labelled engineering stand-ins) until approved artwork arrives.
