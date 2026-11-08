# Lower target and remaining indicators

The approved presentation retains the existing Berhetiyye black-diamond asset and gold filigree family used by the exit control. Only the two duplicate lower cards change. The wheel renderer and count engines remain unchanged.

One native selector offers Normal, Küçük and Gizli. Its validated per-device preference applies only in tefekkür; outside tefekkür the cards use Normal. The same selector moves between existing appearance settings and the main tefekkür surface. Hidden cards have no layout or keyboard target, and the selector and exit remain reachable.

Run:

- `node tests/lower-stats/contract.cjs`: 13 production-module/source assertions.
- `node tests/r1227/direct-count.cjs`: existing 62 native correction/ownership assertions.
- `node tests/lower-stats/browser.cjs "$PWD" /tmp/sukun-lower-stats`: two theme cases, 91 checks each, using the native browser fixture. Requires Playwright and its supported Chromium executable (`CHROMIUM_PATH`).

The browser harness is also suitable for the managed Sites preview. Serve this repository unchanged and open `tests/lower-stats/managed-preview.html?w=393&mode=berhet&theme=berhet`, then run the visible checks button. Repeat with `mode=esma&theme=esma`. It tests 320, 393, 500, 720 and 1280px in all three display modes, native Save/Undo, keyboard Enter/Escape, invalid/cancelled edits, hidden focus, easy-controls eligibility, repeated entry/exit, persistence writes and unchanged counts/wheel markup. The 99,999 single-reading maximum is selected through the native target handler and checked at 320px in Normal and Küçük. It uses a labelled disposable unlocked test profile; never point it at a user's live application origin.

Fixture correction: the first silent native ownership claim can restore saved journey progress. The harness settles this native rebase before capturing the edit snapshot. It then waits for Save's completed form/Undo state, not merely a number that could already equal the input. This preserves the application's stale-edit protection; no counter or ownership fix was required.

Physical devices, assistive technology, upgrade/offline behavior and complete audio lifecycle coverage remain part of release acceptance, not this focused suite. Release manifests and version metadata must be finalized after integration.
