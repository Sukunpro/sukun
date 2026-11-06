#!/usr/bin/env python3
"""Fresh current-source acceptance; release numbers never select an old UI suite.

--scope source is a fast development check and explicitly NOT full acceptance.
CI must use --scope full, including native worker upgrade/offline/rollback.
Missing tests, failed processes, changed production bytes or partial browser
evidence fail closed. Evidence is generated in this invocation, never reused.
"""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, re, subprocess, time

ROOT = Path(__file__).resolve().parents[2]
SOURCE_SUITES = [
    ('r1230-module-syntax', 'tests/r1230/release-js-syntax.cjs'),
    ('r1230-cymatics-geometry', 'tests/cymatics3d/geometry.mjs'),
    ('r1230-cymatics-bridge', 'tests/cymatics3d/bridge.cjs'),
    ('r1230-cymatics-lifecycle', 'tests/cymatics3d/scene-lifecycle.cjs'),
    ('r1230-signal-visualizer', 'tests/visualizer/contract.cjs'),
    ('r1230-binaural-profile', 'tests/binaural-profile/contract.cjs'),
    ('r1230-frequency-settings', 'tests/frequency-effects/settings.cjs'),
    ('r1230-frequency-dsp', 'tests/frequency-effects/dsp-contract.cjs'),
    ('r1230-frequency-engine', 'tests/r1121/frequency-engine-contract.cjs'),
    ('r1230-frequency-onset', 'tests/r1122/frequency-onset-contract.cjs'),
    ('r1230-frequency-handoff', 'tests/r1121/frequency-handoff-contract.cjs'),
    ('r1230-frequency-handoff-historic', 'tests/r1121/frequency-handoff-regressions.cjs'),
    ('r1227-completion-haptics', 'tests/r1227/completion-haptics.cjs'),
    ('r1227-current-timing', 'tests/r1227/current-timing.cjs'),
    ('r1227-direct-count', 'tests/r1227/direct-count.cjs'),
    ('r1225-repetition-upgrade', 'tests/r1225/repetition-upgrade.cjs'),
    ('r1225-recording-races', 'tests/r1225/recording-races.cjs'),
    ('r1225-repetition-validation', 'tests/r1225/repetition-validation.cjs'),
    ('r1225-delail-errors', 'tests/r1225/delail-errors.cjs'),
    ('r1225-modal-lifecycle', 'tests/r1225/modal-lifecycle.cjs'),
    ('r1219-reading-navigation', 'tests/r1219/reading-navigation.cjs'),
    ('r1219-vikaye-continuation', 'tests/r1219/vikaye-continuation.cjs'),
    ('r1219-atlas-keyboard', 'tests/r1219/atlas-keyboard-contract.cjs'),
    ('r1215-atlas', 'tests/r1215/atlas-contract.cjs'),
    ('r1215-stability', 'tests/r1215/stability.cjs'),
    ('r1215-audio-races', 'tests/r1215-audio-races.cjs'),
    ('r1215-premium-layout', 'tests/r1215/premium-layout.cjs'),
    ('r1215-cinematic', 'tests/r1215/cinematic.cjs'),
    ('r1215-home-private', 'tests/r1215/home-private-contract.cjs'),
    ('practice-owner', 'tests/r1211/practice-owner.cjs'),
    ('session-access', 'tests/r1211/session-access.cjs'),
    ('ebced-values-and-restore', 'tests/r1191/ebced-journey-contract.cjs'),
    ('target-intent', 'tests/r1194/target-intent.cjs'),
    ('journey-permissions', 'tests/r1191/journey-permissions.cjs'),
    ('restart-session', 'tests/r1191/restart-session.cjs'),
    ('restart-journey', 'tests/r1191/restart-journey.cjs'),
    ('restart-states', 'tests/r1192/restart-states.cjs'),
    ('saver-state', 'tests/r1194/saver-state.cjs'),
    ('saver-actions', 'tests/r1193/card-actions.cjs'),
    ('dock-restore', 'tests/r1198/dock-restore.cjs'),
    ('lock-state', 'tests/r1210/lock-state.cjs'),
    ('mini-door-audio', 'tests/r1210/mini-door-audio.cjs'),
    ('practice-flow', 'tests/r1213/practice-flow.cjs'),
    ('saver-content', 'tests/r1213/saver-content.cjs'),
    ('update-offline', 'tests/r1213/update-offline.cjs'),
]
# Retain transport and audio invariants that remain relevant to the current
# native owners. Retired r1149 visual-selector suites are not called current UI.
INHERITED_SUITES = [
    ('dhikr-lifecycle', 'tests/r1121/dhikr-lifecycle-contract.cjs'),
    ('dhikr-source', 'tests/r1121/dhikr-source-regressions.cjs'),
    ('navigation-routing', 'tests/r1122/dhikr-navigation-route-contract.cjs'),
    ('media-fallback', 'tests/r1124/media-fallback-contract.cjs'),
    ('delail-recorded', 'tests/r1128/delail-recorded-contract.cjs'),
    ('delail-tts', 'tests/r1128/delail-tts-lifecycle.cjs'),
]

# Keep new audio/graphics native evidence in the mandatory full release gate.
# These suites run sequentially, apart from the parallel source contracts.
NATIVE_BROWSER_SUITES = [
    ('r1230-cymatics-native', 'tests/cymatics3d/browser.cjs'),
    ('r1230-signal-visualizer-native', 'tests/visualizer/browser.cjs'),
    ('r1230-frequency-dsp-native', 'tests/frequency-effects/dsp-browser.cjs'),
]
NATIVE_BROWSER_NAMES = {name for name, _ in NATIVE_BROWSER_SUITES} | {'native-upgrade-offline'}

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

