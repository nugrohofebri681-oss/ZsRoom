// Screenshot the town at fixed spots (default wide camera, afternoon), desktop + emulated Android.
// Usage: node scripts/town-shots.cjs <outDir> <prefix> [port=4173] [phase=afternoon]
const { chromium, devices } = require('playwright');
const [OUT = 'docs/reviews/world01-p6.1', PREFIX = 'shot', PORT = '4173', PHASE = 'afternoon'] = process.argv.slice(2);
const spots = [
  ['crossroads', 4730, 3100], ['avenue-x-north-lane', 4730, 1540], ['back-path', 5300, 5620], ['avenue-x-south-lane', 4730, 4430],
  ['market', 5500, 3900], ['warkop', 1100, 2700], ['garden', 2550, 1150], ['gang-w2', 3635, 2100],
];
(async () => {
  const b = await chromium.launch();
  for (const [dev, opts] of [['desktop', { viewport: { width: 1280, height: 720 } }], ['android', { ...devices['Galaxy S9+'], viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/?fresh&room=front_yard`); await p.waitForFunction(() => window.__ZS?.state?.());
    for (const [tag, x, y] of spots) {
      await p.evaluate(([x, y, ph]) => { window.__ZS.setVars({ phase: ph }); window.__ZS.teleport(x, y); }, [x, y, PHASE]);
      await p.waitForTimeout(500);
      for (let k = 0; k < 8 && (await p.evaluate(() => window.__ZS.state().modal)); k++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${OUT}/${dev}-${PREFIX}-${tag}.png` });
    }
    await ctx.close();
  }
  await b.close();
  console.log('done', PREFIX);
})();
