'use strict';
// Current production navigation, real locale switching, touch and keyboard.
// r1160 replaced the historical 3x2 rail with six buttons in one row and
// intentionally wrapping labels. r1204 uses square-cut gems on mobile.
// 125% enlarges labels only; it is not OS accessibility zoom.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {fixture, hash} = require('../r1064/browser-fixture.cjs');
const navSelector = '.wrap > nav.tabs';
const labels = {
  tr: ['Ambiyans', 'Frekanslar', 'Zikir', 'Düzen', 'Bildirimler', 'Tekke'],
  en: ['Ambience', 'Frequencies', 'Dhikr', 'Arrangement', 'Notifications', 'Lodge']
};

function navigationGeometry() {
  const nav = document.querySelector('.wrap > nav.tabs');
  const rows = [...nav.querySelectorAll(':scope > button')].map(n => {
    const r = n.getBoundingClientRect(), s = getComputedStyle(n);
    const label = n.querySelector('.tbL'), icon = n.querySelector('.tbIc,.tbRub');
    const range = document.createRange();
    range.selectNodeContents(label);
    const lines = [...range.getClientRects()].filter(x => x.width > .5 && x.height > .5).map(x => x.toJSON());
    const tokens = s.borderImageWidth.match(/(?:min|max|clamp)\([^)]*\)|[^\s]+/g) || [];
    function calc(value, side) {
      const basis = /^(top|bottom)$/.test(side) ? r.height : r.width;
      const border = parseFloat(s['border' + side[0].toUpperCase() + side.slice(1) + 'Width']) || 0;
      const number = x => {
        x = x.trim();
        if (x.endsWith('%')) return parseFloat(x) * basis / 100;
        if (x.endsWith('px')) return parseFloat(x);
        if (x === 'auto') return border;
        return (parseFloat(x) || 0) * border;
      };
      if (!value) return 0;
      const match = value.match(/^(min|max|clamp)\((.*)\)$/);
      if (!match) return number(value);
      const values = match[2].split(',').map(number);
      if (match[1] === 'clamp') return Math.max(values[0], Math.min(values[1], values[2]));
      return Math[match[1]](...values);
    }
    // Plain themes have a real CSS border, not a painted border-image inset.
    const inset = Object.fromEntries(['top', 'right', 'bottom', 'left'].map((side, i) => [side,
      s.borderImageSource === 'none' ? parseFloat(s['border' + side[0].toUpperCase() + side.slice(1) + 'Width']) || 0 :
        calc(tokens[i] || tokens[i % 2] || tokens[0], side)
    ]));
    const badge = n.querySelector('#r554NavCount');
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      key: n.dataset.t || n.id, rect: r.toJSON(), label: label.textContent.trim(),
      labelRect: label.getBoundingClientRect().toJSON(), icon: icon.getBoundingClientRect().toJSON(), lines,
      badge: badge && badge.getClientRects().length ? badge.getBoundingClientRect().toJSON() : null,
      inset, borderImageWidth: s.borderImageWidth, borderImageSource: s.borderImageSource,
      scrollWidth: n.scrollWidth, clientWidth: n.clientWidth, scrollHeight: n.scrollHeight, clientHeight: n.clientHeight,
      hit: !!hit && (hit === n || n.contains(hit)), disabled: n.disabled, fontSize: parseFloat(getComputedStyle(label).fontSize)
    };
  });
  return {
    viewport: {width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth},
    nav: nav.getBoundingClientRect().toJSON(), position: getComputedStyle(nav).position,
    theme: document.documentElement.dataset.r1074Theme || '', rows
  };
}

