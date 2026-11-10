# Reflection help and layer control

The current local candidate is based on r1245 main `65f2144261e7a149dd2cc321ccd29f730369212d`. It is not evidence of publication.

The existing two light-glass help labels retain their opacity-only 14-second cycle, reduced-motion behavior, keyboard visibility and forced-color fallback. The original easy-controls button now uses a 24px layered mark, a short translated label and a frameless target at least 44px wide and 56px high. In reflection it follows the original exit in DOM and visual order. The exit's help keeps its reserved gap. Outside reflection the same button returns immediately before settings.

The same click handler, visibility preference, auto-hide timer and session owners remain. The slash indicates the hide action; hidden controls show an unslashed mark with the show label. Visible labels begin the accessible names, including the auto-hidden settings state.

## Checks

- `node tests/tefekkur-help/contract.cjs`: 13 current source, accessibility and SRI contracts.
- `node tests/r1242/settings-auto-hide.cjs`: original timer, manual reveal, pause, focus fallback and teardown contracts, plus layer action/name checks.
- `managed-preview.html?mode=berhet` and `?mode=esma`: 68 checks per theme. The matrix covers 320/393/720/1280px, Turkish/English and controls shown/hidden; target size, text separation, label-in-name, 24px mark, centered placement, unchanged geometry during fading, three show/hide and exit/reentry cycles, and unchanged selection/count/transport.
- `CHROMIUM_PATH=<supported Chromium> node tests/tefekkur-glass/browser.cjs "$PWD" /tmp/sukun-glass-help`: source-bound native matrix with reduced motion, forced colors and keyboard focus. It remains registered in the full release runner.
- `tests/r1242/easy-controls-browser.cjs`: existing ordinary/reflection, theme-switch, reload, native audio and automatic-settings-hide suite, updated for the layer presentation.

Managed browser results do not replace the required exact-commit native CI gate, physical devices, audible playback, screen-reader or offline-upgrade acceptance. Publication requires explicit approval and fresh full CI before merge/deployment.
