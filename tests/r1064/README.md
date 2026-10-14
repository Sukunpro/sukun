# Arabic original, meaning and source selection

Run the production-source suites with the coherent release directory:

```sh
node tests/r1064/arabic-chunks.cjs /path/to/release
node tests/r1064/yasin-data.cjs /path/to/release
node tests/r1064/catalog.cjs /path/to/release
```

The chunk suite executes the shipped Unicode splitter and checks full-string
conservation across Arabic-only paragraphs, diacritics, mixed scripts,
punctuation, honorific boundary signs and the distinct short/combined dhikr.
The old r1063 splitter fails the long Arabic and honorific boundary cases.

The Yasin suite compares every one of the 83 displayed Uthmani verses, spoken
Simple verses and historic Turkish meal lines to independent chapter hashes
calculated directly from downloaded source rows. It also checks verse order,
separated basmala, attribution, redistribution notices and immutable data.
The catalogue suite executes the shipped matcher with actual canonical source
expressions and checks retained categories/forms, 101 opening divine names,
200 Prophet names, all ten Delail sections, unchanged legacy text and explicit
source-pending variants. It forbids storage and canonical text writes.

Run the separate full application integration with Playwright and Chromium:

```sh
NODE_PATH=/path/to/runtime/node_modules CHROMIUM_PATH=/path/to/chromium \
  node tests/r1064/full-app.js /path/to/release /path/to/qa/r1064-app-integration.json
```

`browser-fixture.cjs` serves the release HTML, JavaScript and CSS byte-for-byte,
with active SRI. It uses fresh isolated local Chromium profiles and native
synthetic WAV recording stores. Only the device speech voices, utterance
completion and speech errors are controlled fixtures. The application policy,
source selection, controls, registry ordering and native recording playback
execute the real release code. Reports contain hashes of every loaded code
asset and fail if source bytes changed during testing.

The full-app check covers Classic/Feyz, 320/360/390 px layouts, native source
selects, optional meaning, TR/EN labels, Arabic/meaning isolation, Yasin full
ordered speech, seek/repeat, Pause/Resume/Finish, preparation holds, aggregate
controls, live reader identity, missing or unknown-gender voices, native
personal/generic source provenance, Delail meaning recording isolation,
preference persistence and unchanged personal WAV hashes.
It also checks five rapid read/restart cycles and eventual native Web Lock
release, then uses a second actual app tab to verify foreign lease denial.
Local reader Pause and Finish preserve the same accepted background media URL,
advancing native playback clock and AM/FR/FR2 graph identities after 220/300 ms.
The only media-start exclusion is the exact marked application silent carrier;
its native WAV samples are separately checked to be digital zero.

The native background media check runs with the page visible; hidden-page
software cases belong to the separate existing regression suites. These
headless Chromium checks do not prove physical Android locking, actual device
voice availability, audible speaker output, tajwid or printed-edition scan
comparison. The release's existing scoped-dhikr and background suites remain
required; persistence across the actual service-worker update is separately
tested by `tests/r1021/persistence-browser.cjs --update-root`.