function validate(g, language, theme, scale = 1) {
  const rows = g.rows;
  assert.equal(rows.length, 6, 'Expected all six navigation actions');
  assert.deepEqual(rows.map(x => x.label), labels[language]);
  assert.equal(g.theme === 'berhet', theme === 'berhet', 'Unexpected navigation theme');
  assert(g.viewport.scrollWidth <= g.viewport.width + 1, 'Page horizontal overflow ' + JSON.stringify(g));
  assert(g.nav.left >= -1 && g.nav.right <= g.viewport.width + 1 && g.nav.top >= -1 && g.nav.bottom <= g.viewport.height + 1,
    'Navigation not fully visible ' + JSON.stringify(g));
  const spread = prop => Math.max(...rows.map(x => x.rect[prop])) - Math.min(...rows.map(x => x.rect[prop]));
  assert(spread('top') <= 1 && spread('height') <= 1 && spread('width') <= 1,
    'Expected one row of six equal controls ' + JSON.stringify(g));
  for (const row of rows) {
    const r = row.rect, i = row.inset;
    assert(!row.disabled && row.hit, 'Unreachable nav button ' + JSON.stringify(row));
    assert(r.width >= 44 && r.height >= 44, 'Touch target too small ' + JSON.stringify(row));
    assert(row.fontSize >= 9 * scale - .02, 'Navigation label was reduced below the current minimum ' + JSON.stringify(row));
    assert(r.left >= g.nav.left - 1 && r.right <= g.nav.right + 1 && r.top >= g.nav.top - 1 && r.bottom <= g.nav.bottom + 1,
      'Button outside navigation rail ' + JSON.stringify(row));
    if (theme === 'berhet') {
      assert.match(row.borderImageSource, /\/assets\/berhetiyye-premium\/gem-(?:sapphire-r933|emerald-r932|amethyst-r933)\.webp/,
        'Missing current square-cut jewel artwork ' + JSON.stringify(row));
    } else assert.equal(row.borderImageSource, 'none', 'Jewel artwork leaked into ordinary theme');
    assert(row.scrollWidth <= row.clientWidth + 1 && row.scrollHeight <= row.clientHeight + 1, 'Clipped content ' + JSON.stringify(row));
    assert(Math.abs((row.icon.left + row.icon.right - r.left - r.right) / 2) <= 3, 'Icon not centered ' + JSON.stringify(row));
    assert(row.icon.bottom <= row.labelRect.top + 1, 'Icon overlaps label ' + JSON.stringify(row));
    assert(row.lines.length, 'Missing label ' + JSON.stringify(row));
    // Wrapping is intentional. Every rendered line must still fit the label
    // and the painted jewel interior, including at the enlarged font size.
    for (const line of row.lines) assert(
      line.left >= r.left + i.left - 1 && line.right <= r.right - i.right + 1 &&
      line.top >= r.top + i.top - 1 && line.bottom <= r.bottom - i.bottom + 1 &&
      line.left >= row.labelRect.left - 1 && line.right <= row.labelRect.right + 1 &&
      line.top >= row.labelRect.top - 1 && line.bottom <= row.labelRect.bottom + 1,
      'Label enters bevel or is clipped ' + JSON.stringify(row));
    if (row.badge) {
      const b = row.badge;
      assert(b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom, 'Badge outside button ' + JSON.stringify(row));
      assert(b.bottom <= row.labelRect.top + 1, 'Badge overlaps label ' + JSON.stringify(row));
    }
  }
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const x = rows[a].rect, y = rows[b].rect;
    assert(!(x.left < y.right - 1 && x.right > y.left + 1 && x.top < y.bottom - 1 && x.bottom > y.top + 1),
      'Controls overlap ' + JSON.stringify([rows[a], rows[b]]));
  }
}

