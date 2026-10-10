# r1045 live-audit regressions

Run from the repository root (or pass it as the first argument):

    node tests/r1045/quick-error-label.cjs [source-root]
    node tests/r1045/presentation-notice.cjs [source-root]
    node tests/r1045/ambient-info.cjs [source-root] [optional-r1044-baseline]
    node tests/r1045/intro-rejection-diagnostics.cjs [source-root] [optional-r1044-baseline]

Quick controls execute the shipped controller and native delegation branches in
an isolated DOM fixture for Esma and Berhetiyye. They check ERROR/Retry in TR/EN,
all earlier phases, repeated layout transitions, disabled/manual gates, picker
focus and unchanged native start/stop commands.

Presentation fixtures check language switching on existing visible and hidden
notices without creating, dismissing or recovering them. Existing frame-timeout,
Classic geometry, asynchronous manual recovery and lifecycle behavior remain.

The intro suite executes actual ac/SesCapa/AudioLife integration against bounded
media/timer fixtures and the shipped Health collector. The optional baseline is
for before/after comparisons. Without it, behavioral and privacy assertions still
run against the supplied current source. No native media timing is simulated as
proof of a real browser's rejected condition. The saved snapshot is explicitly
after-rejection; later matching fields cannot overturn the original decision.
Only fixed enum/boolean/null projections are exported locally. Audio admission,
WAV, lifecycle, ownership and microphone protections are unchanged.

Dependencies: tests/r1039/silent-anchor-init.cjs,
tests/r1037/intro-fixture.cjs, tests/r1017/health_inspection_contract.cjs and
health_ui_fixture.cjs. The approved WAV is a runtime dependency.

These tests use synthetic data. They are not Android lock, microphone, recording
persistence, browser rendering or audible-output tests. Final version/SRI/SW,
complete deployment inventory and exact exporter checks are separate.

Ambient info exercises all 80 shipped sound definitions and eight fields through
the actual I18N translator, plus repeated, nested and interrupted focus flows.
