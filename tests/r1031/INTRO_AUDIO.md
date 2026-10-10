# r1031 optional intro-audio eligibility

Run from the release root (or supply a different root as the final argument):

```
node tests/r1027/startup-intro.cjs
node tests/r1029/transparent-intro.cjs
node tests/r1031/startup-intro-async.cjs
```

The r1031 runtime supersedes the r1027 audio-only contract that required module
execution by 240 ms and a context already running at construction. The approved
logo, CSS, inline clock and automatic 1300-ms visual deadline are unchanged.

A complete 650-ms hit must fit in that window: the latest eligible onset is
strictly before 650 ms after the inline clock. Deferred module arrival at
350 or 500 ms can therefore still succeed; arrival at or beyond 650 ms cannot.
This does not promise audio on every slow load.

An already-running isolated context starts without resume. A fresh suspended
context gets exactly one automatic resume request. No oscillator graph exists
until both the promise has fulfilled and the context is running. The deadline,
input/visibility/pagehide guards, app playback and recording state, media
playback, ownership mirror and existing owner snapshot are rechecked before
scheduling. Safety signals and a bounded 25-ms guard detect changes while
waiting or playing. Graph construction is followed by another safety check.
The gain, frequencies, envelope and 0.243 theoretical peak remain unchanged.

Blocked, throwing, rejected, interrupted, or never-resolving attempts are
closed without scheduling audio. Late success cannot revive them, even if
close itself fails. Trusted pointer/key/click input cancels the attempt before
a later Start handler can cause it to resume. No unlock handler, retry, shared
AudioContext, ownership acquisition, storage write, cache action or recording
operation is introduced.

Nonvisual root.dataset.audioOutcome is ephemeral diagnostics only. Values
include waiting, scheduled, expired, blocked, cancelled, hidden, unsafe-owner,
unsafe-audio, reduced-motion, unavailable, interrupted and failed. scheduled
means the graph was scheduled; it does not prove sound reached the speakers.
No personal data or browser error text is recorded.

The tests use production runtime and inline-clock source with controlled
promises, clock jumps, statechange events and synthetic WebAudio endpoints.
They cover resume/state ordering, same-task and delayed input cancellation,
ownership/recording changes, missed events, expiry, failures and cleanup.
The 15 original visual/pixel assertions remain exact. These tests do not
establish physical Android Chrome autoplay eligibility, audible bass or
speaker routing, microphone capture, external-call activity, or browser
compositor behavior. Browser autoplay policy remains authoritative; if it
requires a gesture, this automatic intro remains silent rather than borrowing
a later interaction.

The release assembler must refresh the runtime SRI and release inventories
before publishing; this focused source patch does not update deployment
metadata or publish anything.
