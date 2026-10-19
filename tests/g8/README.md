# G8 reference-map checkpoint

Base application: r1117, commit
`5459587e2a4ce794683908c1b098076b3f2eb081`.

This checkpoint adds offline developer tooling and documentation. Production
HTML, JavaScript, CSS, images, version identifiers, worker and deployment
inventories are unchanged. The generated visual map is a scoped static
observation, not proof of runtime reachability or permission to delete assets.

From the repository root:

```bash
node tools/visual-reference-map.cjs --root . --output docs/g8/visual-reference-map.json
node tests/g8/visual-reference-map.cjs
node tools/release-integrity.cjs .
```

`evidence/baseline/` contains ten fresh controlled/static checks from this
checkpoint, all exit 0: 262/262 reported checks. Exact suite names, source hashes,
methods and limitations are retained in each result. The existing suites are:

- r1107: storage-snapshot, storage-snapshot-ui.
- r1108: kandil-preferences, health-presentation-context, presentation-notice.
- r1109: category-flow-extraction.
- r1110: tooltip-help-extraction.
- r1111: notification-layout-extraction, css-assets.
- r1112: tekke-set-card-extraction.

Each suite accepts the release root as its first argument and an output JSON
path as its second. Historical evidence was not overwritten.

`evidence/release-integrity.json` records the separate fresh production-byte
check: 1,529/1,529. It covers the complete local r1117 deployment inventory,
SRI, script syntax, version identity and the existing scoped external CSS
validator. The script also writes its usual `tools/release-integrity-results.json`;
that historical tracked file was restored after the result was captured here.

`evidence/reference-map-tests.json` records 13/13 new real-filesystem fixture
groups, including missing and altered bytes, path escape, symlink and hardlink
write protection, literal mapping extraction without executing application
scripts, deterministic output and stale snapshot rejection.
`evidence/reference-map-check.json` records a fresh check of the generated
production snapshot. `verification.json` binds the tool, test, map and baseline
reports to their SHA-256 values and the base application commit.

These numbers are kept separate. They do not establish browser pixels,
microphone access, real storage quotas, audible playback, Android screen lock,
OS audio focus, service-worker upgrades or supported rollback acceptance.

See `docs/g8/STATUS.md` for roadmap accounting and G8's remaining acceptance.
