# Automatic lower target and remaining indicators

Lower duplicate cards size themselves for ordinary and reflection views. There is no size slider or separate eye. In reflection, their visibility follows the existing easy-controls toggle; the original wheel information and exit remain available. Historical v1/v2 manual preferences are ignored and left intact for rollback. No new preference is written.

- `node tests/lower-stats/contract.cjs`: 13 current production/source checks, including focus, storage independence, teardown and unchanged complete wheel renderer hash.
- `node tests/seyir-controls/contract.cjs`: 8 layout/ownership, smart-step help and evidence-contract checks in Turkish and English for both modes.
- `node tests/r1227/direct-count.cjs`: unchanged native count-correction ownership.
- `CHROMIUM_PATH=/path/to/chromium node tests/seyir-controls/browser.cjs "$PWD" /tmp/sukun-seyir-controls/report.json`: 31 focused native cases covering both modes at 320, 393, 720 and 1280 CSS pixels, Turkish/English labels, all four actions’ native hover and Tab/Escape explanations, disclosure and whole-journey reset confirmation/cancel. Reports retain all served-source hashes, page/SRI errors and four test/fixture hashes. Missing or duplicate cases, changed sources/tests, unavailable browser evidence and runtime/SRI errors fail closed.

Focused checks do not replace full release, upgrade, offline, physical-device or audible-output acceptance.
