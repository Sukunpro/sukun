# Deliberate recovery entry

The ordinary row is now 🛟 ❤️ Kalp huzuru niyetiyle [the existing ring].
The 44px native rescue link is a sibling of the unchanged seven-click ring.
It opens the existing data/version recovery dialog only on activation. If that
runtime is unavailable, its ordinary href opens the independent rescue page.
Modified link clicks retain native new-tab behavior.

No floating recovery button is created. The data panel is mounted only inside
a hidden dialog, rather than in home/backup tools. Initial loading, a journal
error and a genuinely pending operation never open it automatically. Existing
pending-operation blocking is retained, with a narrow exception for the native
rescue link. Escape/Close keeps the dialog hidden and returns focus to the icon.
A native independent-rescue link inside the dialog remains usable even if the
version runtime fails or disables its controls.

The static page now includes a deliberate personal-data recovery choice:
`index.html#sukun-data-recovery`. This requests the dialog only, waits for the
recovery runtime to mount if necessary, and consumes the hash using history
replacement so dismissal is not undone by refresh or Back/Forward. It does not
restore, acknowledge, delete, migrate or reset anything. If the recovery runtime
cannot load, the static page's version choices remain the separate fallback.
The panel uses the existing data-hep-acik startup-sweep exception, while explicit
Close still closes it normally. The hidden 1.2-second SÜKÛN title hold is unchanged.

## Verification

```sh
node tests/r1029/recovery-deliberate.cjs
node tests/r1027/recovery-entry.cjs
```

- Deliberate entry: 27/27 controlled scenarios. Exact production scripts run
  against synthetic DOM, timer and readonly IndexedDB endpoints. Coverage:
  loading/idle/pending/error silence, explicit click/keyboard activation, pending
  click-gate escape, dialog Escape/Tab behavior, repeated use, broken-main native
  fallback, modified clicks, TR/EN labels, static-page intent and dismissal,
  longpress, the actual immediate/DOMContentLoaded and delayed startup accordion
  closer after early explicit data intent, ring count isolation and byte-identical ring/storage implementations.
- Existing independent entry and static rescue: 28/28.
- Adjacent recording/input/finish/owner/unavailable, import-maintenance,
  persistence-model, startup-intro and locale suites also rerun successfully.
- `index.html` and `nero.html` match. Changed external scripts parse.

These are controlled checks, not real-browser, physical-phone, touch, audible
playback or real-data recovery evidence. The updated optional
`tests/r1027/recovery-browser.cjs` is not run here: the existing Chromium socket
permission blocker was respected and no alternate launch was attempted.

## Manual browser verification

Live smoke targets: `#sukun-heart-intention`, `#sukun-rescue-link`,
`#vaultTrigger`, `#r1019RecoveryEmergency`, `#r1019DataRecovery`,
`[data-emergency-close]`, `[data-independent-rescue]` and
`[data-sukun-recovery-title]`. There must be no `#r1019RecoveryOpen` node.
Inspect ordinary load with no dialog; activate 🛟; Escape; activate again; use
native link navigation when main code is unavailable; check TR/EN labels and
footer wrapping; verify title hold and that six ring activations plus any rescue
activation do not unlock, while the seventh ring activation does after its
unchanged delay. Actual pending/error states may be tested only through allowed
fixtures, not by tampering with a user's stores or bypassing safety gates.
