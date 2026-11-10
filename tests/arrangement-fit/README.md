# Arrangement frame containment

Screenshot-driven, presentation-only r1245 change based on published r1244 commit 81b0298. The four supplied screenshots show recommendation labels crossing carved edges, action labels extending beyond their frames, and uneven input/quick-choice rows.

- Recommendation cards reserve fixed 14px/22px frame edges with larger text insets. Narrow screens use one column; wider screens retain two.
- AI plan/session and Global Flow actions use content-sized heights, wrapping text, centered labels and a full-width hit area. No ellipsis or clipping.
- Quick choices use equal grid cells. The text field and Build Arrangement action stack at 480px or below.
- Original gemstone assets, glass surfaces, theme owners, AI consent/provider behavior, counters, audio and storage are unchanged. The only runtime JavaScript adjustment admits the new exact stylesheet path to the existing health-integrity allowlist.

## Validation

- `node tests/arrangement-fit/contract.cjs`
- `tests/arrangement-fit/managed-preview.html?mode=berhet` and `?mode=esma`: production HTML and CSS, canonical mode selection, synthetic provider response through actual renderers, long catalog zikir, 320/360/393/430/480/481/720/1024/1280px in Turkish and English. 720/1024/1280 additionally use CSS zoom 125/150/200%. 36 layout cases per theme; each requires all AI outputs, checks text insets, long explanation/plan/timeline containment, hit sizes and page width. Three tab-return cycles and unchanged counter/play state are also checked after returning.
- `CHROMIUM_PATH=<supported Chromium> node tests/arrangement-fit/browser.cjs "$PWD" /tmp/arrangement.json`: native wrapper adds Enter/Space activation and forced colors, checks exact served source hashes, and is registered in mandatory current-release checks. Native execution is required in GitHub CI; a local system Chromium launch was blocked by its socket sandbox.
- `NODE_PATH=<test dependencies> python3 tests/r1213/run-current-checks.py --scope source --output <new external folder>` is a source regression suite, not full release acceptance.

No real AI calls, personal keys, microphone input or physical-device tests are used. CSS zoom is not native browser zoom. The r1245 finalizer includes `css/arrangement-fit.css` in the mandatory runtime and offline graph and regenerates SRI and deployment hashes. Publication requires the complete current-release native and upgrade suite on the exact PR head, not only the managed preview checks.
