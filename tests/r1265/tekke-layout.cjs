'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture} = require('../r1064/browser-fixture.cjs');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = process.argv[3];
const baseline = process.argv.includes('--baseline');

async function check(width, height) {
  const app = await fixture(root, {width, height, hasTouch: width < 600});
  const {page} = app;
  const inside = selector => page.locator('#tk ' + selector);
  try {
    await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await page.locator('#tekkeTab').click();
    await inside('#gBtn').waitFor({state: 'visible'});
    const header = await inside('#top').boundingBox();
    const gate = await inside('#gate').boundingBox();
    const headerGap = gate.y - (header.y + header.height);
    const stageAtEntrance = await inside('#stage').isVisible();
    await inside('[data-tk-action="purpose-dhikr"]').click();
    await inside('#gBtn').click();
    await inside('#r992Transport').waitFor({state: 'visible'});
    const closedGateHidden = !await inside('#gate').isVisible();
    await page.waitForFunction(() => !!document.querySelector('#phN')?.textContent.trim().match(/AL|VER|TUT|BEKLE|BAS/i));
    const ring = await inside('#bArcSvg').boundingBox();
    const caption = await inside('#phase').boundingBox();
    const phaseGap = caption.y - (ring.y + ring.height);
    if (output) {
      await page.screenshot({path: path.join(output, width + '-seans.png')});
    }
    await inside('#panelBtn').click();
    await inside('#panel.open').waitFor({state:'visible'});
    await inside('#r992PanelHeader [data-tk-action="close-settings"]').click();
    await page.waitForFunction(() => !document.querySelector('#tk #panel').classList.contains('open'));
    assert(await inside('#r992Pause').isVisible(), 'Session controls are reachable again after closing Mihrap');
    const result = {width, height, headerGap, phaseGap, stageAtEntrance, closedGateHidden};
    console.log(JSON.stringify(result));
    if (baseline) {
      assert(headerGap < 0 && phaseGap < 0 && !closedGateHidden, 'Original overlap should reproduce');
    } else {
      assert(headerGap >= -1, 'Gate scrolls below the toolbar');
      assert(!stageAtEntrance && closedGateHidden, 'Only the selected scene is visible');
      assert(phaseGap >= 0, 'The breathing caption has its own row below the ring');
    }
    return result;
  } finally {
    await app.close();
  }
}

(async () => {
  if (output) fs.mkdirSync(output, {recursive:true});
  const results = [];
  for (const [width, height] of [[360,780],[412,915],[844,390],[1366,768]]) {
    results.push(await check(width,height));
  }
  if (output) fs.writeFileSync(path.join(output, 'layout.json'), JSON.stringify(results,null,2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
