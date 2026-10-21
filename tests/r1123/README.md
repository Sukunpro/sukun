# r1123: dhikr previous/next routing

Based on released r1122 commit `0060e0a3ce2df94c6dbb7dc5c425080cc1de6cc7`. The narrow production change fixes local dhikr previous/next routing when the selected item has zero count or is stopped. It must preserve active journey/smart ownership and must not navigate an unrelated ambience/frequency player.

## Required source-bound acceptance

From a real Git checkout, with Python, Node and Playwright 1.57.0:

```bash
python3 tests/r1123/run-release-checks.py --baseline /path/to/r1120-checkout --upgrade-baseline /path/to/r1122-checkout --output /path/to/fresh-evidence
```

The general regression baseline remains immutable `7b25996c9d545a3732d758136342da893bba6ed4`. The real service-worker upgrade/offline/rollback baseline is immutable r1122 `0060e0a3ce2df94c6dbb7dc5c425080cc1de6cc7`.

The existing workflow at `.github/workflows/r1122-release.yml` is generalized to select a supported current-release runner; its legacy filename does not restrict acceptance to r1122. Unsupported versions, missing runners and missing upgrade suites fail, never silently succeed. The r1123 runner requires exactly 22 unique groups: all 20 previous categories plus `dhikr-navigation-route-contract` and `dhikr-navigation-browser`. The route contract's historical folder is r1122; it reads the supplied current source and does not substitute saved results. The old r1121 workflow is historical, not current-release acceptance.

Production, test and helper bytes are hashed before execution and checked unchanged afterward, with exact Git commit/tree identity. Child failure, missing evidence, zero completed checks, incomplete counts or a fatal result fails acceptance. Uploaded evidence contains synthetic JSON only, not screenshots, private logs, personal recordings or credentials.

## Limits and retained history

Controlled routing uses exact shipped command and button-handler JavaScript with declared synthetic seams. Browser acceptance is separately required. Simulated visibility does not establish actual phone screen locking. Physical Android/iOS, OS background eviction, Bluetooth, telephone interruptions, subjective listening and acoustic/hearing-safety acceptance are not run here.

Historical suite counts overlap and must not be added. Four superseded handoff assertions are not passes; one unavailable older baseline comparison remains explicitly skipped. A historical headroom startup-dismissal fixture has an observed visibility/click race; r1122 recorded its failed zero-case attempt rather than counting it as a pass. No force-click, assertion weakening or skip is authorized as a workaround.

No user-data reset, schema migration, permission expansion or credential change is part of this release. Existing slow-network shell-download budget and cross-tab saved-set atomicity limitations are unchanged.
