# G8 current bounded candidate: r1119

## Published baseline and provenance

r1118 was published in [PR52](https://github.com/Sukunpro/sukun/pull/52), merge
`6ef3b9cca3d7b8c737b5656737ea683effe74e7f`. The Pages deployment
[39369077543](https://github.com/Sukunpro/sukun/actions/runs/39369077543)
succeeded, and all twelve checked live files matched the reviewed local bytes.
This later publication evidence supersedes the **publication status only** in
the frozen r1118 recovery records; those historical results are not rewritten.

r1119 is an isolated, unpublished candidate based on those same r1118 production
bytes. Nothing in this candidate changes the current live site.

## Exact change and non-goals

The inline owner `sukun-r1018-recording-panel-layout` moves to
`assets/runtime/recording-panel-r1119.css`. Its 2,126 UTF-8 bytes are unchanged:
SHA-256 `09f351325cc8b0f1366a1ff9b9246fa50b56573d48f1e9fc0dfc403931b0a941`.
Its ID, source position and unlayered cascade are preserved. It has no `url()`,
`@import` or `var()` references. The preceding `r999-locale-labels` and following
`sukun-r1018-locale-notes` owners stay in place.

This is a newly bounded recording/backup panel step, **not proof of the identity
of a historically lost fourth panel**. It is the fourth extraction in the recent
bounded group and ninth overall, totaling 32,821 moved bytes. These totals are
not a percentage of the app's modularization and do not require all remaining
inline styles to be removed.

In addition to the CSS move, release identifiers, notes and their four English
dictionary entries, inventory, SRI, mandatory worker resources and the existing
startup audio URL's version query change. Two dictionary entries fill inherited
r1118 note translations; the frozen r1118 source and evidence remain untouched.

The new required CSS is runtime member 129. A broad controlled regression caught
the health scanner's existing 128-entry cap rejecting the new valid manifest.
Its one constant is raised to **129 exactly**, with tests requiring 129 verified
entries to pass and 130 to fail closed before any asset download. Independent
review also caught an inherited 32 KiB marker-response limit below the actual
41,664-byte shipped marker. The marker reader now has a bounded 64 KiB limit.
The new exact-byte suite verifies the complete shipped marker without compact
substitution, accepts a valid 65,536-byte marker, rejects declared and streamed
65,537-byte markers before asset requests, and retains timeout/invalid-JSON
behavior. The older aggregate now also serves the full original marker bytes.
The 9 MiB core budget, 32 MiB media budget, resource allowlist and two-worker
limit are unchanged. These are diagnostic compatibility changes, not unchanged
runtime JavaScript.

Recording storage, schemas, recovery authority, event handlers, counters, media
assets, audio timing and playback code are unchanged. Automatic recovery and
exact full-data restore remain disabled; unsafe r1019 rollback remains blocked.

## Evidence and acceptance

The authoritative current candidate evidence manifest is
`tests/r1119/verification.json`. Counts there keep source, controlled VM,
browser and service-worker evidence separate. Authored but unexecuted tests are
not passing tests. Initial setup errors and corrected reruns are retained as
separate evidence.

- Exact byte/ownership contract: `tests/r1119/recording-panel-contract.cjs`.
- Final release SRI/inventory/syntax: `tools/release-integrity.cjs`.
- Current map: `tests/r1119/visual-reference-map.json` and four map suites.
- Prior G6/G7 and bounded CSS source contracts: fresh candidate evidence.
- Original supported r1048 aggregate range: isolated controlled fixture runner;
  superseded fixtures remain explicitly excluded, not silently passed.
- Native panel matrix and visible ambience flows: current browser reports.
- Native upgrade r1118 to r1119, offline reload, supported rollback and return:
  synthetic WAV clip and counter only, no personal data.

The legacy `r917SceneInfo` panel is inside `r883JourneyRemote`, which the active
r920 practice CSS deliberately hides. A zero-sized comparison is not visual
acceptance. Current reachable scene/explanation controls must be identified and
exercised separately; this CSS relocation does not authorize re-enabling a
retired interface. The 129 unresolved CSS observations remain diagnostics, not
confirmed defects or permission to delete assets.

## Executed coverage and preserved limitations

The completed panel comparison covers 128 presentation states: 320, 390, 430 and
1,280 px widths; Klasik/Feyz; Esma/Berhet; Turkish/English; expanded/collapsed
explanations; normal and 24 px long synthetic text. All 271 checks pass, including
2,816 matched node observations, 44 px targets, row separation, no overflow,
keyboard/repeated disclosure actions and disposable synthetic-recording inspection.
Protected family unlocking is not part of these presentation permutations.

The final native release rerun passes worker upgrade/offline/rollback 8/8, audio
7/7, selected frequency 6/6 and ambience 8/8. Frequency and ambience here use only
390×844 Turkish, not their collectors' broader default profile descriptions.
The expanded flow report passes 32/32 checks across four actual profiles:
390×844 Turkish and English, 320×740 Turkish and 768×1024 English. It covers
reachable full catalogue/Ready sessions, mic-note preference with two reloads
per profile and scene-picker/Name explanations. The two 390 px profiles also
cover native bundled-audio owner continuity versus explicitly controlled device
TTS; physical speech voices and audible output are not measured.
A dedicated Full/Ready mode switch was not found or invented.

English presentation equivalence is not a claim of complete translation. These
inherited labels remain Turkish in both r1118 and r1119: `#r187RecRescan`
(“Kayıtları yeniden tara (geçici olarak durduruldu)”), `#r1017RecInspect`
(“Kayıt deposunu kontrol et”), `#r1011VoiceRestoreHint .yonergeKulak`
(“Kısalt” / “Açıklamayı göster”), and `#ydkSetReset`
(“Yedek seti takibini sıfırla”). The English large-text screenshots retain this
baseline behavior; translation cleanup is outside this CSS-preservation change.

## Remaining gates

Even successful Linux Chromium checks do not establish physical Android/PWA
screen lock, background continuity, Bluetooth or OS audio focus, audible quality,
or real microphone/recording behavior. Those require a controlled user-device
session and appropriate permissions, with existing recordings preserved.
The non-destructive case sheet is `R1119_DEVICE_ACCEPTANCE.md`; all its cases
are explicitly NOT RUN, not inferred from browser results.

Publication requires review, an appropriate fresh-main check, permission
to publish, exact-commit CI/Pages success and live byte/version verification.
r1119 is not published by this engineering task. Global G8 remains open until
its bounded completion decision and separate physical-device gates are explicit.
