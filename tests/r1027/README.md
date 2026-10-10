# r1027 release checks

Run with Node.js from the repository root. These fixtures use production source
with synthetic storage, media, browser endpoints and clocks. They do not touch
personal recordings or a browser profile.

```sh
node tests/prayer_recording_faults.cjs
node tests/r1027/recording-inspection-active.cjs
node tests/r1027/recording-inspection-history.cjs
node tests/r1027/recovery-entry.cjs
node tests/r1027/startup-intro.cjs
node tests/r1027/site-backup-regression.cjs
node tests/r1027/recovery-regression.cjs
node tests/r1027/locale.cjs
node tests/r1027/release-integrity.cjs
node tests/r1027/full-release-export.cjs
```

The last test requires a complete deployed release tree (approximately 225 MB)
and sufficient memory for a full uncompressed ZIP. It invokes the exact shipped
exporter against local file bytes, verifies each ZIP entry, SHA-256 and CRC, and
adds only synthetic personal JSON. It does not download or upload a backup.
Some fixtures write their result JSON beside the test script; use a copied tests
directory and pass the source root as argv[2] to keep the checkout untouched.

Also rerun the existing 13 audited groups: the five scripts listed in
`tests/README.md`, all three `tests/r1016/*contract.cjs` / health scripts,
the three r1017 inspection contract scripts, and r1021 import-maintenance and
persistence-model. The first two legacy scripts take index.html as argv[2];
the others take the source root.

## Final r1027 verification

- Existing baseline: 430/430 checks across 13 distinct suites.
- Prayer playback/read/delete/cancellation: 88/88.
- Active r1020 reader adaptation: 73/73; additional history cases: 5/5.
  The 73 cases adapt existing scenario intents to the active reader, not 73
  newly discovered independent behaviors.
- Independent recovery entry: 28/28; automatic intro: 47/47.
- Site-backup fault cases: 49/49; recovery worker/UI: 31/31.
- Targeted TR/EN text: 39/39.
- Static release integrity: 828/828, covering 362 complete site files, 57
  required runtime entries, 49 SRI references, 247 inline and 38 external
  JavaScript parses. Static assertions are not device behavior tests.
- Exact full-site exporter: 365 ZIP entries; 224,866,356 bytes, using all
  224,743,259 deployment bytes and synthetic personal JSON only.

The `recovery-browser.cjs` and existing r1021 persistence-browser integration
checks are provided but unrun in this execution environment: Chromium stopped
before navigation because its required socket operation was not permitted.
No physical Android, lock-screen/background lifecycle, microphone recording,
audible bass quality or real-browser recording durability is claimed.

Opening `rescue.html` does not restore data, choose a version, clear caches or
unregister a worker. Version selection still requires an explicit user action,
verified available bytes, idle ownership and single-client safety gates.
The existing Tekke media-error-to-TTS fallback policy remains unchanged.
