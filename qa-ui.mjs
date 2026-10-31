export default async function run(page, ui) {
  await page.waitForSelector('#boot-enter.show', { timeout: 90000 });
  await page.click('#boot-enter');
  await page.waitForSelector('#screen-menu.active');
  await page.screenshot({ path: 'improved-menu.png' });
  await page.click('#menu-nav [data-screen="play"]');
  await page.waitForSelector('#screen-play.active');
  await page.screenshot({ path: 'improved-deploy.png' });
  const cards = await page.locator('#map-grid .map-card').count();
  await page.click('#btn-launch');
  await page.waitForFunction(() => document.querySelector('#loading').classList.contains('hidden') && !document.querySelector('#hud').classList.contains('hidden'), { timeout: 90000 });
  await page.screenshot({ path: 'improved-game.png' });
  const hud = await page.locator('#hud').innerText();
  await page.keyboard.press('Escape');
  await page.waitForSelector('#screen-pause.active');
  await page.click('#btn-pause-settings');
  await page.waitForSelector('#screen-settings.active');
  await page.click('#screen-settings .back-btn');
  await page.waitForSelector('#screen-pause.active');
  return { cards, deployed: true, pauseSettingsReturn: true, hud: hud.slice(0, 700) };
}
