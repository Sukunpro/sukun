# r1089 — command, template and presentation consistency

This release repairs the seven findings from the r1088 read-only audit.

- Navigation continuation belongs to its token, queue, index and step. A later
  Pause, Stop or replacement retires it. A newer navigation inherits only a
  still-current continuation, including asynchronous source preparation.
- Saved templates, favorites and their revision live in one authoritative
  IndexedDB record. Each mutation reads and writes that record in a single
  readwrite transaction; localStorage is a compatibility projection. This
  storage boundary does not claim the audio owner lease.
- Saved/favorite activation reads the current authoritative record by identity
  and rechecks access and the user's current intent after that read.
- Smart source preparation is a read-only receipt around the caller's existing
  source-onset notification. It does not schedule audio or credit a reading.
- Portal narration considers independent-reader preparation; superseded media
  rejections and revoked grants cannot leave a newer presentation stale.

Node `*.cjs` suites exercise shipped functions and module contracts. Browser
`*.js` suites use disposable Classic/Feyz Chromium profiles and preserve the
native media clock. The IDB fixture helper is not a standalone suite.

Fault-injected HTTP delays/errors, generated PCM recordings and controlled
speech/adapter/Promise inputs are labelled in each report. No physical Samsung,
Android lock-screen, Bluetooth or audible-quality claim is made. Release
verification records frozen source hashes and the completed test scope.

The cross-tab persistence test awaits every mutation, then reloads a page and
checks all expected records and favorites against the authoritative database.
A successful in-memory or localStorage-only assertion is insufficient proof
of persistence. Legacy migration uses a fresh database; normal writes must not
reimport a stale compatibility projection.

A committed canonical write remains successful if the compatibility mirror
cannot be written; a later refresh can repair that mirror. An aborted canonical
transaction returns failure, does not advance the cache, and never publishes
the rejected data into a bootstrap mirror.