async function main() {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
  const output = path.resolve(process.argv[3] || '/tmp/navigation-visual/report.json');
  const shots = path.join(path.dirname(output), 'screenshots');
  fs.mkdirSync(shots, {recursive: true});
  process.env.CHROMIUM_PATH ||= chromium.executablePath();
  const checks = [], report = {
    suite: 'Current six-button mobile navigation', build: fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim(),
    sourceSha256: hash(fs.readFileSync(path.join(root, 'nero.html'))), expectedChecks: 24, checks,
    limitations: ['Headless Chromium with touch input at mobile CSS viewport widths; 125% enlarges labels and is not a physical phone or OS text scaling test.']
  };
  function save() {
    report.total = checks.length;
    report.passed = checks.filter(x => x.passed).length;
    report.allPassed = report.total === report.expectedChecks && report.passed === report.total && !report.fatal;
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  }
  async function tap(p, selector) {
    await p.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    if (await p.locator('#kandil.on').isVisible()) await p.locator('#kandil.on').tap({position: {x: 20, y: 20}});
    await p.locator(selector).filter({visible: true}).first().tap({timeout: 20000});
    await p.waitForTimeout(180);
  }
  async function keyboard(p, evidence) {
    const tabs = p.locator(navSelector + ' > button[role="tab"]');
    const keys = await tabs.evaluateAll(nodes => nodes.map(n => n.dataset.t));
    assert.deepEqual(keys, ['amb', 'frq', 'zkr', 'rx', 'ntf']);
    evidence.model = 'Five roving tabs plus the separate Tekke button';
    evidence.steps = [];
    async function snapshot(step) {
      const state = await p.locator(navSelector).evaluate(nav => ({
        focused: document.activeElement?.dataset.t || document.activeElement?.id || document.activeElement?.tagName,
        tabs: [...nav.querySelectorAll(':scope > button[role="tab"]')].map(n => ({
          key: n.dataset.t, selected: n.getAttribute('aria-selected'), tabIndex: n.tabIndex,
          active: n.classList.contains('act'), focused: document.activeElement === n,
          visibleFocus: n.matches(':focus-visible'), outlineWidth: parseFloat(getComputedStyle(n).outlineWidth),
          panelVisible: document.getElementById('tab-' + n.dataset.t)?.hidden === false
        }))
      }));
      evidence.steps.push({step, ...state});
      return state;
    }
    function roving(state, expected, checkFocus = true) {
      assert.deepEqual(state.tabs.filter(n => n.tabIndex === 0).map(n => n.key), [expected], 'Expected one selected tab stop ' + JSON.stringify(state));
      assert.deepEqual(state.tabs.filter(n => n.selected === 'true').map(n => n.key), [expected], 'ARIA selection mismatch ' + JSON.stringify(state));
      assert.deepEqual(state.tabs.filter(n => n.active).map(n => n.key), [expected], 'Active tab mismatch ' + JSON.stringify(state));
      for (const tab of state.tabs) assert.equal(tab.tabIndex, tab.key === expected ? 0 : -1, 'Unexpected roving tabindex');
      const selected = state.tabs.find(n => n.key === expected);
      assert(selected.panelVisible, 'Selected tab panel is hidden ' + JSON.stringify(state));
      if (checkFocus) assert(selected.focused && selected.visibleFocus && selected.outlineWidth >= 2,
        'Missing focused tab or visible keyboard outline ' + JSON.stringify(state));
    }
    const before = await snapshot('before-keyboard');
    const selected = before.tabs.find(n => n.selected === 'true')?.key;
    roving(before, selected, false);
    // A tablist has one Tab stop; Left/Right navigate the tabs. The sixth
    // visual control, Tekke, is a separate native button outside that model.
    await p.keyboard.press('Tab'); // establish keyboard modality after touch
    await p.locator(`${navSelector} > button[data-t="${selected}"]`).focus();
    let index = keys.indexOf(selected);
    roving(await snapshot('focused-selected-tab'), selected);
    for (const [key, direction] of [['ArrowRight', 1], ['ArrowLeft', -1]]) {
      for (let i = 0; i < keys.length; i++) {
        index = (index + direction + keys.length) % keys.length;
        const expected = keys[index];
        await p.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
        await p.keyboard.press(key);
        await p.waitForFunction(expected => {
          const n = document.querySelector(`.wrap > nav.tabs > button[data-t="${expected}"]`);
          return document.activeElement === n && n.getAttribute('aria-selected') === 'true';
        }, expected);
        roving(await snapshot(key + '-' + i), expected);
      }
    }
    await p.keyboard.press('Tab');
    const tekke = await p.locator('#tekkeTab').evaluate(n => ({focused: document.activeElement === n,
      visibleFocus: n.matches(':focus-visible'), outlineWidth: parseFloat(getComputedStyle(n).outlineWidth), tabIndex: n.tabIndex}));
    evidence.tekke = tekke;
    assert(tekke.focused && tekke.visibleFocus && tekke.outlineWidth >= 2 && tekke.tabIndex >= 0,
      'Tab did not reach the separate Tekke action ' + JSON.stringify(tekke));
    await p.keyboard.press('Shift+Tab');
    roving(await snapshot('returned-from-tekke'), keys[index]);
    evidence.activatedWith = [];
    for (const [key, target] of [['Enter', 'frq'], ['Space', 'zkr']]) {
      const selector = `${navSelector} > button[data-t="${target}"]`;
      await p.locator(selector).focus();
      await p.keyboard.press(key);
      await p.waitForFunction(sel => document.querySelector(sel)?.classList.contains('act'), selector);
      roving(await snapshot('activated-' + key), target);
      evidence.activatedWith.push(key);
    }
    evidence.passed = true;
  }
  async function sectionAnchor(p, evidence) {
    if (await p.locator('#r938Panel').getAttribute('data-open') !== 'true') await tap(p, '#r938PanelToggle');
    await tap(p, '#r986Sections button[aria-controls="zmgSeyirler"]');
    await p.waitForFunction(() => document.getElementById('zmgSeyirler')?.open);
    await p.waitForTimeout(700);
    const anchor = await p.evaluate(() => {
      const n = document.querySelector('#zmgSeyirler>summary'), nav = document.querySelector('.wrap > nav.tabs');
      const r = n.getBoundingClientRect(), nr = nav.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {rect: r.toJSON(), nav: nr.toJSON(), viewportHeight: innerHeight, hit: !!hit && (hit === n || n.contains(hit))};
    });
    Object.assign(evidence, anchor);
    assert(anchor.rect.top >= anchor.nav.bottom - 1 && anchor.rect.bottom <= anchor.viewportHeight + 1 && anchor.hit,
      'Section target obscured after real navigation ' + JSON.stringify(anchor));
    return anchor;
  }
  let f;
  try {
    for (const width of [320, 360, 393]) for (const language of ['tr', 'en']) {
      const seed = {'sukun.theme': '"feyz"', 'sukun.obDone': '1', 'sukun.onboardSeen': '1', 'sukun.r920.focus': '0', 'sukun.obSeenBuild': JSON.stringify(report.build)};
      f = await fixture(root, {width, height: 852, voices: 'tr', seed, hasTouch: true});
      const p = f.page;
      await p.waitForFunction(() => window.SukunSecretPolicy && window.SukunSessionState && window.I18N);
      if (await p.locator('#dailyCard').isVisible()) await tap(p, '#dcClose');
      await p.evaluate(lang => I18N.set(lang), language);
      await p.waitForTimeout(400);
      assert.equal(await p.evaluate(() => I18N.lang), language);
      for (const theme of ['ordinary', 'berhet']) {
        if (theme === 'berhet') {
          await tap(p, '.tab[data-t="zkr"]');
          assert.equal(await p.evaluate(() => KLT_AC('LABELLED-navigation-disposable-profile')), true);
          assert.equal((await p.evaluate(() => SukunSessionState.command('select', {mode: 'berhet', index: 15, journeyKind: 'single'}))).accepted, true);
          await p.waitForFunction(() => document.documentElement.dataset.r1074Theme === 'berhet');
        }
        for (const scale of [1, 1.25]) {
          const evidence = {stages: {}};
          try {
            const expectedFonts = await p.evaluate(scale => [...document.querySelectorAll('.wrap > nav.tabs > button > .tbL')].map(n => {
              n.style.removeProperty('font-size');
              const expected = parseFloat(getComputedStyle(n).fontSize) * scale;
              if (scale !== 1) n.style.setProperty('font-size', expected + 'px', 'important');
              return expected;
            }), scale);
            await p.evaluate(() => {
              window.scrollTo({top: 0, behavior: 'instant'});
              const b = document.querySelector('#r554NavCount');
              b.hidden = false; b.textContent = '99+';
            });
            await p.waitForTimeout(300);
            const stem = `${theme}-${width}-${language}-${Math.round(scale * 100)}`;
            await p.screenshot({path: path.join(shots, `nav-${stem}.png`)});
            evidence.initial = await p.evaluate(navigationGeometry);
            assert(evidence.initial.rows.find(r => r.key === 'ntf')?.badge, '99+ badge not visible');
            evidence.initial.rows.forEach((r, i) => assert(Math.abs(r.fontSize - expectedFonts[i]) < .02, 'Label enlargement was not applied'));
            validate(evidence.initial, language, theme, scale);
            evidence.stages.initialGeometry = true;
            evidence.touchNavigation = [];
            for (const selector of ['.tab[data-t="frq"]', '.tab[data-t="zkr"]']) {
              await tap(p, selector);
              assert(await p.locator(selector).evaluate(n => n.classList.contains('act')), 'Touch navigation failed ' + selector);
              evidence.touchNavigation.push(selector);
            }
            evidence.stages.touchNavigation = true;
            evidence.keyboard = {};
            await keyboard(p, evidence.keyboard);
            evidence.stages.keyboard = true;
            await p.evaluate(() => window.scrollTo({top: 800, behavior: 'instant'}));
            await p.waitForTimeout(400);
            await p.screenshot({path: path.join(shots, `nav-sticky-${stem}.png`)});
            evidence.sticky = await p.evaluate(navigationGeometry);
            validate(evidence.sticky, language, theme, scale);
            assert(['sticky', 'fixed'].includes(evidence.sticky.position), 'Navigation did not become sticky');
            evidence.stages.stickyGeometry = true;
            if (theme === 'berhet') {
              evidence.anchor = {};
              await sectionAnchor(p, evidence.anchor);
              evidence.stages.sectionAnchor = true;
              await p.screenshot({path: path.join(shots, `nav-anchor-${stem}.png`)});
            }
            checks.push({name: 'nav-geometry-and-interaction', width, language, theme, scale, passed: true, evidence});
          } catch (error) {
            checks.push({name: 'nav-geometry-and-interaction', width, language, theme, scale, passed: false, evidence, error: error.stack || String(error)});
            console.log(`[navigation] ${width}px ${language} ${theme} ${scale}: ${error.message}`);
          } finally {save();}
        }
      }
      await f.close(); f = null;
    }
  } catch (error) {report.fatal = error.stack || String(error);}
  finally {
    if (f) await f.close().catch(() => {});
    save();
    console.log(JSON.stringify({passed: report.passed, total: report.total, allPassed: report.allPassed, fatal: report.fatal, output, shots}));
    if (!report.allPassed) process.exitCode = 1;
  }
}
if (require.main === module) main();
module.exports = {navigationGeometry, validate};
