# r1055 optional generic voice bank

```sh
node tests/r1055/generic-bank.cjs
node tests/r1055/generic-priority.cjs
node tests/r1055/generic-ui.cjs
python3 -m unittest discover -s tests/r1055 -p 'test_package_generic_recordings.py'
```

The bank fixture executes the production module with real SHA-256 hashing and
synthetic PCM/JSON bytes. Its controlled IndexedDB commits mutations only when
a transaction completes; aborted replacements retain both prior clips and
metadata. Validation, cancellation, preference/content epochs, storage
isolation, audio-only legacy import and export privacy are exercised directly.

The priority fixture executes the production recording lock and personal
recording store with a separate generic-bank endpoint. Existing personal
candidate forms, pending/failed reads and stale ownership must settle before
generic audio can be considered. Voice preferences remain authoritative.

These checks use synthetic bytes and controlled storage/media boundaries. They
do not verify a user's supplied voice archive or physical browser audibility.

The packaging tests reject incomplete or damaged multi-part backups before
replacing any output. They also execute the production bundled loader against
generated assets to verify metadata hashes and original audio bytes. The source
voice backup stays outside the repository; only validated sound assets and the
public generic-bank manifest are packaged.
