// Measure what the player actually sees: deploy, then sample the composited frame.
export default async function run(page, ui) {
  const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')));
  const snap = (n) => page.screenshot({ path: `./_qa_${n}.png` });

  const lum = async () => {
    const buf = await page.screenshot({ type: 'jpeg', quality: 50 });
    return page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = 96; c.height = 54;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 54);
      const d = x.getImageData(0, 0, 96, 54).data;
      let sum = 0, n = 0, blk = 0;
      for (let y = 10; y < 44; y++) for (let xx = 8; xx < 88; xx++) {
        const k = (y * 96 + xx) * 4, l = (d[k] + d[k + 1] + d[k + 2]) / 3;
        sum += l; n++; if (l < 6) blk++;
      }
      return { lum: Math.round(sum / n), blackPct: Math.round(100 * blk / n) };
    }, buf.toString('base64'));
  };

  await page.waitForSelector('#boot-enter.show', { timeout: 150000 });
  await page.click('#boot-enter');
  await page.waitForTimeout(1200);
  await page.click('[data-screen="play"]');
  await page.waitForSelector('#screen-play.active', { timeout: 30000 });
  await page.waitForTimeout(800);

  await page.click('#btn-launch');
  const frames = [];
  for (let i = 0; i < 14; i++) { await page.waitForTimeout(500); frames.push(await lum()); }
  await snap('live');
  await page.mouse.move(640, 400);
  await page.mouse.down();
  const fire = [];
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(250); fire.push(await lum()); }
  await page.mouse.up();
  await snap('live_fire');
  return { frames, fire, logs };
}
