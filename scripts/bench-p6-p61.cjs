// P6 vs P6.1 interleaved headless-proxy frame rate at the same spots and time of day (NOT device FPS).
// Needs the P6 QA build on :4176 and the P6.1 QA build on :4173. Usage: node scripts/bench-p6-p61.cjs
const { chromium, devices } = require('playwright');
const spots = [['garden', 2550, 1150, 'afternoon'], ['crossroads', 4730, 3100, 'afternoon'], ['market (morning)', 5500, 3950, 'morning'], ['warkop (evening)', 1110, 2860, 'evening'], ['park', 1675, 4300, 'afternoon']];
(async () => {
  const b = await chromium.launch();
  for (const [dev, opts] of [['desktop', { viewport: { width: 1280, height: 720 } }], ['android', { ...devices['Galaxy S9+'], viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const p = await (await b.newContext(opts)).newPage();
    for (const [tag, x, y, phase] of spots) {
      const fps = { p6: [], p61: [] }; let npc = {};
      for (let rep = 0; rep < 3; rep++) for (const [ver, port] of [['p6', 4176], ['p61', 4173]]) {
        await p.goto(`http://localhost:${port}/?fresh&room=front_yard`); await p.waitForFunction(() => window.__ZS?.state?.());
        await p.evaluate(([x, y, ph]) => { window.__ZS.setVars({ phase: ph }); window.__ZS.teleport(x, y); }, [x, y, phase]);
        await p.waitForTimeout(500);
        for (let k = 0; k < 8 && (await p.evaluate(() => window.__ZS.state().modal)); k++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
        await p.waitForTimeout(1200);
        const f0 = await p.evaluate(() => window.__ZS_GAME.loop.frame); await p.waitForTimeout(3000);
        fps[ver].push(((await p.evaluate(() => window.__ZS_GAME.loop.frame)) - f0) / 3);
        npc[ver] = await p.evaluate(() => { const s = window.__ZS.state(); return `${s.npcs.filter((n) => n.visible).length} present / ${s.npcActive ?? 'n/a'} simulated`; });
      }
      const med = (a) => [...a].sort((x, y) => x - y)[1].toFixed(1);
      console.log(`${dev} ${tag.padEnd(18)} P6 ${med(fps.p6)} (${fps.p6.map((v) => v.toFixed(1)).join('/')}) | P6.1 ${med(fps.p61)} (${fps.p61.map((v) => v.toFixed(1)).join('/')}) | NPCs P6 ${npc.p6} · P6.1 ${npc.p61}`);
    }
  }
  await b.close();
})();
