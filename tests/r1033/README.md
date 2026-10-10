# r1033: independent startup visual

The logo uses an immutable CSS timeline: a 1000 ms preparation delay followed
by the original 1300 ms exit and unchanged logo/light keyframes. Audio loading,
missing safety APIs, or an expired audio attempt must never skip this visual.
This supersedes the readiness-controlled visual design documented for r1032.

The optional audio module loads asynchronously. It may schedule one unchanged
650 ms hit only during the real CSS visual window, with all safety sources
known idle. Unknown animation timing, denied/late resume, input, recording,
active playback, or another owner cannot enable or postpone a later hit.
No user storage is changed and no browser autoplay policy is bypassed.

Run from the repository root:

```
node tests/r1027/startup-intro.cjs
node tests/r1031/startup-intro-async.cjs
node tests/r1032/startup-intro-readiness.cjs
node tests/r1029/transparent-intro.cjs
node tests/r1028/media-artwork.cjs
node tests/r1029/cinematic-containment-regression.cjs
node tests/r1027/release-integrity.cjs
```

The evolving r1032 timing suite now covers the corrected independent visual,
including the observed 1199 ms warm and 2779 ms cold module arrivals. A cold
late load must show the logo while leaving audio silent. These controlled
fixtures are not browser pixel, physical Android, or speaker tests. Verify the
actual logo animation and automatic exit after deployment. A `scheduled`
diagnostic proves scheduling only, not audibility.
