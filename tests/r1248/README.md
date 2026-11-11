# r1248 — Native journey buffering and event order

Builds on the existing `b9b5eb8` buffering patch. A recently advancing native
recording receives a bounded grace period at a buffering boundary; repeated
`playing` notifications cannot extend it. The health report separately records
application watchdog retirement instead of classifying it as a normal stop.

The integrated changes also preserve already-observed loop progress when
`timeupdate` precedes `seeking`, reject count credit from explicit seeks, and
avoid a startup timeout stopping the same advancing native source while its
playing notification is delayed. Startup progress must belong to the exact
caller and source, with no intervening seek or user/ownership hold.

Regression coverage includes both 28 and 99 journeys, transient buffering,
permanent stalls, duplicated native events, source/caller changes and explicit
Pause/Stop. The r1248 workflow executes the full app's native loop boundary
browser tests; the current release workflow additionally verifies updates,
offline use and rollback. Evidence is produced by each run.

Controlled event/timer tests and desktop Chromium do not establish physical
Samsung screen-lock, Bluetooth routing or subjective audio continuity.
