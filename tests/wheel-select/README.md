# Wheel gallery heading centering

This narrow presentation fix keeps “Çarkları görerek seç” / “Choose a wheel visually” centered horizontally and vertically inside its existing gemstone frame at all widths. Previously the centering rule applied only at 480px and below; the wider flex layout had no horizontal centering or safe carved-end insets. Mobile left/right padding was also unequal.

Native details/summary, gallery choices, artwork, application JavaScript, audio, counts and personal data are unchanged. The disclosure arrow inherits the label color, and equal 44px side insets reserve room for its original carved ends.

## Checks

- `node tests/wheel-select/contract.cjs`: current source contract and CSS SRI.
- `tests/wheel-select/managed-preview.html?mode=berhet` (and `mode=esma`): full local app, 320/393/480/481/720/1024/1280px in Turkish and English, open/closed. 720/1024/1280px additionally use CSS zoom 125/150/200%. Each theme has 64 geometry checks, six repeated programmatic disclosure click toggles, and one unchanged session-state check. CSS zoom is not browser zoom.
- `CHROMIUM_PATH=<supported Chromium> node tests/wheel-select/browser.cjs "$PWD" /tmp/sukun-wheel-heading.json`: same matrix plus repeated Enter/Space and forced-color checks, with a disposable profile. Registered in the mandatory current-release runner.

The full native release gate, physical-device acceptance and actual browser zoom are not replaced by managed local results. A separate stress probe combining 320px with 150–200% whole-document CSS zoom leaves the existing application with less than 320 CSS pixels of layout width and fails centering/reflow; this patch does not claim that out-of-range combination fixed.
