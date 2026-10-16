# r1081 — Akıllı Seans hedefi

The ordinary smart-session editor can create protective-reading steps without
`protectionPlan`. Before this correction, five steps with `reps: 7` displayed
an unrelated direct counter (`11/622`, remaining `611`) on both the wheel and
dock. The regression suite deliberately leaves the special marker absent.

Run the browser suite from the repository root with Playwright available and
`CHROMIUM_PATH` set when the existing Chromium executable is elsewhere:

```sh
node tests/r1081/smart-target-browser.js . /tmp/r1081-smart-target-browser.json
```

The suite checks:

- Five ordinary cards configured to seven through 30 trusted native `+` clicks.
- The actual wheel and dock use `0/7`, then `1/7` after a real native end.
- Local Pause, held incomplete audio and Resume retain the confirmed count.
- Seven complete Felâk recordings advance to Nâs with a fresh `0/7` target.
- The production wheel Finish handler stops the ordinary smart session and
  fences unfinished recordings. This handler check uses a programmatic DOM
  click, explicitly recorded in its evidence.
- Direct `Z.target`/`Z.count` are preserved; an ordinary Esmâ step uses its own
  finite target; manual/timed steps never borrow the direct ebced target.
- Conditional editor text is hidden for fixed repetitions and matches the
  selected manual or timed mode.
- No JavaScript exceptions or failed local requests occur, and release HTML
  remains unchanged throughout the run.

Disposable two-second PCM tones are generated transport fixtures, not sacred
recitation recordings. Native media clocks and completion events are observed
without alteration. Device speech is controlled by the existing isolated test
fixture and is asserted unused by these personal-recording scenarios.

`SUKUN_REPRO_ONLY=1` runs only the initial editor/target checks against an
explicitly supplied baseline root. The r1080 baseline used immutable committed
HTML, with ordinary five-item `reps: 7` input and the prior `11/622` direct
counter. It reproduced `11/622` and remaining `611` on the wheel and dock.

No personal browser profile, microphone, production credential or user recording
is read. Linux Chromium Classic/Feyz evidence is not a physical Samsung Internet
or Android screen-lock result. `verification.json` records the final concise
result; detailed generated JSON and screenshots stay outside the repository.
