# Atlas button frame — r1071

The shared practice path styled every direct button with a zero border and a transparent background. In the 99 Names view that removed the Atlas button face. The rule now excludes `#r920AtlasOpen`, allowing its existing framed face to render. Berhetiyye retains its emerald material, and the native button, event handlers, focus return and touch target are preserved.

The shared practice also disables the obsolete `#tab-zkr::before` backdrop. Its negative inset added four pixels of invisible horizontal overhang. The change applies only while `body.r920-practice-on` is present; legacy rendering outside the shared practice keeps its backdrop.

Release identity, intro WAV query, shell SRI, service-worker runtime inventory, backup inventory, manifest and translated release notes are synchronized as r1071. There are no session, recording-store or playback behavior changes in this release.

Validation evidence is in `tests/r1071/evidence`:

- Static identity, syntax, SRI and file/hash integrity: 1,267/1,267 assertions; all 698 deployment inventory entries match.
- Atlas baseline reproduction and candidate verification: 26/26 each at 320×640 and 390×844. The baseline confirms the absent Esma border/background; the candidate confirms their restoration, unchanged 120 px button width, native open/close, focus return, unchanged session state, Tefekkür visibility and bounded geometry.
- Fresh final Classic/Feyz smoke: 26/26, including native picker/pan, control-tree preservation, dock modes and a generated personal WAV advancing on the native media clock without TTS fallback.
- Current background controller cases, bundled Arabic lookup/integrity and health media integrity pass. The optional historical r1058 background-route comparison is explicitly skipped when that archived baseline is absent. Current health tests use the shipped active manifest hashes as expectations.
- Fresh complete retained regression run: 117/117 groups passed, including the full production export fixture.
- Independent scoped code review found no blocker.

The final shell SHA-256 is `2c14d2bbc45e92524f843ec2055656a5135f7f632b22e6a5ded7ea70fa73cfa1`. Atlas evidence uses trusted mouse clicks in mobile viewports; the smoke suite additionally uses native touch delivery. Both run in isolated Linux Chromium with service workers blocked. Physical Android screen locking, speaker audibility and real client service-worker activation remain unverified.

The deployment-only full ZIP contains 699 files, 291,421,074 bytes, SHA-256 `24d88b91e884dc9f027679eac37134634e170d2da6ee7a151fb0662e89735051`. The update ZIP contains the 10 changed production files for an existing complete r1070 installation; it is 4,675,652 bytes, SHA-256 `78ebade38200bea6e486734a7b1c84e169855cee4a3aec7d280514f41c231a59`. Neither package contains user recordings or test fixtures.
