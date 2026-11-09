# Screensaver mouse-idle regression

The existing mouse listener only revealed controls while Kandil was already open.
It never refreshed the idle timer during desktop use. The fix routes trusted,
changed mouse coordinates through the existing single cancellable deadline.
Scripted, stationary and touch-compatibility mouse events do not count as new
mouse activity. Existing touch/click/keyboard routes and explicit saver return
behavior are unchanged.

## Run

From the repository root:

```sh
node tests/screensaver-mouse/contract.cjs
CHROMIUM_PATH=/path/to/chromium node tests/screensaver-mouse/browser.cjs "$PWD" /tmp/sukun-saver-mouse
python3 tests/r1213/run-current-checks.py --scope source --output /tmp/sukun-saver-source
```

The current aggregate includes the source contract and includes the native suite
in `--scope full`. Finalize the combined release hashes before full release and
offline/upgrade acceptance. This patch intentionally does not select a new build
number or alter the release currently being published.

## Coverage

- Both actual shipped HTML owners: 1-minute and 5-minute deadlines, sustained
  motion, one pending idle timer, stale callback rejection and true inactivity.
- Scripted, stationary, invalid-coordinate and touch-compatibility mouse events.
- Passive capture, no event consumption, existing touch/click/keyboard activity.
- Open saver settings visibility, explicit return, Escape, Tab focus containment,
  session preservation and no preference writes from activity.
- Disabled mode, hidden-page lifecycle, onboarding and busy audio gates.
- Native suite: complete shipped page, native mouse, keyboard and touch input;
  clock installed before page navigation. Desktop and 393px touch viewports.

## Verification limits

The deterministic contract passed 14/14 groups in the development executor.
The native browser launch was attempted both normally and with the approved
execution override. Chromium failed before opening any page with
`socket() failed: Operation not permitted`. Native suite behavior is therefore
**not yet verified**, and must pass on a browser-capable executor or in CI before
publication. The suite fails closed on launch/fixture errors.

These tests do not certify physical hardware, OS sleep, Android/iOS input or
acoustic playback. Release integrity and offline upgrade remain the combined
release's responsibility.
