# Unified Berhetiyye entry

`unified-gate.cjs` runs production adapter/helper contracts in Node. It checks a single entry, credential-only enrollment, the normal verify/commit grant boundary, bounded validation, provider authority, awaited queue parking before reset, cancellation/provider replacement during reset, no destructive fallback, translated disclosure, read-only calendar privacy and absence of a first-use countdown.

`unified-gate-browser.js` runs the complete Classic/Feyz application at390×844 and320×640 with the real device adapter and PIN helpers. Test PINs and a synthetic WAV storage sentinel belong to disposable profiles. It checks first-use confirmation, X-ray opening, local settings, focus return, reset cancellation, reset preservation, concealed queue parking/restoration without autoplay, retained lock/wrong-password behavior, English narrow layout and provider-mode denial of local setup/reset. All served files must equal the source on disk.

Run the browser suite only after shell SRI and the full release source are frozen:

```sh
node --test tests/r1090/unified-gate.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules CHROMIUM_PATH=/tmp/sukun-browser/chromium node tests/r1090/unified-gate-browser.js . /absolute/qa-r1090/unified-gate/native.json
```

These checks do not prove physical Android locking, remote paid membership or perceptual recitation quality. Gate FX and narration isolation are additionally covered by the retained r1089 native suite; neither the live speech queue nor a real user profile is accessed.
