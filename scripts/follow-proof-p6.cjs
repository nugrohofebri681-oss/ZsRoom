// P6 proof that the camera FOLLOWS Zila over the town in X and Y (not a static framing): one continuous walk of the
// loop home → gang W1 → park → south lane → alley → Indomaret (no scene restart), frames + log of position/scroll.
// Needs the P6 QA build on :4173. Usage: node scripts/follow-proof-p6.cjs docs/reviews/world01-p6
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const OUT = process.argv[2] ?? 'docs/reviews/world01-p6';
const legs = [[2550, 1540], [1535, 1540], [1535, 3100], [1675, 3100], [1675, 4425], [3300, 4425], [5830, 4430], [5830, 3700], [5300, 2640]];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await p.goto('http://localhost:4173/?fresh&fast&room=front_yard'); await p.waitForFunction(() => window.__ZS?.state?.());
  await p.evaluate(() => { window.__ZS.setVars({ phase: 'afternoon' }); window.__ZS.teleport(2550, 1380); });
  await p.waitForTimeout(600);
  const frames = [], log = [];
  const grab = async () => { const s = await p.evaluate(() => window.__ZS.state()); frames.push({ img: (await p.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'), s }); };
  await grab();
  for (const [x, y] of legs) {
    await p.evaluate(([x, y]) => window.__ZS.tapWorld(x, y), [x, y]);
    for (let t = 0; t < 600; t++) {
      const s = await p.evaluate(() => window.__ZS.state());
      if (s.modal) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); if (!(await p.evaluate(() => window.__ZS.state().modal))) await p.evaluate(([x, y]) => window.__ZS.tapWorld(x, y), [x, y]); continue; }
      log.push({ x: Math.round(s.player.x), y: Math.round(s.player.y), zone: s.zone, scrollX: s.camera.scrollX, scrollY: s.camera.scrollY, sceneStarts: s.sceneStarts });
      if (s.path === 0 && t > 2) break;
      await p.waitForTimeout(100);
    }
    await grab();
  }
  writeFileSync(`${OUT}/follow-walk-log.json`, JSON.stringify(log).replace(/\},\{/g, '},\n{'));
  const html = `<body style="margin:0;background:#1d1418;font:13px sans-serif;color:#fff">${frames.map((f, i) => `<div style="display:inline-block;position:relative;margin:3px"><img src="data:image/jpeg;base64,${f.img}" width=520><div style="position:absolute;left:5px;bottom:5px;background:#000b;padding:3px 6px">#${i + 1} ${f.s.zone} · Zila ${Math.round(f.s.player.x)}, ${Math.round(f.s.player.y)} · camera ${f.s.camera.scrollX}, ${f.s.camera.scrollY} · sceneStarts ${f.s.sceneStarts}</div></div>`).join('')}</body>`;
  const q = await b.newPage({ viewport: { width: 1600, height: 900 } }); await q.setContent(html); await q.waitForTimeout(400);
  await q.screenshot({ path: `${OUT}/desktop-20-camera-follow-filmstrip.png`, fullPage: true });
  const xs = log.map((l) => l.scrollX), ys = log.map((l) => l.scrollY);
  console.log('frames', frames.length, 'samples', log.length, 'sceneStarts', [...new Set(log.map((l) => l.sceneStarts))], 'scrollX', Math.min(...xs), '→', Math.max(...xs), 'scrollY', Math.min(...ys), '→', Math.max(...ys), 'zones', [...new Set(log.map((l) => l.zone))].join(','));
  await b.close();
})();
