# r1017 recording inspection tests

Run from the repository root with Node.js:

```sh
node tests/r1017/recording_inspection_contract.cjs
node tests/r1017/ui_recording_inspection_contract.cjs
node tests/r1017/health_inspection_contract.cjs
```

The health test requires the sibling `health_ui_fixture.cjs`. All three tests accept an explicit repository root as the first argument. They execute the actual shipped source using synthetic Blob values, controlled storage transactions, clocks, service boundaries, and modeled DOM elements. No browser profile or user recording is accessed.

Expected focused results: 73 reader cases, 40 UI/handler cases, 47 health/privacy cases.

Coverage includes real zero versus missing or inaccessible storage; no schema creation or data mutation; timeout and cancellation; repeated/concurrent requests; late open/upgrade cleanup; bounded metadata retention; preserving explicitly historical success; guarded manual rescan calls; automatic-path preservation; and exclusion from AI payloads before aggregate calculation. Health reads and exports remain passive.

These checks do not reproduce the phone's total recording loss or establish physical-device persistence. The new observation is diagnostic only and does not recover recordings. Existing r1015 and r1016 regression instructions remain in their prior test directories.
