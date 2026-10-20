# r1118 recovered release acceptance, 2026-10-20

## Exact production provenance

The reviewed 2026-10-19 release update ZIP was recovered from its persisted Library copy after the execution workspace disappeared. Its SHA-256 is `ab5ac0ef57bc8a34ddbfa0017894e92a507179ea8934a0c0a14d2a7656c656bb` (4,832,843 bytes). Its 13 production files were overlaid on PR51. No production redesign was performed.

The recovered final shell hash is `87a220cd4731e6945acdc97bc9ab3a66af69fe700ee6a246dbfd82c401493fb8`; service worker hash is `c676072d3958d2878230ca92ab26adfa78d5978aa0c62a1d9551acc8313d10d2`. Build and site manifest hashes match the independently reviewed candidate. Source baseline is r1117 `5459587e2a4ce794683908c1b098076b3f2eb081`.

## Bounded scope

Three byte-identical CSS bodies (9,173 bytes) move to external assets with their existing owner IDs and ordering. See `tests/r1118/recovered-css.json`. Dynamic visual-reference tooling is reconstructed and freshly checked: 295 verified images, 182 mappings, 35 producer observations dispositioned. The 129 unresolved CSS observations remain explicit. This is not proof that all inline CSS should be removed, nor an exhaustive G8 completion claim.

The exact identity of the historically mentioned fourth recording/backup panel remains unverified and its production CSS remains inline. Physical Android, screen lock, audible quality and OS audio-focus acceptance are separate open gates.

## Evidence recovery

Original local test evidence and Git commit objects were lost with the workspace. Production files were recovered byte-for-byte; missing map and browser harnesses were reconstructed and rerun. Fresh results are stored under `tests/g8/evidence/recovery-20261020/`; map provenance is `tests/g8/recovered-map-results.json`. Historical PR51 results are retained as historical results and are not reused as fresh browser proof.

A browser setup failure and a CSS URL expectation failure are retained separately. The latter omitted the valid release query string in the test expectation; production was unchanged.

Final verification and publication status are recorded in `tests/g8/current-verification.json`. Until every final gate there passes and remote deployment is verified, this document alone does not claim publication.
