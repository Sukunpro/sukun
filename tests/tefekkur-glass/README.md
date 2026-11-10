# Light glass reflection hints

The source patch was integrated onto r1243 main commit `92a2e5e236a40d5da05c92a63524366a180b1c23` as the r1244 candidate. It is not evidence of publication.

- The exit hint and lower wheel instruction share a light translucent glass surface.
- In reflection, the lower instruction uses the existing 14-second opacity-only cycle. Normal reading keeps it static. Reduced-motion users get static instructions; keyboard focus keeps the relevant hint visible. Forced colors remove glass effects.
- Hidden easy controls retain the original 24px eye in its 44×44px button. A stable upward offset and smaller in-flow spacing bring it closer to the lower help without overlaying text or changing the audio/count owner.
- No application JavaScript, recording, count, storage or transport owner changed.

## Checks

`node tests/tefekkur-help/contract.cjs` runs 13 source/accessibility/SRI contracts.

`CHROMIUM_PATH=<supported Chromium> node tests/tefekkur-glass/browser.cjs "$PWD" /tmp/sukun-glass-help` runs the two-theme native wrapper, reduced motion, forced colors and keyboard focus. It is registered in the mandatory full release runner.

`managed-preview.html` is a disposable local preview. Its Run glass checks button runs 44 checks per theme at 320/393/720/1280px in Turkish and English. It switches only the help stylesheet to the archived r1243 `baseline.css` to measure spacing, then restores the current stylesheet and its SRI. It verifies both fade cycles, unchanged geometry, target size, repeated show/hide and exit/reentry, and unchanged selection/count/transport state.

## Verification for this candidate

Managed Chromium: Berhet 44/44 and Esma 44/44, plus the existing reflection-help managed suite passed. At the tested widths the eye is 12px higher and the eye-to-help offset is 34px smaller than the baseline. Both glass labels were visually inspected. Source contracts 13/13, lower-stat contracts 13/13 and direct-count assertions 62/62 passed. Existing r1242 timer and easy-control source checks passed.

The standalone Chromium process cannot launch in this environment because process sockets are restricted. The managed tests ran instead. The new standalone wrapper's forced-color, reduced-motion emulation and native keyboard checks are prepared for CI, not claimed run here. Physical devices, audible playback, screen readers, offline upgrade and full native release acceptance remain outside this local verification.

The r1244 release finalizer updates both shell aliases, SRI, worker cache identity, release markers, manifest, runtime hash inventory and export graph. Before publication, run the mandatory full CI gate on the exact final commit and verify the deployed version and bytes. Local Node and managed-preview evidence do not replace that full native gate.
