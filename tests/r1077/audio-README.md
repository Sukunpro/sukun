# Protective native recording follow-up

The r1076 baseline reproduced the reported `native-format-unavailable` card
after hiding an otherwise playable personal recording whose preliminary
metadata probe returned zero. The baseline also showed that a clean automatic
protective Ayatul selection never queried its shipped Arabic bank.

The production correction makes the immutable bank visible to the canonical
protective automatic `hasKnown`, signature and `find` paths. Source-only modes,
non-protective names and unverified custom terkip parts retain their policy.
Bundled origins remain distinct from personal recordings. Kalem has no shipped
bundle and is not mapped to the Ayatul audio.

A zero preliminary duration is only an unknown-duration candidate for the
current protective Blob URL. The persistent native player's accepted positive
duration must still meet the selected interval at its actual rate before the
media ledger is installed. Known short, stale or foreign candidates remain
blocked. Source notifications with unchanged preferences retain the accepted
raw URL, so local Pause/Resume can retain its cursor.

Run from the repository root:

```sh
node tests/r1076/protective-original-contract.cjs .
node tests/r1077/protective-bundle-priority.cjs .
node tests/r1077/protective-native-metadata-browser.cjs . /tmp/r1077-native.json
node tests/r1076/protective-original-browser.cjs . /tmp/r1077-native-existing.json
```

The source contracts control metadata and preparation leaves. Native browser
checks use isolated Classic/Feyz Chromium profiles and public production
session commands. The automatic Ayatul case reads the shipped bank without a
personal alias; the personal Ayatul case controls only the small preliminary
duration probe and optional processing. Kalem's pending-probe test uses a
generated three-second tone solely as a transport fixture, not recitation.

The fixture enables autoplay, blocks service workers/external resources and
simulates visibility. Physical Android locking, user-gesture restrictions,
OS focus and audible output remain unmeasured.
