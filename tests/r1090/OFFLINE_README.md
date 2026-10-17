# Offline and saved-template error checks

`saved-activation.cjs` executes both shipped saved-template activation callbacks with controlled lookup receipts and DOM/player state. Its 24 checks cover a current storage failure in Turkish/English, retry, hidden/deleted rows and stale queue, token, name, input and activation intent. The test deliberately makes `snapshot()` throw so a shared storage error cannot accidentally replace the operation's receipt. The canonical database implementation is tested separately by `saved-session-store.cjs` and the storage export suite.

`offline-browser.js` is a separate native Chromium suite; run it only after the candidate release has been finalized and production files are frozen. It derives the release number from the shipped HTML. The real worker must finish installation and cache all six mandatory original MP3 files before the test calls any bundled-source warm-up or playback. Network access is then disabled, including a server-side socket gate so worker fetches cannot bypass Playwright context offline emulation. A cold page is loaded and an uncached HTTP probe must fail.

The 15 browser groups cover verified installation, the six exact precached media files, cold offline Classic/Feyz loading, canonical saved-template/favorite persistence, an old launcher URL, one saved-template error/retry interaction, six original media onsets, native Pause/Resume/Stop and truthful offline cache refresh. Saved-template error injection is explicitly limited to the canonical database transaction method; the original method is restored before retry. Both saved-template clicks use actual pointer events.

Example (requires the runtime Playwright module and Chromium path):

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules CHROMIUM_PATH=/tmp/sukun-browser/chromium node tests/r1090/offline-browser.js . /workspace/scratch/c556940ae759/qa-r1090/offline/offline-browser.json
```

Original MP3 bytes, playback rate, player completion events and browser clocks remain unchanged. Every media sample is explicitly stopped after native onset. A full recitation, successful repeat credit, audible quality and physical Android behavior are not claimed. Existing controlled worker admission, refresh and recovery suites continue to cover missing/corrupt executable graphs and historical cache selection.
