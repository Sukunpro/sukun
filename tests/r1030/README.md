# r1030 visible-shell follow-up

These focused suites cover the two visibility gaps found during r1029 live QA.

- `node tests/r1030/shell-recovery-visibility.cjs .`: 18 checks executing the shipped shell creation/navigation and recovery/ring code in a controlled DOM fixture. The original row moves intact into Simple/Focus normal flow and returns to its Classic footer position. No duplicate IDs, automatic opening, new storage writes or ring-handler changes.
- `node tests/r1030/visible-volume-labels.cjs .`: 25 checks for native channel-label associations, actual locale conversion and unchanged mixer/master input handlers. The existing dock range remains dhikr volume, not master volume or progress.

Final integrated run: 13 baseline suites, 430/430 checks; 18 targeted suites, 1531/1531 checks. Targeted totals include integrity/hash/syntax checks and must not be read as separate end-to-end device scenarios.

Cloud browser verification is separate. Physical Android scaling, audible playback, microphone capture, lock-screen/background behavior and actual recording durability remain unverified. The deliberate lower row stays hidden in fullscreen Tekke/Tefekkür; the independent `rescue.html` route remains available. This follow-up does not expand recovery or data-mutating behavior.
