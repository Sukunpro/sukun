# r1095 genuine worker and complete app acceptance

`image-pack-browser.js` has a deliberate expected **18 groups**. It creates an
isolated Chromium profile and its own byte-for-byte HTTP server, installs the
actual current worker, and loads the complete production application. It does
not modify `tests/r1064/browser-fixture.cjs` or production source.

Run only after the r1095 HTML tags, runtime graph, manifest pin and worker have
been prepared consistently. The first check deliberately rejects an r1094 graph.

```bash
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules \
CHROMIUM_PATH=/tmp/sukun-browser/chromium \
node tests/r1095/image-pack-browser.js \
  /workspace/scratch/4d4bf78d764e/sukun \
  /workspace/scratch/4d4bf78d764e/qa-r1095/native-draft/image-pack-browser.json
```

The parent release runner must use a fresh post-freeze report path and its
guarded wrapper for acceptance. Draft output is diagnostic only. One complete
Phone preparation is 130 files / 54,207,708 bytes; All then adds 34 original
fallbacks, reaching 164 files / 157,661,812 bytes. Five navigation images totaling
5,933,032 bytes stay in the required core cache and must not be duplicated into
the optional image cache. Bounded fault repairs fetch only the selected affected
original files. Reserve one browser slot and avoid another heavy suite at once.

The groups verify exact manifest/local bytes; installed verified worker and no
automatic package operation; locked public inspection; stale and cross-client
tokens/source admission; complete Phone and All independent CacheStorage hashes;
missing/corrupt resume; HTTP truncation and cancellation; native-worker quota and
cache-read failure seams; required-core corruption; private lock/ABA; controller
signals and actual client departure; actual offline scene/wheel resolution;
trusted package persistence/native DOM stability; TR/EN at 320/390 with measured
normal and 200% text; and strict final provenance/error/request accounting.

All normal same-origin requests use native HTTP. Exact armed server faults have
unique server IDs and actual browser Request IDs, expected error codes and a
phase boundary. An unknown request failure remains blocking. The offline check
enables both Chromium offline emulation and a server socket-denial gate; failures
are accepted only for known package artwork, the exact check phase and recorded
request IDs. The suite retains original error observations and native server
receipts in its report. Every normal native response carries a unique diagnostic
response ID header so an actual browser Request can be paired with the exact
server bytes/hash/finished-response receipt without changing its body.

Separately classified worker `ERR_ABORTED` observations establish artifact
readiness only. Their cause is not established and they are not reported as
successful HTTP completion. Acceptance requires an exact known phase, original
URL/query and Request ID; a unique finished native server response receipt; pinned
graph/site-inventory and current local bytes/SHA; and a fresh independent read of
the exact current CacheStorage entry with matching SHA and byte count. Explicit
fault Requests are excluded from this classifier. Page-owned aborts, unknown
URLs, missing response receipts, other codes and mismatched cache bytes block
acceptance.

The held late-client departure check has a separate original-consumer proof. It
requires exactly one current native worker Request and matching response/server
ID; the finished original server body; the original production reader's EOF,
full byte count and SHA; unaborted signal at fetch, response, EOF and after drain;
a drained worker job; and independent absence from the current optional cache.
The transparent audit forwards the original native fetch/read promises and does
not consume a second body. An exactly matching `ERR_ABORTED` observation, if
present, would prove original-body consumption and no cache admission only; its
cause and CDP transport completion remain unestablished. In the accepted final
run this particular Request completed normally, so the conditional abort branch
is not claimed as exercised by that run. Unknown identities or missing proof
remain blocking. This does not change the separate cached-artifact readiness
classifier or admit explicitly armed faults into that classifier.

Offline allowances cover only the catalog-selected full scene, its preview lite
image and selected wheel, in the exact offline phase with fresh known worker
Request IDs and independent saved-byte verification. An empty response also
requires an exact fresh native socket-denial receipt. The actual full scene and
wheel each must issue both a new client image Request and a new worker Request;
their resolved IDs/assets/families and absence of fallback are asserted.

Quota/unreadable-cache tests explicitly patch a native `Cache` prototype method
on the genuine installed worker for one exact original URL and restore it after
the check. The worker implementation, protocol, scheduling and other storage
operations remain real. Deliberate corruption/deletion stays in disposable test
CacheStorage. A labelled private-access grant affects that disposable profile.

Headless Linux checks do not establish physical Android behavior, OS accessibility
scaling or native OS picker layout, codec/audible quality, real microphone use,
device TTS, or screen-lock behavior. Text scaling doubles each measured computed
font size and asserts the resulting sizes before checking wrapping and overflow.
