# r1106 validation

The focused fixture executes the actual shipped mixer renderer, accordion/card
helpers, recording-button binding and microphone-notes preference code in a
labelled controlled DOM/EventTarget environment. It checks original node and
handler ownership across initial load, add/rename/delete and repeated renders;
placement outside the closed custom accordion; preference/listener retention;
focus restoration without scrolling; and declared heading contrast/help markup.

```sh
node tests/r1106/ambience-layout.cjs .
node tools/release-integrity.cjs .
```

Results: 20/20 focused checks, 172/172 separate generic Node groups and
1466/1466 release identity, syntax, SRI and deployment-byte checks.

These are not native browser or screenshot checks. No browser geometry,
physical Android, microphone hardware or audible-output validation was run.
Chromium was unavailable in the release environment. Exact tested source,
report and deployment package hashes are recorded in verification.json.
