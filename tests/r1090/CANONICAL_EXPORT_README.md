# Canonical template export regression contract

`canonical-export.cjs` executes the current saved-template store and active
normal JSON/Recovery settings projections. It verifies that successful
canonical commits remain exportable after compatibility-mirror write failures,
that exported records are detached atomic receipts, and that reads require no
write permission or mirror repair. Unavailable/corrupt canonical state must
reject; a valid but old mirror is never an export fallback.

The existing `sukun-saved-session-guard-r1089` database, `guard/state` key and
schema remain unchanged. Exported Recovery JSON retains its existing format,
settings keys and fingerprint scheme. Exact restore and automatic replay remain
disabled. Normal JSON exports visible templates/favorites when locked; complete
portable exports refuse private templates, known private log/player payloads or
private recordings while locked. A change of private access during export
rejects the operation.

`site-export-privacy.cjs` exercises the actual site exporter in the retained
controlled byte/hash/ZIP harness. It holds a site asset read after personal
capture and verifies that revocation, revocation followed by reopening, and
unlocking cannot return or download the in-flight ZIP. The personal capture in
this isolated suite is explicitly synthetic.

`canonical-export-browser.js ROOT OUTPUT.json` is the native integration suite.
It uses a disposable Chromium profile, actual canonical transactions, existing
maintenance leases, actual JSON/Recovery exports, every deployment file and the
production ZIP exporter. It decodes the ZIP's first personal JSON member. A
labelled targeted localStorage quota failure, an observed native transaction,
one held native transaction, one held asset response and a final malformed
record expose failure/race boundaries. It does not replace production clocks,
audio completion or normal save behavior. Service workers are blocked; offline
and physical Android behavior are separate checks.

Run native coverage only against finalized byte-consistent shell/runtime/SRI
and inventory files, with other heavy browser suites stopped. The full ZIP case
reads the complete deployment and intentionally needs more memory/time than an
isolated test. Reports belong in the QA directory outside the repository.
