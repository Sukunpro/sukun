# Shared dashboard appearance regression

The r1237 personal-centre paint and no-blur selectors depended on the Ambiyans tab's visibility. Moving to Frekanslar exposed the older blurred dashboard and theme-colored text. The fix removes that tab dependency for the shared dashboard only. Existing theme, accessibility, layout, visibility and audio owners are unchanged.

## Checks

- `node tests/dashboard-style/contract.cjs`: focused source contract.
- `python3 tests/r1213/run-current-checks.py --scope node --output /absolute/new/output`: mandatory source/integrity gate. This is not full native acceptance.
- `node tests/dashboard-style/browser.cjs "$PWD" /tmp/dashboard-style.json`: integrated into the full release gate, runs the managed harness in native Chromium with normal, forced-color, and reduced-transparency settings.
- `managed-preview.html`: disposable same-origin browser harness. It seeds a synthetic classic-shell profile, selects Esmâ/Berhetiyye, and compares dashboard paint/typography over repeated Ambiyans/Frekanslar transitions at 320, 393, 720 and 1280 px in all three performance modes. It must be served on a dedicated test origin, never a user's existing app origin. The Before link expects a test server to serve exact predecessor files under `/before/`; it is not a production route.

The local r1238 candidate passed the focused source contract and 68/68 current node/source/integrity suites (including the new dashboard contract). No complete browser acceptance is claimed: native Chromium could not start because the executor denied its Unix socket, and the managed browser could not reach the local test server. The browser harness has only a syntax check, not an executed pass. Before publication, run repeated-transition visual checks, forced colors/reduced transparency checks, the full current release gate, and immediate r1237-to-candidate upgrade/offline/rollback checks in a usable browser environment. Physical Android, screen-reader, enlarged-text and acoustic acceptance are separate.

Base: `c825233b45b955dc259e53755df84d879469a106` (r1237). Draft PR #85 holds the candidate for CI review. It is not merged or deployed. The initial CI attempt passed 74/75 suites; its new dashboard harness incorrectly required a WebKit-only property even when the browser did not support that spelling. The follow-up checks the standard property unconditionally, the prefixed property only when CSS.supports confirms it, and records both computed values and support in its evidence. The failed run is retained; no result is waived.