def source_files():
    paths = {ROOT / name for name in ['index.html', 'nero.html', 'sw.js', 'version.txt',
             'manifest.webmanifest', 'sukun-latest.json', 'surumler.json']}
    for folder in ['assets/runtime', 'css', 'js', 'tests', '.github/workflows']:
        paths.update(p for p in (ROOT / folder).rglob('*') if p.is_file() and
                     p.suffix in ['.js', '.cjs', '.css', '.py', '.yml', '.json'] and
                     'evidence' not in p.parts and '__pycache__' not in p.parts)
    return {str(p.relative_to(ROOT)): digest(p) for p in sorted(paths) if p.exists()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--scope', choices=['source', 'node', 'full'], default='full')
    parser.add_argument('--upgrade-baseline', type=Path)
    parser.add_argument('--jobs', type=int, choices=[1, 2, 3], default=3)
    args = parser.parse_args()
    out = args.output.resolve()
    assert not out.is_relative_to(ROOT), 'Write fresh evidence outside the candidate checkout'
    assert not out.exists() or not any(out.iterdir()), 'Evidence directory must be new or empty'
    out.mkdir(parents=True, exist_ok=True)
    build = (ROOT / 'version.txt').read_text().strip()
    assert re.fullmatch(r'r\d+', build), 'Invalid release identity'
    if args.scope != 'source':
        assert int(build[1:]) >= 1213, 'Current acceptance requires the modern r1213+ contract'
    before = source_files()
    commands = [(name, ['node', file]) for name, file in SOURCE_SUITES]
    commands.append(('shell-consolidation', ['python3', 'tests/r1215/shell-consolidation.py']))
    commands += [(name, ['node', file, str(ROOT), str(out / (name + '.json'))])
                 for name, file in INHERITED_SUITES]
    if args.scope != 'source':
        commands += [('release-integrity', ['node', 'tools/release-integrity.cjs', str(ROOT)]),
                     ('health-marker', ['node', 'tests/r1120/health-marker-bytes.cjs', str(ROOT), str(out / 'health-marker.json')])]
    if args.scope == 'full':
        assert args.upgrade_baseline, 'Native upgrade baseline is mandatory'
        baseline = args.upgrade_baseline.resolve()
        baseline_build = (baseline / 'version.txt').read_text().strip()
        assert re.fullmatch(r'r\d+', baseline_build) and int(baseline_build[1:]) < int(build[1:])
        commands += [(name, ['node', file]) for name, file in NATIVE_BROWSER_SUITES]
        commands += [('native-upgrade-offline', ['node', 'tests/r1213/release-upgrade-browser.cjs', str(ROOT), str(baseline), str(out / 'native-upgrade-offline.json')])]
    for name, command in commands:
        assert (ROOT / command[1]).is_file(), 'Missing required suite: ' + command[1]
    report = {'build': build, 'scope': args.scope, 'commit': subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'sourceSha256': digest(ROOT / 'nero.html'),
        'startedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'checks': [],
        'limitations': ['Source suites use actual shipped functions with controlled DOM/storage/audio seams.',
                       'Full scope includes native Linux Chromium worker tests; no physical Android/iOS or acoustic acceptance.',
                       'Responsive visual inspection is recorded separately; source checks do not certify pixel layout.']}

    def execute(item):
        name, command = item
        started = time.monotonic()
        try:
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=600 if name == 'native-upgrade-offline' else 180)
            code, stdout, stderr = result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired as error:
            code, stdout, stderr = 'timeout', str(error.stdout or ''), str(error.stderr or '')
        row = {'name': name, 'command': command, 'exitCode': code, 'seconds': round(time.monotonic() - started, 3),
               'stdout': stdout[-20000:], 'stderr': stderr[-12000:]}
        evidence_path = out / (name + '.json')
        if name == 'native-upgrade-offline' and code == 0:
            try:
                evidence = json.loads(evidence_path.read_text())
                assert evidence['expectedChecks'] == evidence['passed'] == 8 and not evidence.get('fatal')
            except (OSError, ValueError, KeyError, AssertionError) as error:
                row['exitCode'] = 'invalid-evidence'
                row['evidenceError'] = str(error)
        print(f'{name}: {row["exitCode"]}', flush=True)
        if row['exitCode'] != 0:
            print(row['stdout'][-3000:] + row['stderr'][-3000:], flush=True)
        return row

    # Keep native audio/graphics and update timing independent of concurrent workloads.
    ordinary = [item for item in commands if item[0] not in NATIVE_BROWSER_NAMES]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        report['checks'] = list(pool.map(execute, ordinary))
    for item in commands:
        if item[0] in NATIVE_BROWSER_NAMES:
            report['checks'].append(execute(item))
    report['passed'] = sum(row['exitCode'] == 0 for row in report['checks'])
    report['total'] = len(commands)
    report['sourceUnchanged'] = before == source_files()
    report['sourceHashes'] = before
    report['completeAcceptance'] = args.scope == 'full' and report['passed'] == report['total'] and report['sourceUnchanged']
    report['finishedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    (out / 'current-summary.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['build', 'scope', 'passed', 'total', 'sourceUnchanged', 'completeAcceptance']}))
    return 0 if report['passed'] == report['total'] and report['sourceUnchanged'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
