export default async function run(page, ui) {
  await page.waitForFunction(() => !!window.__DBG_GAME, null, { timeout: 120000 });
  return await page.evaluate(() => {
    const g = window.__DBG_GAME;
    return { keys: Object.keys(g).slice(0, 20), hasScene: 'scene' in g, scene: typeof g.scene, mode: g.mode };
  });
}
