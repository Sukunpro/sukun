# r1080 Berhetiyye gate verification

The portal uses its own dialog, animation epoch, abort controller and audio engine. Authentication and session revocation belong to the configured access adapter. These browser suites load the actual full application and portal assets. A synthetic adapter replaces the access-adapter global in the isolated profile, so the real entry bootstrap retains the same test adapter across hydration; it provides test access without reading or exposing a real device PIN, vault password or premium token.

```sh
node tests/r1080/portal-browser.js . tests/r1080/evidence/portal-browser.json
node tests/r1080/portal-playing-browser.js . tests/r1080/evidence/portal-playing-browser.json
```

The final commands require the production shell to load the gate and mount its actual entry card; no script injection or replacement entry is accepted. `SUKUN_PORTAL_PREINTEGRATION=1` permits explicitly labelled engineering loading before integration, and is not used for release evidence.

`portal-browser.js` covers Classic/Feyz at 320×640 and 390×844: actual entry placement, contemplation visibility, native dialog and keyboard input, focus restoration, show/hide, blank input, extension without losing text, incorrect password counsel and concealment, timeout, network failure, asynchronous verifier cancellation, authenticated mechanism/skip, short reentry, ordinary close versus session-only locking, explicit enter, English labels, reduced motion and browser Back. The 45-second expiry and 8-second cooldown cases use a labelled wall-clock offset with native browser timers; verifier nonresponse waits for the actual 15-second timer. Reports contain no typed password or access token.

`portal-playing-browser.js` starts the shipped 128-second Ayatul recording through the existing protective smart player. It compares the same native audio element/source, progressing playback clock, unchanged queue/counters/theme, and original play/pause event observations while the portal opens, plays optional effects, unlocks, closes, seals and rejects a wrong password. The shipped Turkish invitation MP3 is explicitly started through its native button; real playback progress, live range volume, effects-mute cancellation and close cancellation are observed while the original Ayatul remains unchanged. The actual production entry card opens through the native Okumalar control while protective playback continues. The synthetic `enter` callback remains inert so it cannot replace the current selection or recording.

These tests use isolated Linux Chromium profiles and exact served bytes. They do not establish paid membership security, real Android screen locking, Samsung Internet/Firefox/Safari behavior, audible quality, or completion of the full protective sequence. Release metadata/SRI/inventory verification and the existing source-regression suite run separately.

The default device adapter also has a separate exact-production integration suite (`access-browser.js`). It seeds only a labelled test PIN in a new browser profile, then exercises the existing configured-PIN verification, canonical Berhetiyye selection/theme, count-preserving reentry, session-only lock, and wrong-password counsel without replacing the access adapter.

Focused source checks:

```sh
node --test tests/r1080/access-adapter.js tests/r1080/provider-client.js tests/r1080/provider-server.js tests/r1080/health-portal.js
node tests/r1080/queue-privacy.js
node tests/r1080/portal-lifecycle.js
node tests/r1080/access-browser.js
```

Queue privacy checks execute the extracted production lock and queue code. They cover non-destructive concealment, reload, public edits, exact foreground ownership, stale voices, legacy lock compatibility, and no autoplay. Health checks retain the existing 8 MiB core/32 MiB media budgets and admit only exact shipped portal paths with matching hashes. The invitation has its own 500000-byte ceiling and belongs to the existing media budget.
