# Image package UI: controlled browser fixture

Run with the source root and a fresh report filename:

```sh
node tests/r1095/image-pack-ui-browser.js /absolute/source/root /absolute/qa/output/native.json
```

The script writes the JSON report and screenshots beside that report. It expects Playwright and `/tmp/sukun-browser/chromium`; `CHROMIUM_PATH` can select another installed executable. Each page uses a disposable browser context.

This is **controlled minimal-DOM evidence**, separate from the installed-worker/full-app suite. It serves the image-package UI JavaScript/CSS and the actual `berhet-layout-r938.css`, `berhet-materials-r933.css`, `berhet-controls-r933.css`, and inline `sukun-r920-contract` ancestor CSS without rewriting their bytes. The report records test-script, UI module, ancestor source, served hash, and served byte identities. Inspection/download/cancel promises, policy changes, cache receipts, and progress are deliberately controlled seams. The fixture does not establish real cache integrity, network downloads, service-worker lifecycle, physical Android behavior, audio quality, or operating-system accessibility settings.

The 27 checks cover explicit inspection and token-bound download, retained native controls and accessible labels, exact total/verified/missing/unknown display, cancellation and recheck, unavailable/core errors, private-scope invalidation and late-result hiding, stable hydration, and preservation of unrelated preferences, audio, session, and counters. TR/EN, 320/390px, Esmâ/Berhetiyye profiles include normal and 200% text measurements. For 200%, every computed element font size is doubled and the resulting computed size is verified. Geometry checks enforce containment, readable wrapping, native single-line selected options, and minimum 44px controls.

The checked-in script's deliberate expected total is **27**. Final release acceptance must rerun it against the finalized source using a fresh report path and keep this controlled evidence separate from full-app/cache evidence.
