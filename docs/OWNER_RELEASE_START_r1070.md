# r1070: Start during an owned lock release

When a user changed modes and immediately pressed Start, the preceding session could still be releasing this tab's native Web Lock. The new explicit gesture could be rejected before the release finished. r1070 retains that gesture across this tab's own release, then obtains a fresh exclusive claim before starting playback.

The wait is bounded to 10 seconds. Pause, Stop, selection changes, restart, caller cancellation, or a different selected item invalidate it. A competing remote owner remains excluded. A pending Start stays visible to ownership and update observers through the release/acquisition boundary, so an approved application update cannot activate or reload in that gap. Update activation also checks the ownership state again after saving the session.

The opening WAV request now uses the current r1070 release query, matching the service-worker cache entry. The approved audio file remains the existing r1037 WAV.

## Validation

- Retained complete regression run: 117/117 supported fixture groups.
- Retained static release verification: 1,266/1,266 assertions, including syntax, SRI, and release identities.
- Independent ZIP verification: all 698 deployment entries match the asset manifest's sizes and SHA-256 hashes. The archive contains those files plus the manifest itself.
- Fresh controlled owner-release tests: 17/17.
- Fresh controlled update/owner tests: 5/5.
- Fresh actual Chromium Classic/Feyz mobile smoke: 26/26 across 320×640 and 390×844 viewports. Native touch, delayed Yasin picker selection, scrolling, contemplation controls, native WAV playback, and dock hit targets are covered.
- Fresh actual Chromium cross-mode native-media matrix: 33/33 with normal production graphics (`quietVisuals=false`). All 12 transitions between 28-name journey, 99-name journey, single dhikr, and terkip are covered, together with local/global pause scopes and rapid Start cancellation.

The fixture aggregate excludes actual-browser suites; their results are reported separately. Historical regression-runner exclusions retain their documented reasons. The import-maintenance fixture now models the existing provider-drain promise used by ownership maintenance.

## Limits and deployment

The owner and update fixtures control Web Lock completion, IndexedDB, timers, or worker messages. The browser fixtures use headless Linux Chromium and generated personal WAV inputs. They block service workers and cannot establish real service-worker activation, physical Android screen-lock playback, OS audio focus, or audible output. The cross-mode handoff cases use native Web Locks with only delivery of request completion delayed by 1.5 seconds; ordinary transition cases add no lock delay.

This is a review candidate. The review branch and draft PR do not change the live r1069 deployment. Physical Android screen-lock testing remains explicitly `NOT_RUN` in the build metadata. Existing pending source-edition comparisons for Delâil/Hizb remain pending.

The full deployment archive is `SUKUN_r1070_TAM_PAKET.zip` (291,420,119 bytes), SHA-256 `42009ef7747f30e9902e75c50c8598fcbf242902e68990a8a336fabe2c9c185b`.
