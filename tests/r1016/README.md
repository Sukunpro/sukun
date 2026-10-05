# r1016 recording-update regression tests

From the repository root, run:

```sh
node tests/r1016/recording_continuity_contract.cjs
node tests/r1016/update_receipt_integration.cjs
node tests/r1016/recording_continuity_health.cjs
```

The three scripts execute the shipped production runtime, inline update manager, and health collector/presenter. They cover 61, 13, and 56 scenarios respectively. Fixtures use only synthetic Blob values, controlled IndexedDB transactions, localStorage, service-worker endpoints, clocks, and DOM endpoints. They never access a browser profile or personal recordings.

Covered boundaries include successful zero counts versus inaccessible storage; transaction abort/error/timeout; no schema creation; read-only scans; bounded sanitized receipts; stale, canceled, mismatched, and unpaired measurements; maintenance success/failure/cancellation; controller changes and late callbacks; exactly-once approved reload; historical report wording; exclusion of voice data, names, keys, URLs, arbitrary error text, and diagnostic-derived aggregates from AI payloads.

These are controlled source-level checks, not physical Android storage-eviction or recording-recovery tests. The cause of the reported recording disappearance remains unresolved. The first installation establishes a baseline, not a retrospective comparison with r1015.

The existing r1015 scripts and their instructions remain in `tests/README.md`.
