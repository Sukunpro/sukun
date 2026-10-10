# r1034 longer automatic intro and per-load audio evidence

The approved logo and pattern are unchanged. Production timing is 1000 ms preparation + 2400 ms visual run (3400 ms total); mark/light animations last1900 ms. The waveform remains650 ms, so admission is strictly before1750 ms of the native CSS visual clock. Reduced-motion handling and all existing microphone/audio/tab ownership guards remain.

Focused commands from the repository root:

- `node tests/r1032/startup-intro-readiness.cjs .`
- `node tests/r1031/startup-intro-async.cjs .`
- `node tests/r1033/startup-intro-diagnostics.cjs .`
- `node tests/r1034/intro-health-diagnostic.cjs .`
- `node tests/r1017/health_inspection_contract.cjs .`

The older numbered timing suites now validate this current source. Their filenames are retained for reproducibility, not a claim that old timing constants remain.

System check reads only the current-load frozen diagnostic snapshot. It performs no audio action, storage operation or fresh timing collection. Evidence contains fixed states and numbers, never recordings or personal text; the new row and its derived statuses are excluded from AI aggregates. Missing data stays unknown, and even scheduled sources are not an audible-output PASS. The technical report can be downloaded before reloading, after deliberate user navigation. No automatic upload occurs.

This diagnostic candidate does not repair the separately reproduced stale-envelope edge under a large same-task stall. It also cannot promise automatic audible sound where the browser keeps AudioContext suspended.
