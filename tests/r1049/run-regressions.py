#!/usr/bin/env python3
"""Run supported production-source Node fixtures with isolated result outputs."""
from pathlib import Path
import argparse
import concurrent.futures
import json
import re
import shutil
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED = {
    'tests/r1086/tts-name-browser.cjs': 'Separate full-app TTS name-vocative and native recording-priority suite; run directly after source freeze.',
    'tests/r1085/berhet-session-browser.cjs': 'Separate native Berhetiyye 28-step intention, audible-onset, rhythm and cadence suite; run directly after source freeze.',
    'tests/r1079/protective-plan-playing-browser.cjs': 'Separate native ongoing protective audio and accordion presentation suite; run directly after source freeze.',
    'tests/r1079/protective-plan-accordion-browser.cjs': 'Separate native protective-plan accordion and contemplation presentation suite; run directly after source freeze.',
    'tests/r1078/manual-reading-loop-browser.cjs': 'Separate native manual reader/wheel stop and finite/unlimited loop suite; run directly after source freeze.',
    'tests/r1078/protective-plan-browser.cjs': 'Separate native protective-plan entry, validation, language and interaction suite; run directly after source freeze.',
    'tests/r1078/protective-smart-progress-browser.cjs': 'Separate native protective-plan progress and wheel transport suite; run directly after source freeze.',
    'tests/r1077/browser-contrast.cjs': 'Separate production CSS/native Chromium contrast and accessibility suite; run directly after source freeze.',
    'tests/r1077/protective-native-metadata-browser.cjs': 'Separate shipped protective audio and delayed metadata native browser suite; run directly after source freeze.',
    'tests/r1076/protective-original-browser.cjs': 'Separate native protective original-recording lifecycle and complete-loop browser suite; run directly after source freeze.',
    'tests/r1075/reading-summary-browser.cjs': 'Separate native compact reading-strip materials, contemplation and control-visibility browser suite; run directly after source freeze.',
    'tests/r1074/ambience-local-browser.cjs': 'Separate native selected-theme local-pause and actual ambience browser suite; run directly after source freeze.',
    'tests/r1074/selection-theme-browser.cjs': 'Separate native selected-theme and global-hold browser suite; run after source freeze.',
    'tests/r1072/retired-single-pause-browser.cjs': 'Separate actual Chromium captured-single Pause/Next/Start regression; run directly with an explicit evidence output.',
    'tests/r1071/atlas-ui.cjs': 'Separate actual Chromium Atlas frame/interaction suite; run directly with source baseline|candidate and explicit evidence output.',
    'tests/r1070/classic-feyz-smoke.cjs': 'Separate actual mobile Chromium/native touch smoke; run directly in both Classic/Feyz viewport profiles.',
    'tests/r1070/session-transition-matrix.cjs': 'Separate actual Chromium cross-mode/native media matrix; run directly with SUKUN_MATRIX_EXPECT_HANDOFF=1.',
    'tests/r1069/native-transition-browser.cjs': 'Separate actual native audio integration; run directly with Chromium and known generated WAVs.',
    'tests/r1068/yasin-picker-browser.cjs': 'Separate native picker integration; run directly with native CDP gestures.',
    'tests/r1067/yasin-follow-browser.cjs': 'Separate actual mobile browser integration; run directly with native CDP gestures.',
    'tests/r1067/scroll-audit.cjs': 'Separate actual mobile browser integration; run directly with native CDP gestures.',
    'tests/r1067/scroll-races.cjs': 'Separate actual mobile browser integration; run directly with native CDP gestures.',
    'tests/r1017/recording_inspection_contract.cjs': 'Archived r1017 reader; r1027 active/history reader contracts cover the shipped r1020 API.',
    'tests/r1017/health_inspection_contract.cjs': 'Archived reader path and whole-object schema; current health UI/continuity and intro diagnostic contracts remain.',
    'tests/r1021/release-integrity.cjs': 'Historical hardcoded r1021 manifest; current r1027 release-integrity is selected separately.',
    'tests/r1027/startup-intro.cjs': 'Superseded oscillator intro graph; shipped WAV contracts begin in r1037.',
    'tests/r1031/startup-intro-async.cjs': 'Superseded oscillator intro graph.',
    'tests/r1032/startup-intro-readiness.cjs': 'Superseded oscillator intro graph.',
    'tests/r1033/startup-intro-diagnostics.cjs': 'Superseded oscillator intro graph.',
    'tests/r1035/startup-intro-fresh-clock.cjs': 'Superseded oscillator intro graph.',
    'tests/r1036/startup-intro-timbre.cjs': 'Superseded oscillator intro graph.',
    'tests/r1036/measure-waveform.cjs': 'Historical oscillator measurement, not a current WAV regression.',
    'tests/r1021/persistence-browser.cjs': 'Separate real-browser test; not a Node source fixture.',
    'tests/r1066/mobile-navigation.cjs': 'Separate native mobile gesture browser test; executed directly with CDP touch delivery.',
    'tests/r1066/diagnostics-tempo-browser.cjs': 'Separate actual-browser diagnostics overflow and native tempo gesture test; executed directly.',
    'tests/r1065/full-app-bundled.cjs': 'Separate real complete-app browser test; executed directly with native MP3 playback and exact source hashes.',
    'tests/r1065/offline-bundled.cjs': 'Separate real service-worker offline browser test; executed directly.',
    'tests/r1065/offline-playback.cjs': 'Separate real service-worker offline playback test; executed directly with a new JS world.',
    'tests/r1027/recovery-browser.cjs': 'Separate real-browser test; not a Node source fixture.',
}
STATIC = 'tests/r1027/release-integrity.cjs'
FULL_EXPORT = 'tests/r1027/full-release-export.cjs'

