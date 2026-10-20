# G8 dynamic visual reference decisions

Recovery note, 20 October 2026: the adapter, integration and tests were reconstructed from the previous task's retained implementation and exact producer/consumer SHA-256 gates after workspace loss. No prior output-file hashes were available to establish byte-identical recovery. This report and map are freshly generated and verified against the recovered production tree.

## Reviewed coverage

The map preserves uncertainty rather than requiring zero unresolved observations. It is a maintenance map, not proof that all runtime branches execute or any asset can be deleted.

`tools/dynamic-visual-map.cjs` adds 94 relationships to the original 88 selection mappings. All 182 targets must match current inventory bytes.

- Esmâ: ten choices (nine generated scenes and classic), each with main and lite/fallback paths: 20 relationships. The 99-index automatic policy cycles five reviewed calm scenes; invalid selections/indexes fall back to classic. A labelled controlled-VM test independently compares the production catalog and all 99 indexes. The tool never executes application source.
- Portal: six image names resolve relative to the shipped portal script, with the reviewed document-relative fallback base. Relocating that script outside the shipped layout is outside scope.
- Berhetiyye: 28 named scenes and six fixed choices each have original fallback and thumbnail relationships: 68. Primary/mobile selections remain separate; distinct variants are not asserted byte-equal.

The exact four producer/consumer hashes appear in `dynamicVisuals.coverage`. Any source change, including a comment, reopens review and withholds the affected mappings. Gates bind the Esmâ/portal modules and individual r914/r853 script bodies, never the whole shell or release notes. This conservative adapter does not pretend to parse arbitrary JavaScript.

## Observations retained

All 35 original observations remain under `unresolved`; per-source dispositions and current source hashes appear under `dynamicVisuals.decisions`.

- Six unique directory observations belong to mapped Esmâ, portal and SceneEngine producers. SceneEngine decisions are bounded to the reviewed script's location.
- Four generic-recording/Arabic-audio directories are nonvisual observations, not claims of complete audio dependency coverage.
- Twenty-five historical `../scenes/berhetiyye/...` spellings occur inside the reviewed atlas. Actual runtimeAsset, original fallback and thumbnail targets are separately validated. Historical spellings are neither silently resolved against document root nor removed.

Zero undispositioned observations in this scanned set does not mean zero unknown runtime paths. The 129 ambiguous/unknown CSS variable observations remain explicit; many are ordinary paint values, not proven missing images.

The 79 noninventory quoted candidates include three filename suffix fragments and historical jewel styles. Occurrence does not establish active use; no claim is made that the historical paths are dead. The existing active external CSS validator retains its own published scope. The 83 images without an observed reference are not an unused-file list.

The scanner does not implement full JavaScript semantics, computed CSS cascade, arbitrary concatenation, remote loading or rendering. Historical files remain intact. Browser pixels/loading timing, service-worker upgrade, rollback, physical Android and audible output need separate acceptance.

## Fresh verification commands

- `node tests/g8/visual-reference-map.cjs`: 13 existing fixture groups.
- `node tests/g8/wheel-catalog-map.cjs`: 17 existing fixture groups.
- `node tests/g8/wheel-map-integration.cjs`: five groups. Version follows version.txt; original 88 mappings and independent 54-wheel catalog comparison remain asserted.
- `node tests/g8/dynamic-visual-map.cjs`: nine groups. Covers exact adapters, independent Esmâ catalog/policy, every source mutation, absent sources, inventory/dispositions and a missing generated fallback omitted from inventory.

Regenerate using `node tools/visual-reference-map.cjs --root . --output docs/g8/visual-reference-map.json`; use `--check` instead of `--output` to verify freshness after final production bytes settle. Fresh recovery results are in `tests/g8/dynamic-visual-map-results.json` and `tests/g8/recovered-map-results.json`.
