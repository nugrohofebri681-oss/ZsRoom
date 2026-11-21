// P4 vs P5 at identical character positions (same viewport, default wide zoom, afternoon), desktop + emulated Android.
// Needs the P4 QA build on :4176 and the P5 QA build on :4173. Usage: node scripts/compare-p4-p5.cjs docs/reviews/world01-p5
const { chromium, devices } = require('playwright');
const OUT = process.argv[2] ?? 'docs/reviews/world01-p5';
const spots = [ // [tag, P4 room, P4 x, y, P5 x, y] — P5 = P4 local + zone origin (+ documented frontage moves)
  ['yard-doorstep', 'front_yard', 500, 120, 2900, 120],
  ['street-at-gate', 'batuphat_street', 450, 200, 2850, 900],
  ['indomaret-front', 'batuphat_street', 1420, 120, 4220, 820],
  ['park-becak', 'batuphat_west', 1250, 400, 1250, 1100],
  ['mixue-front', 'batuphat_west', 2160, 120, 2160, 820],
];
(async () => {
  const b = await chromium.launch();
  for (const [dev, opts] of [['desktop', { viewport: { width: 1280, height: 720 } }], ['android', { ...devices['Galaxy S9+'], viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    for (const [i, [tag, room, x4, y4, x5, y5]] of spots.entries()) {
      for (const [ver, port, x, y] of [['p4', 4176, x4, y4], ['p5', 4173, x5, y5]]) {
        await p.goto(`http://localhost:${port}/?fresh&room=${room}`); await p.waitForFunction(() => window.__ZS?.state?.());
        await p.evaluate(([x, y]) => { window.__ZS.setVars({ phase: 'afternoon' }); window.__ZS.teleport(x, y); }, [x, y]);
        for (let k = 0; k < 8 && (await p.evaluate(() => window.__ZS.state().modal)); k++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
        await p.waitForTimeout(1500);
        const s = await p.evaluate(() => window.__ZS.state());
        console.log(dev, tag, ver, s.roomId, s.zone ?? '', `player ${Math.round(s.player.x)},${Math.round(s.player.y)}`, `view ${s.camera.viewW}×${s.camera.viewH}`, `scroll ${s.camera.scrollX},${s.camera.scrollY}`);
        await p.screenshot({ path: `${OUT}/${dev}-1${i}-${tag}-${ver}.png` });
      }
    }
    await ctx.close();
  }
  await b.close();
})();
