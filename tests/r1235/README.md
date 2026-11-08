# r1235 frequency and navigation label fit

Scope: the approved Berhet frequency summary/value alignment and narrow-screen navigation label fit only. Tefekkür statistics, audio behavior, runtime logic, stored records and artwork are unchanged. The shell changes beyond the linked CSS SRI are generated release identity and notes.

Base: `ed81326583f408b518b32cc115fc35316a35cf41` (r1234).

## Checks

- `node tests/ui-audit/frequency-fit-center.cjs .`: 12 source contracts.
- `python3 tests/r1213/run-current-checks.py --scope node --output /path/outside/repo`: 66/66 passed on the finalized candidate; source bytes unchanged. Includes full release integrity and health-marker checks. This is not native/browser acceptance.
- The mandatory current-release workflow runs `--scope full` on the exact PR head, including source and native suites and the immutable pre-migration reference.
- `r1235-upgrade.yml` separately checks r1234 to current upgrade, exact cached offline runtime, synthetic counter/recording preservation, retained rollback, offline rollback, and return to current.
- `frequency-fit-center-browser.cjs` tests 320/393/1280 CSS viewports, six navigation labels, frequency text within bevels, repeated Enter/Space/Escape, native wave/PWM changes, exact served bytes, and runtime errors.
- Existing Klasik/Feyz and all other configured checks stay enabled.

Local raw Chromium cannot create sockets in this environment; the native tests must pass in CI before merge. Prior managed-browser mockup review covered 320/393/1280 and the same native controls on the unchanged approved CSS.

No physical Android/iOS, audible output, screen-reader, or text-enlargement acceptance is claimed. CI screenshots are synthetic, not private user data. Rollback validation exercises the existing supported service-worker recovery flow and does not restore or overwrite personal data.
