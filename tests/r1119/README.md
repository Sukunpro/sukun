# r1119 bounded recording/backup panel candidate

See `docs/g8/R1119_ACCEPTANCE.md` for scope, publication baseline and remaining
gates. `verification.json` binds final production and evidence bytes.

From the repository root, with the frozen r1118 checkout adjacent:

```sh
node tests/r1119/recording-panel-contract.cjs . ../sukun-g8-recovery
python tests/r1119/run-release-integrity.py
node tests/r1119/health-marker-bytes.cjs . tests/r1119/evidence/health-marker-bytes.json
python tests/r1119/run-controlled-regressions.py
python tests/r1119/run-source-checks.py
node tools/visual-reference-map.cjs --root . --check tests/r1119/visual-reference-map.json
```

The controlled aggregate selects the documented original range through r1048
and retains its explicit superseded-fixture exclusions. It copies test fixtures
outside the repository and uses synthetic storage/DOM/media boundaries. Newer
G6/G7/G8 source/map tests and health allowlist tests have separate reports. The
older CSS grammar/volume tests now read and verify the actual external owners;
they do not simply lower style-count expectations or remove assertions.

Native commands require Chromium and Playwright, for example with `NODE_PATH`
set to the installed Playwright modules and `CHROMIUM_PATH=/usr/bin/chromium`:

```sh
node tests/r1119/recording-panel-browser.cjs . ../sukun-g8-recovery tests/r1119/evidence/recording-panel-browser.json
node tests/r1119/expanded-ambience-browser.cjs . tests/r1119/evidence/expanded-ambience-full.json
node tests/r1119/release-upgrade-browser.cjs . ../sukun-g8-recovery tests/r1119/evidence/service-worker-upgrade-native.json
node tests/r1117/release-mode-smoke.cjs . tests/r1119/evidence/native-audio.json
SUKUN_R1101_PROFILE=390-tr SUKUN_R1101_CASE='Trusted common Play|Native library selection|Hard Stop|Global Pause' node tests/r1101/frequency-hub-browser.cjs . tests/r1119/evidence/frequency-hub.json
SUKUN_AMB_PROFILE=390-tr node tests/r1102/ambience-compact-browser.cjs . tests/r1119/evidence/ambience-native-interaction.json
python tests/r1119/verification-gate-test.py
python tests/r1119/build-verification.py
```

Never substitute old browser evidence for a newly edited candidate. Inspect
the actual completed profile/state counts and any baseline defects or incomplete
preconditions. A test source listing planned coverage is not executed evidence. The evidence
manifest requires a finish timestamp, exact bounded check/profile counts, no
fatal/pending profile and matching collector source hashes; passing prefixes
from in-progress checkpoint files cannot satisfy acceptance.
The native suites use disposable profiles, synthetic recording bytes or public
bundled media, and no real microphone or user data. The panel matrix's shell,
family and text-size permutations are explicitly presentation-only; other
native tests cover the reachable controls. Protected unlocking and physical
device behavior are not claimed.

Initial sandbox Chromium launch failure, native navigation setup retries,
historical runner setup error, and pre-fix aggregate results remain separate
from final reruns. All output is local; this test task does not publish r1119.
