# r1076 protective original native audio

Protective recitations whose optional PCM effects cannot be prepared may use
the verified complete original in the existing single native media transport.
Admission requires a positive source duration meeting the requested interval at
the selected rate. Accepted native metadata owns the exact media unit and
cycle: no absent 40 ms gap, guessed wall-clock repeats or extra echo elements.
Non-protective and too-short originals retain their existing safety gates.

Run from the repository root:

```sh
node tests/r1076/protective-original-contract.cjs .
node tests/r1076/protective-original-browser.cjs . /tmp/r1076-native.json
python3 tests/r1049/run-regressions.py --output-dir /tmp/r1076-regressions
python3 tests/r1049/run-regressions.py --static-only --output-dir /tmp/r1076-static
```

42/42 controlled source contracts, 16/16 isolated native Chromium checks,
120/120 regression groups and 1,272/1,272 static integrity checks passed.
The browser verifies same-element/source/cursor continuation over simulated
hidden/visible transitions, Pause/Resume, Stop/name cancellation, actual short
loop credit and selected-session error presentation. Long source bytes are the
shipped Ayatul MP3 aliased to two private fixture keys solely to test transport;
they are not asserted to contain Kalem recitation. Short input is generated WAV.
No user recordings or profile are used. Optional FX/cadence availability is
controlled only for the short-input test; media clocks remain native.
Physical Android locking, OS focus and audible quality remain unmeasured.
