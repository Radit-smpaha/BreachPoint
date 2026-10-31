// Deploy into a mission, sample what renders, then fire the weapon (the moment
// the screen used to go fully black) and sample again.
export default async function run(page, ui) {
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));

  await page.waitForFunction(() => !!window.__DBG_GAME, null, { timeout: 60000 });
  await page.waitForTimeout(9000); // menu backdrop + orbit settle

  await page.evaluate(() => { window.__DBG_GAME.startGame('factory', 'breach', 'operator'); });

  const sample = () => page.evaluate(() => {
    const g = window.__DBG_GAME;
    const canvas = document.getElementById('game');
    const img = document.createElement('canvas');
    img.width = 48; img.height = 27;
    let lum = -1;
    try {
      img.getContext('2d').drawImage(canvas, 0, 0, 48, 27);
      const px = img.getContext('2d').getImageData(0, 0, 48, 27).data;
      let sum = 0, n = 0;
      for (let k = 0; k < px.length; k += 4) { sum += (px[k] + px[k + 1] + px[k + 2]) / 3; n++; }
      lum = Math.round(sum / n);
    } catch (e) { lum = 'ERR'; }
    return {
      mode: g.mode,
      exposure: +g.renderer.toneMappingExposure.toFixed(2),
      camY: g.activeCamera ? +g.activeCamera.position.y.toFixed(2) : null,
      rootInScene: !!g.level?.map?.root?.parent,
      fps: g.fps,
      avgLum: lum,                       // 0..255 brightness of the rendered frame
      worldTris: g.renderer.info.render.triangles,   // last world pass
      vmTris: g._vmDepth,                // last viewmodel pass
      vmCalls: g._vmCalls,
      enemies: g.enemies?.length,
    };
  });

  const deploy = [];
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(300); deploy.push(await sample()); }

  // fire a burst: mouse.down is read by GunSystem each physics step
  await page.evaluate(() => { window.__DBG_GAME.mouse.down = true; });
  const firing = [];
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(200); firing.push(await sample()); }
  await page.evaluate(() => { window.__DBG_GAME.mouse.down = false; });

  return { deploy, firing, logs: logs.filter(l => !/\[bp\] (load|deploy)/.test(l)).slice(-40) };
}
