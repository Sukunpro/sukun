# r1096 duration and Studio regression checks

Run from the repository root with Node.js:

```sh
node tests/r1096/preparation-limits.cjs .
node tests/r1096/studio-explanations.cjs
node tests/r1096/studio-edit-admission.cjs .
node tests/r1096/studio-browser.cjs . /tmp/sukun-r1096-browser-results.json
```

The browser suite requires Playwright and a compatible Chromium binary. `CHROMIUM_PATH` overrides its default `/tmp/sukun-browser/chromium`; make Playwright available to Node through the environment used by the existing browser suites. The browser uses a disposable local origin, generated WAVs and fresh IndexedDB. It does not access personal recordings.

| Suite | What it checks | Boundaries of the evidence |
| --- | --- | --- |
| `preparation-limits.cjs` | Shipped container parsing; inclusive WAV 60-second boundary; WebM cluster, block and cumulative Opus duration checks; the conservative +1-second margin; distinct source/duration/memory errors; pre-decode rejection; decoded-layout/rate rechecks; shared resident memory; serial queue and cancellation lease handling. | Node VM with generated WAV/WebM fixtures. Metadata probing, decoded audio results, URLs and timing use controlled seams. It does not run a native decoder. |
| `studio-explanations.cjs` | Turkish and English error explanations, including the difference between an uncommitted edit and a saved recording whose later analysis failed. | Executes the shipped explanation module in a Node VM. |
| `studio-edit-admission.cjs` | Actual shipped Studio edit and owner callbacks admit only the exact pending normalise/trim claim. Owned/unowned cases, cancellation, changed selection/sequence, concurrent audio/recording/analysis, paused sessions, getter failures and peer ownership remain guarded. | The shipped functions run with controlled locks, storage, clocks, sample processing and writes. This does not prove native browser lock or microphone behaviour. |
| `studio-browser.cjs` | Full Classic/Feyz application: native Chromium decoding, CPU worker, IndexedDB bytes, clearing stale measurements, duration/file/memory failures, successful normalisation and silence trimming, shorter saved WAV duration/bytes with other recordings unchanged, saved-success messaging after later analysis failure, empty selection, bilingual limits and served-byte integrity. | Disposable Linux Chromium; generated WAVs only. Device voice metadata is controlled and service workers are blocked by the shared browser fixture. No microphone, audible-output, physical Android or screen-lock claim. |

The browser script also accepts `--baseline` **with an older source checkout supplied as its root argument**, to reproduce stale measurements. Baseline mode intentionally expects the old failure and is not a release pass for r1096.

## Limits under review

- Capture, Studio processing and playback are separate operations. r1096 adds no new automatic microphone cutoff and implements no three-minute Studio extension.
- Studio's existing ceiling remains verified **60 seconds**, **8 MiB** source and **32 MiB** shared preparation budget. Shorter inputs may fail the memory check; duration alone is not admission.
- WebM/Opus inspection adds **one second** to timestamp and cumulative-packet estimates. Raw 60-second WebM fixtures can therefore fail the final verified-duration check; 59-second estimates plus the margin fit the duration ceiling. These boundary fixtures do not guarantee acceptance by every real recorder or decoder.
- A failed operation before commit preserves its source. A successful commit followed by failed reanalysis must retain the saved recording and say so. Cancellation immediately after a fulfilled guarded write also remains a successful save, without stale reanalysis or updates to another selection. These are different outcomes.

## Executed results and remaining checks

Use the final [verification.json](verification.json) and reports in `tests/r1096/evidence/` for executed counts and source identities. This README describes coverage; it is not an assertion that a later source edit has already passed. Earlier `qa/final` files can predate the final help-copy or release-integrity rebuild and must not substitute for the final verification.

Adjacent regression coverage includes `tests/r1094/studio-target.cjs`, `tests/r1094/studio-owner-admission.cjs`, recording storage/unavailability, prayer recording faults, owner lifecycle/import/update handoff and release integrity. The release runner determines the exact executed set.

Remaining device checks: actual Android/Chrome microphone recording near and above the processing ceiling; cancellation and recording after interrupted capture; long raw-recording playback; real output listening; screen-lock/resume; same-origin multi-tab interaction; memory/storage pressure and reload. None is established solely by the controlled or Linux browser suites.

Türkçe: Testler mikrofon kaydı, stüdyo işleme ve oynatma ayrımını korur. 60 sn / 8 MiB / 32 MiB üst sınırları ve WebM'nin +1 sn güvenlik payı sınanır; üç dakikalık destek uygulanmış sayılmaz. Sonuç sayıları yalnız son kaynakla üretilmiş `verification.json` üzerinden bildirilmelidir. Gerçek Android mikrofonu, ekran kilidi, işitilebilir ses, uzun kayıt ve depolama/bellek baskısı için cihaz denemeleri devam eder.
