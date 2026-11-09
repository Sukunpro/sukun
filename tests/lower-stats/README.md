# Lower target and remaining indicators

r1237 replaces the old three-choice menu with a native size range and a separate centered eye. The same black-diamond/gold frames remain. Only duplicate lower cards change; the full wheel renderer and count/audio owners remain unchanged.

The v2 per-device preference stores independent size (0–100) and visibility. It migrates v1 Normal to size50, Küçük to size0, and Gizli to hidden at size50, leaving v1 intact for rollback. Preferences affect cards only in tefekkür. The eye and slider belong to easy controls: hiding easy controls removes both from layout and keyboard focus; showing them restores the saved state. With cards hidden, the size row disappears while the centered eye and exit stay reachable whenever easy controls are shown.

Run:
- `node tests/lower-stats/contract.cjs`: 28 production-module/source assertions, including migration, invalid/denied storage, cross-tab focus, teardown and unchanged wheel hash.
- `node tests/r1227/direct-count.cjs`: existing 62 native correction/ownership assertions.
- `node tests/lower-stats/browser.cjs "$PWD" /tmp/sukun-lower-stats`: two themes, 159 assertions each, plus native keyboard, pointer drag and reload persistence. Requires Playwright and supported Chromium (`CHROMIUM_PATH`).

The browser harness covers 320/393/500/720/1280px at minimum, middle, maximum and hidden settings; text inside all four frame edges; 44px controls; centered eye before exit; Save/Undo/Cancel/invalid input/Enter/Escape; hide/show focus; repeated tefekkür transitions; unchanged counts and wheel markup; native 99999 maximum target. It uses labelled synthetic state only. Do not use it against a user's production origin.

Managed preview may use a disposable shell copy with service-worker capability disabled, matching CI's serviceWorkers:block. All runtime assets remain byte-identical. This is focused UI evidence, not upgrade/offline or physical-device acceptance. CI runs the original shell and separate exact-predecessor upgrade checks.

The original native-editor fixture settles its first ownership rebase before the edit snapshot and waits for completed form/Undo state. No counter, audio or ownership behavior is substituted. Existing audio CI remains unchanged, including its documented startup/seek measurement race.
