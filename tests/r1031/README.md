# r1031 focused regressions

Final integrated run: 13 baseline suites with 430/430 checks and 22 targeted
suites with 1698/1698 checks. Targeted totals include integrity, hashes and
syntax checks, not 1698 physical-device scenarios.

Additional suites:
- `node tests/r1031/cabir-background-cache.cjs .`: 30 checks against actual SW handlers and exact image bytes; stale versus current/unversioned URL and pinned recovery behavior.
- `node tests/r1031/mini-player-logo.cjs .`: 14 narrow decoration, image-fit and unchanged drag/transport contracts.
- `node tests/r1031/startup-intro-async.cjs .`: 95 controlled scheduling/resume/cancellation cases. Include the shared `tests/helpers/startup-intro-fixture.cjs` dependency.

Audio onset must occur strictly before 650 ms so the unchanged full hit fits
inside the 1.3-second visual intro. Browser policy remains authoritative.
The ephemeral `data-audio-outcome=scheduled` reports graph scheduling, not
audibility. See `INTRO_AUDIO.md` for the timing and safety contract.

## Personal-centre glass regression

Run from the repository root:

```sh
node tests/r1031/personal-centre-glass.cjs
```

For the isolated pre-release patch, optionally compare against the exact r1030
baseline as a third argument:

```sh
node tests/r1031/personal-centre-glass.cjs /path/to/candidate /path/to/r1030
```

The baseline comparison deliberately expects no release/version repackaging yet.
It proves that removing the single new style block restores both entry points
byte for byte, and that runtime CSS/JavaScript files are unchanged.

This is a narrow paint change for the direct `.wrap > #prDashboard` component
while the Ambiyans tab is visible. It retains the existing no-blur contract,
geometry, hidden-state rules, native controls, and active status colours.
Contrast calculations use a pure-white scene, every pair of gradient stops,
and a conservative 4% white reflection before the local text scrim.

Also run the r1029 surface, introduction, and cinematic-containment contracts,
r1030 recovery/volume-label contracts, and r1028 CSS/layout checks. Release
manifest hashes must be refreshed by the release owner before a full release
integrity/export check; this isolated patch does not change release metadata.

Browser and physical-device QA remain separate: check Ambiyans in Classic,
Simple, and Focus layouts; Esma/Mevlevi and Berhetiyye scene backgrounds; 320,
360, 390, and 430px widths; TR/EN labels; reduced transparency; scrolling;
search and Continue controls; return navigation; and no change to other cards,
the approved introduction, or wheel/whole-screen containment.
