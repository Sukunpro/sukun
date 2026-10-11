# r1053 confirmed manual-credit mini-turn checks

Run from the repository root:

```sh
node tests/r1053/manual-count-commit.cjs
node tests/r1053/wheel-mini-motion.cjs
```

The commit fixture executes the production human feedback, count correction,
manual-voice and repeat owners. It verifies one presentation call after a real
human +1, including nested paused correction and verified voice completion.
Failed, blocked, stale, hidden, decrement, automatic and imported updates cannot
create a forward step. A truthy result without an actual credit is insufficient.

The motion fixture executes the production controller with event-capable DOM,
pointer sequences and a controlled clock. It covers signed/inverse
angles, rapid taps, motion preferences and eligibility, fixed count/clip geometry
and continuous automatic rotation through ordinary touches. Playback/count
commands are trapped. The CSS/DOM
checks preserve registration of artwork and stone controls, upright labels and
the existing automatic transform phase.

The r1054 tests cover the current keyboard-focus and touch policy with the
actual session read model and selected single, 28-name and 99-name routes.

These are controlled production-source contracts, not proof of physical Android
display rendering, audible output or native browser frame timing.
