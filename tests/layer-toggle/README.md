# Frameless layer toggle candidate

User-selected visual alternative 2: a thin layered mark and short show/hide label below the reflection exit. No new control owner, listening event, persistence key, audio/count logic or artwork file is introduced. The existing native button is moved, never cloned; outside reflection it returns before the settings disclosure.

Production changes are confined to the layout module and two presentation stylesheets. Release metadata and SRI are finalized locally as r1246 for integrity testing. This is an unpublished candidate based on r1245 main 65f2144261e7a149dd2cc321ccd29f730369212d.

Read `tests/tefekkur-glass/README.md` for the focused checks. Run `python3 tests/r1213/run-current-checks.py --scope node --jobs 3 --output <evidence>` for the no-browser aggregate with playwright 1.57.0 and fake-indexeddb 6.2.4 available in NODE_PATH. Native full acceptance remains mandatory before publishing.
