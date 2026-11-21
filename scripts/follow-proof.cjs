// Proof that the camera FOLLOWS Zila across the district (not a static full-district framing): one continuous walk
// (no scene restart), frames captured along the way, stitched into a filmstrip with world position + camera scroll.
// Needs the P5 QA build on :4173. Usage: node scripts/follow-proof.cjs docs/reviews/world01-p5
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const OUT = process.argv[2] ?? 'docs/reviews/world01-p5';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await p.goto('http://localhost:4173/?fresh&room=front_yard'); await p.waitForFunction(() => window.__ZS?.state?.());
  await p.evaluate(() => { window.__ZS.setVars({ phase: 'afternoon' }); window.__ZS.teleport(2850, 650); });
  await p.waitForTimeout(800);
  const frames = [], log = [];
  const grab = async () => { const s = await p.evaluate(() => window.__ZS.state()); frames.push({ img: (await p.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'), s }); };
  const go = async (x, y, shots) => {
    await p.evaluate(([x, y]) => window.__ZS.tapWorld(x, y), [x, y]);
    for (let t = 0; t < 400; t++) {
      const s = await p.evaluate(() => window.__ZS.state());
      if (s.modal) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); if (!(await p.evaluate(() => window.__ZS.state().modal))) await p.evaluate(([x, y]) => window.__ZS.tapWorld(x, y), [x, y]); continue; }
      log.push({ t: Date.now(), x: Math.round(s.player.x), y: Math.round(s.player.y), zone: s.zone, scrollX: s.camera.scrollX, scrollY: s.camera.scrollY, sceneStarts: s.sceneStarts });
      if (shots && t % shots === 0) await grab();
      if (s.path === 0 && t > 2) break;
      await p.waitForTimeout(100);
    }
  };
  await grab();
  await go(2850, 900, 0); await grab();                 // through the gate onto the street
  await go(4900, 900, 14);                             // east along the street (normal walking speed)
  await grab();
  writeFileSync(`${OUT}/follow-walk-log.json`, JSON.stringify(log, null, 0).replace(/\},\{/g, '},\n{'));
  const pick = frames.length <= 6 ? frames : [0, 1, 2, Math.floor(frames.length / 2), frames.length - 2, frames.length - 1].map((i) => frames[i]);
  const html = `<body style="margin:0;background:#1d1418;font:14px sans-serif;color:#fff">${pick.map((f, i) => `<div style="display:inline-block;position:relative;margin:4px"><img src="data:image/jpeg;base64,${f.img}" width=520><div style="position:absolute;left:6px;bottom:6px;background:#000a;padding:3px 6px">#${i + 1} ${f.s.zone} · Zila x ${Math.round(f.s.player.x)} y ${Math.round(f.s.player.y)} · camera scroll ${f.s.camera.scrollX}, ${f.s.camera.scrollY} · sceneStarts ${f.s.sceneStarts}</div></div>`).join('')}</body>`;
  const q = await b.newPage({ viewport: { width: 1600, height: 900 } }); await q.setContent(html); await q.waitForTimeout(300);
  await q.screenshot({ path: `${OUT}/desktop-20-camera-follow-filmstrip.png`, fullPage: true });
  console.log('frames', frames.length, 'samples', log.length, 'sceneStarts', [...new Set(log.map((l) => l.sceneStarts))], 'scrollX', log[0].scrollX, '→', log.at(-1).scrollX);
  await b.close();
})();
