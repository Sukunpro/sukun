# r1084: preset identity and truthful session progress

The production Sabah Sükûnu factory previously searched for İstiğfar in the
wrong category and read only `.tr` for Esma names stored in `.t`. Failed lookups
silently became index zero. The editor also displayed unnamed `Okuma` rows.
During silence and after completion, the shared wheel fell back to the unrelated
direct target (for example 622). Reload could clear a restored result through a
startup selection notification.

The release resolves intended items without substitution, validates readable
sources before admission and playback, requires explicit audio completion,
projects each step's own count, and persists a validated inactive result. Native
user selections remain distinct from startup hydration. Restarting the completed
wheel replays the same plan; skip outcomes never become unfinished jobs.
On genuine page departure, ownership cleanup pauses the logical smart checkpoint
while draining audio. Explicit Stop and ownership revocation retain their normal
stop behavior, so reloading at 1/3 preserves a paused 1/3 without autoplay.

Run the controlled production-function suites from the repository root:

```sh
node tests/r1084/preset-engine.cjs .
node tests/r1084/session-projection.cjs .
node tests/r1084/terminal-journal.cjs .
node tests/r1084/tts-completion.cjs .
node tests/r1084/ui-reading-names.cjs .
```

The native suite clicks the actual visible preset and Start buttons. It uses
disposable generated PCM recordings for İstiğfar ×3, Nûr ×11, Allah and the
separate silence announcement. It checks native `ended` counts, the complete
five-second quiet budget, the wheel, completed/paused reload, replay, invalid
saved steps, explicit repair and retry, and resource integrity:

```sh
NODE_PATH=/path/to/node_modules CHROMIUM_PATH=/path/to/headless_shell \
  node tests/r1084/session-preset-browser.js . /tmp/r1084-native.json
```

These are Linux Chromium transport and UI checks. They do not establish audible
recitation quality, physical Samsung/Android screen-lock behavior, or device
voice availability. No personal recordings or user storage are used.

Release checks are `tools/release-integrity.cjs`, `tools/full-release-export.cjs`
and `tests/r1049/run-regressions.py`. The r1081 non-reading projection assertion
now expects a smart silence/frequency presentation without a borrowed target;
the underlying direct counter must remain byte-for-byte unchanged.
