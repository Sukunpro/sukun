# Independent recovery entry

Run from the release root:

```sh
node tests/r1027/recovery-entry.cjs
node tests/r1027/startup-intro.cjs
node tests/r1027/recovery-browser.cjs
```

The controlled source suite evaluates the shipped independent scripts without
any main-app globals. It covers short tap versus 1.2-second hold and release,
movement/scroll/pointer cancellation, extra touches, Escape, page hiding,
Back/Forward recovery, synthetic-input rejection, the native focusable link,
TR/EN selection, absent/blocked/unrelated workers, controller disappearance,
and forbidden data/network/storage operations. It accesses no real recordings.

Result: **28/28 controlled checks passed** in the recovery work copy. The five
existing recording/input/finish/owner/unavailable suites also passed **84/84**.
All **246 executable inline JavaScript bodies** parsed; JSON, the two
`text/x-sukun-tpl` templates, and one intentionally disabled script are excluded.
The disabled script body also parses when checked separately.

The optional browser smoke suite requires Playwright and a working Chromium
(default `/usr/bin/chromium`, override `CHROMIUM_PATH`). It serves a fixture
built from the production HTML with main scripts deliberately removed. It
checks the real keyboard link, short and long pointer gestures, scroll
cancellation, language switching, no controlling worker, and JavaScript-off
fallback. Remote requests are blocked. It uses a fresh context and no user data.

Browser result in this environment: **blocked before navigation, 0 checks
executed**. Chromium exited with `process_singleton_posix.cc` socket `EPERM`.
No sandbox escalation or repeat launch was attempted. These source checks do
not establish physical Android/iOS touch behavior, audible playback, or real
user-data recovery.

## Integration contract

- Merge `index.html`, `rescue.html`, and
  `assets/runtime/recovery-entry-r1027.js`; mirror the final index into
  `nero.html` during release assembly.
- Both new production files must enter the release asset manifest. Add the
  versioned `./rescue.html?v=<build>` and entry runtime to service-worker CORE,
  REQUIRED_RUNTIME, and build.runtime, with current SHA-256 digests. Update the
  entry script SRI if its bytes change.
- The service worker must recognize `rescue.html` before any pinned-version
  branch and serve its verified current copy independently. The separate SW
  workstream owns that patch and its route regression tests.
- This branch intentionally retains r1026 build/query markers for the
  integrator's atomic r1027 release bump.
- No transport, AudioContext, recording, counter, ownership, or genuine
  pending-recovery/reload control is modified. Existing Start/Play gesture
  activation remains in its core pathways. Single start primes before tab
  acquisition; sequence run/defer primes through the existing owner binding
  before awaiting acquisition; frequency frStart calls ac synchronously. The
  audio workstream owns the corresponding gesture-activation regression.
  The obsolete touch-curtain
  toggle markup is removed; the replacement intro is logo-only and automatic.
- The title entry never prevents native click/scroll/zoom. The SÜKÛN title
  alone disables text selection/callout so mobile long-press is usable.
  A bookmark to `rescue.html` remains the fallback if the entry script itself
  fails, the app thread hangs, or an old shell lacks the hidden entry.

Opening rescue only changes its presentation. It cannot register/update/remove
workers, read personal stores, clear caches, restore data, pick a version, or
navigate automatically. Its ordinary app link preserves the selected version.
The optional worker recovery link appears only for an activated same-origin
same-directory `sw.js` controller; its copy explicitly notes that recovery
feature availability depends on the installed worker version. With JavaScript
off, both language sections and app links remain usable, while worker options
stay hidden because controller availability cannot be checked.

## Automatic logo intro

The intro uses the exact PNG bytes from the existing embedded SÜKÛN favicon,
now also stored at `assets/branding/sukun-logo-existing.png`. It displays no
words, buttons, or tap prompt. A 1.3-second CSS animation permanently hides
the nonblocking layer even when JavaScript is disabled, missing, or broken.
An independent inline timer also hides it after 1.3 seconds. Reduced-motion
mode shows a still logo and uses the same deadline. Hiding the page ends the
intro and does not replay it on return. The recovery link stays above it.

`startup-intro-r1027.js` is deferred so existing synchronous main initialization
finishes before its one-shot state check. Its independent bass synthesis is
optional: it requires known idle app/recording state, no ownership mirror, a
visible page, no prior user input, an age of at most 240 ms, and a newly created
AudioContext that is already running. Missing APIs, slow loading, reduced
motion, blocked autoplay, or any uncertainty produce a silent intro of the
same length. There is no retry, resume call, or later gesture-based unlock.
An audible bass on every launch is not promised.

The hit uses three sine partials sharing one onset. Its theoretical summed
amplitude is capped at 0.243 of digital full scale. Sources stop by 650 ms; a
760-ms watchdog mutes, disconnects and closes the isolated context. Real input
ends intro audio before subsequent main Start handlers. Page hide, context
suspension, graph failures and rejected close operations are covered. It never
modifies the main AudioContext, recording data, counters, or ownership.

Result: **47/47 controlled intro checks passed**. This validates lifecycle,
source order, safety guards, envelope bounds and deadlines with deterministic
fixtures; it does not establish perceived bass quality, mobile rendering, or
actual-browser permitted-autoplay timing. The known Chromium sandbox blocker
was not retried. Final release inventory must include the logo and new runtime
with exact hashes, plus the updated index SRI.
