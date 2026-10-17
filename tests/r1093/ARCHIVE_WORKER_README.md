# Archive staging worker contracts

`archive-worker.cjs` executes the complete shipped `sw.js` in an isolated VM.
Only CacheStorage and network leaves are controlled; native Request, Response,
Headers, abort signals and SHA-256 are retained. The test never implements its
own archive predicate or dispatcher and reads no user data.

Run from the repository root:

```sh
node tests/r1093/archive-worker.cjs .
```

The suite verifies strict opt-in canonical manifest/audio routing, zero cache
access on accepted staging fetches, no current/historical fallback on network
failure, HTTP-error passthrough, native Request credentials and cancellation,
and retained runtime hash/art/ordinary routing for unrelated marked requests.
The stage-status message reads only recovery state and refuses pinned or
unreadable recovery state. Stage transfer is not a cache purge.

This controlled suite does not prove browser-worker installation, real quota,
network behaviour on Android, audible playback or physical device locking.
Native installed-worker archive/cache evidence is recorded separately.
