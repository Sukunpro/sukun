# r1226 candidate: current mobile controls and regression coverage

Base: d6fa859d0f632697ec130dc147b801cff279eb9a (live r1225).

This candidate is for review and testing; it does not authorize merging or deployment.

## Production change

The r1204 square navigation artwork paints inward by clamp(9px, 2.3vw, 13px), but the later active layout reserved only 2px horizontal padding. Mobile navigation now reserves the same space as its decorative frame. Six columns, existing themes/artwork and font choices remain. Narrow-screen wrapped labels may increase control height.

## Test changes

- Historical upgrade entry delegates to the existing version-aware eight-case native Chromium suite. The workflow retains the immutable r1148 baseline, validates the current manifest and exact runtime hashes, preserves synthetic counters/recordings, and tests offline reload and rollback. No version assertion is skipped.
- Visual tests reflect the current composite hero, six-column navigation and centered responsive dock. Intentionally non-painted accessible text is tested semantically rather than as visible artwork.
- Backup tests navigate through the actual user controls before measuring the visible backup panel.
- Navigation keeps strict text/frame containment, touch-size, locale, enlarged-label, sticky positioning and keyboard/interaction coverage.
- Expected case counts and failing case details remain explicit; tests fail rather than silently skip missing controls.

## Verification

Run current source checks with `python3 tests/r1213/run-current-checks.py --scope node --output /tmp/fresh-r1226-node`.
Native Chromium verification runs in the pull request workflows. Check the exact candidate SHA and artifacts; the initial r1225 failures are not candidate results. Physical phone, TalkBack, Bluetooth, microphone acoustics and lock-screen acceptance remain untested.