def parsed_summary(output):
    decoder = json.JSONDecoder()
    for index, character in enumerate(output):
        if character != '{':
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
            if isinstance(value, dict) and any(key in value for key in ['total', 'passed', 'results', 'checks', 'count', 'ok']):
                return value
        except ValueError:
            pass
    match = re.search(r'(\d+)/(\d+) passed', output)
    if match:
        return {'passed': int(match.group(1)), 'total': int(match.group(2))}
    return None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, default=ROOT)
    parser.add_argument('--output-dir', type=Path)
    parser.add_argument('--static-only', action='store_true', help='Verify current release version, JavaScript syntax, SRI and deployment hashes separately.')
    parser.add_argument('--jobs', type=int, default=6)
    args = parser.parse_args()
    source = args.source_root.resolve()
    output_dir = args.output_dir.resolve() if args.output_dir else Path(tempfile.mkdtemp(prefix='sukun-r1049-regressions-'))
    output_dir.mkdir(parents=True, exist_ok=True)
    # Some historical fixtures write JSON beside themselves. Execute a copied
    # tests tree so those writes cannot alter tracked repository files.
    test_workspace = Path(tempfile.mkdtemp(prefix='fixtures-', dir=output_dir))
    shutil.copytree(ROOT / 'tests', test_workspace / 'tests')
    # Two historical rendering fixtures resolve their input from __dirname;
    # mirror the actual supplied shells in that isolated fixture workspace.
    shutil.copyfile(source / 'index.html', test_workspace / 'index.html')
    shutil.copyfile(source / 'nero.html', test_workspace / 'nero.html')
    shutil.copytree(source / 'assets/runtime', test_workspace / 'assets/runtime')
    wav = 'assets/audio/sukun-intro-signature-r1037.wav'
    (test_workspace / wav).parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / wav, test_workspace / wav)
    if args.static_only:
        scripts = [ROOT / STATIC]
    else:
        scripts = []
        for script in sorted((ROOT / 'tests').rglob('*.cjs')):
            relative = script.relative_to(ROOT).as_posix()
            if relative in EXCLUDED or relative == STATIC or relative.startswith('tests/helpers/') or 'fixture.cjs' in relative:
                continue
            scripts.append(script)

    def run(script):
        name = script.relative_to(ROOT).as_posix()
        argument = source / 'index.html' if name in ['tests/recording-storage.cjs', 'tests/interaction_gate_lifecycle.cjs'] else source
        started = time.monotonic()
        try:
            executable_script = test_workspace / name
            result = subprocess.run(['node', str(executable_script), str(argument)], cwd=source, capture_output=True, text=True, timeout=60)
            stdout, stderr, exit_code = result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired as error:
            stdout = error.stdout.decode() if isinstance(error.stdout, bytes) else error.stdout or ''
            stderr = error.stderr.decode() if isinstance(error.stderr, bytes) else error.stderr or ''
            exit_code = 'timeout'
        filename = name.replace('/', '_') + '.txt'
        (output_dir / filename).write_text(stdout + '\nSTDERR:\n' + stderr, encoding='utf-8')
        row = {'script': name, 'exitCode': exit_code, 'seconds': round(time.monotonic() - started, 3), 'outputFile': filename, 'summary': parsed_summary(stdout)}
        if exit_code != 0:
            row['errorTail'] = (stdout + '\n' + stderr)[-2000:]
        return row

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.jobs, 6))) as pool:
        results = list(pool.map(run, scripts))
    report = {'sourceRoot': str(source), 'mode': 'static' if args.static_only else 'regressions', 'groups': len(results), 'passedGroups': sum(row['exitCode'] == 0 for row in results), 'excluded': EXCLUDED, 'fullExportGroup': FULL_EXPORT, 'scope': 'Controlled production-source fixtures. No physical Android lock, audible-output or real-user storage claim.', 'results': results}
    (output_dir / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['passedGroups'] == report['groups'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
