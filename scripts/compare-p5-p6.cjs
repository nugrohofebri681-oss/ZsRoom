// P5 vs P6 at the SAME story places (same viewport, default wide zoom, afternoon), desktop + emulated Android, plus a
// headless-proxy frame-rate measurement at each spot (interleaved, median of 3 — NOT device FPS).
// Needs the P5 QA build on :4176 and the P6 QA build on :4173. Usage: node scripts/compare-p5-p6.cjs docs/reviews/world01-p6 [--bench]
const { chromium, devices } = require('playwright');
const OUT = process.argv[2] ?? 'docs/reviews/world01-p6', BENCH = process.argv.includes('--bench');
const spots = [ // [tag, P5 x, y, P6 x, y] — the same place in each build
  ['doorstep', 2900, 120, 2550, 1000], ['indomaret-front', 4220, 820, 5300, 2700], ['mixue-front', 2160, 820, 2700, 2700], ['park', 1250, 1100, 1675, 4300], ['street-middle', 3700, 1100, 4730, 3100],
];
(async () => {
  const b = await chromium.launch();
  for (const [dev, opts] of [['desktop', { viewport: { width: 1280, height: 720 } }], ['android', { ...devices['Galaxy S9+'], viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    for (const [i, [tag, x5, y5, x6, y6]] of spots.entries()) {
      const fps = { p5: [], p6: [] };
      for (let rep = 0; rep < (BENCH ? 3 : 1); rep++) for (const [ver, port, x, y] of [['p5', 4176, x5, y5], ['p6', 4173, x6, y6]]) {
        await p.goto(`http://localhost:${port}/?fresh&room=front_yard`); await p.waitForFunction(() => window.__ZS?.state?.());
        await p.evaluate(([x, y]) => { window.__ZS.setVars({ phase: 'afternoon' }); window.__ZS.teleport(x, y); }, [x, y]);
        await p.waitForTimeout(500);
        for (let k = 0; k < 8 && (await p.evaluate(() => window.__ZS.state().modal)); k++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
        await p.waitForTimeout(1200);
        if (rep === 0) { await p.screenshot({ path: `${OUT}/${dev}-1${i}-${tag}-${ver}.png` }); const s = await p.evaluate(() => window.__ZS.state()); console.log(dev, tag, ver, s.roomId, s.zone, `view ${s.camera.viewW}×${s.camera.viewH}`); }
        if (BENCH) { const f0 = await p.evaluate(() => window.__ZS_GAME.loop.frame); await p.waitForTimeout(3000); fps[ver].push(((await p.evaluate(() => window.__ZS_GAME.loop.frame)) - f0) / 3); }
      }
      if (BENCH) { const med = (a) => [...a].sort((x, y) => x - y)[1].toFixed(1); console.log('FPS', dev, tag.padEnd(16), 'P5', fps.p5.map((v) => v.toFixed(1)).join('/'), 'med', med(fps.p5), '| P6', fps.p6.map((v) => v.toFixed(1)).join('/'), 'med', med(fps.p6)); }
    }
    await ctx.close();
  }
  await b.close();
})();
