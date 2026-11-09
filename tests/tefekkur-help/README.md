# Reflection exit help and Berhet audio-source label

The original exit button owns a small, passive hint below its icon. Only the hint fades on a 14-second cycle; the button never disappears. Hover and keyboard focus use the existing help owner. A short mobile tap retains the original exit action; the shared stationary-hold help path consumes only its own release click. Exit closes any open explanation. Reduced motion keeps the hint static and visible. Its text is decorative to assistive technology because the original button retains its meaningful accessible name.

The Berhet audio-source button keeps its sapphire asset, original label updater, disclosure and data owner. Text wraps and is centered with space for all four carved frame edges. Its chevron gets a separate centered row. No count, selection, recording, playback, wheel, or storage owner changed.

## Run

- `node tests/tefekkur-help/contract.cjs`: 9 source/SRI/accessibility contracts.
- `node tests/lower-stats/contract.cjs`: 28 existing contracts.
- `node tests/r1227/direct-count.cjs`: 62 existing native count/ownership assertions.
- `CHROMIUM_PATH=<supported-browser> node tests/tefekkur-help/browser.cjs "$PWD" /tmp/sukun-tefekkur-help`: rendered checks in two themes plus native hover, focus/Escape/Enter, reduced-motion emulation, short touch and stationary touch hold. Requires Playwright and a permitted Chromium process environment.
- `tests/tefekkur-help/managed-preview.html`: supported local-preview equivalent for rendered checks. The **Run help checks** button drives the real production controls with labelled synthetic local state. `?mode=esma` selects the second theme. It is for a disposable local origin only, never a user's production profile.

## Verified in this patch

Managed Chromium local preview used byte-identical application HTML/runtime/CSS from this worktree. Berhet passed 43/43, Esma passed 23/23. Evidence is in `evidence/*-managed.json`. The checks cover 320/393/500/720/1280px, cards shown/hidden with easy controls hidden, centered hint placement, a complete opacity cycle, text inside the source's four frame edges, source disclosure, repeated exits/reentries, and unchanged selection/count/transport state. Source-label probes use explicit sample text, not actual personal audio.

Additional managed native-input observations: keyboard focus opens help in both themes; Escape closes help without leaving reflection; Enter exits. Native pointer hover opens the explanation and pointer departure closes it. The final rendered hint and source layout were visually inspected.

Source contracts 9/9, lower-stat contracts 28/28, and direct-count contracts 62/62 passed. JavaScript parsing passed for the changed runtime and new harness.

Standalone Playwright Chromium launch was blocked by the environment's process socket restriction, including the permitted elevated attempt. Therefore the new standalone harness's native touch and reduced-motion emulation were prepared but **not run** here. Reduced motion was source-checked only. Physical mobile/screen-reader/audio and offline/upgrade acceptance remain separate. Release finalization must regenerate inventories/hashes and run aggregate CI after integration; this patch deliberately does not advance a release or publish.
