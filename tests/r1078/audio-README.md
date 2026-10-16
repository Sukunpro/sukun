# r1078 manual protective audio and target loops

`manual-reading-loop-browser.cjs` serves production bytes in an isolated Classic/Feyz Chromium profile. Trusted clicks exercise the original Ayatul button, the fixed manual wheel counter, actual wheel Finish, easy local Pause/Resume, and the card loop control. It uses the shipped 128-second Ayatul recording and real native media clocks; short generated tones are transport fixtures only.

The native cases cover matching reader stop and cursor-preserving resume; manual-tap stop without credit; exact finite and unlimited targets; incomplete-loop pause with replay on Resume; cancellation on selected-name changes; preservation of an unrelated Yasin reader, ambience and frequency; and Stop while prior asynchronous cleanup delays a new loop. Native lease retirement after explicit cancellation also permits the next manual tap. Physical Android locking, audible output and Android gesture permission behavior are unmeasured.

`reader-resume-permit.cjs` executes the production resume-authority and explicit-stop closures with bounded leaves. It checks same-source/same-lease paused-reader renewal and rejects changed sources, leases, owners, settings/current guards, terminal stop, replaced attempts and pool removal. Exact explicit retirement rejects non-opted-in, mismatched, replaced, unrelated and still-playing native leases.

Run with `node tests/r1078/manual-reading-loop-browser.cjs ROOT OUTPUT` and `node tests/r1078/reader-resume-permit.cjs ROOT`.
