#!/usr/bin/env python3
"""No-browser positive/negative checks for visual evidence validation."""
import copy, importlib.util, json, subprocess, sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('current_checks', Path(__file__).with_name('run-current-checks.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
checks = 0
for suite in ['wheel-select', 'tefekkur-glass']:
    bound = json.loads(subprocess.check_output(['node', '-e', "const b=require('./tests/r1213/visual-evidence.cjs').binding(process.cwd(),process.argv[1]);console.log(JSON.stringify({sources:b.sources,requiredSources:b.required}))", suite], cwd=runner.ROOT, text=True))
    count = 2 if suite == 'wheel-select' else 4
    matrix_count = 71 if suite == 'wheel-select' else 44
    browser = {'pageErrors': [], 'consoleErrors': [], 'served': {name: {'sha256': bound['sources'][name]} for name in bound['requiredSources']}}
    matrices = [{'mode': mode, 'allPassed': True, 'total': matrix_count, 'results': [{'passed': True} for _ in range(matrix_count)], 'keyboardCycles': 3, 'forcedColors': True} for mode in ['berhet', 'esma']]
    good = dict(bound, allPassed=True, browserExecuted=True, sourceUnchanged=True, servedHashesValid=True, expectedChecks=count, passed=count, total=count)
    if suite == 'wheel-select':
        good.update(reports=matrices, evidence=browser)
    else:
        good.update(results=[{'mode': r['mode'], 'report': r} for r in matrices] + [{'mode': mode, 'reducedMotion': True, 'forcedColors': True, 'keyboardFocus': True} for mode in ['berhet', 'esma']], browserEvidence=[browser, copy.deepcopy(browser)])
    runner.validate_visual_evidence(good, suite)
    checks += 1
    def browser_of(e):
        return e['evidence'] if suite == 'wheel-select' else e['browserEvidence'][0]
    def matrix_of(e):
        return e['reports'][0] if suite == 'wheel-select' else e['results'][0]['report']
    mutations = [
        lambda e: e.pop('sources'),
        lambda e: e.update(allPassed=False),
        lambda e: e.update(browserExecuted=False),
        lambda e: e.update(sourceUnchanged=False),
        lambda e: e.update(servedHashesValid=False),
        lambda e: e.update(total=0),
        lambda e: e.update(sources={}),
        lambda e: e['sources'].update({'nero.html': 'bad hash'}),
        lambda e: e.update(requiredSources=[]),
        lambda e: browser_of(e)['served'].pop('nero.html'),
        lambda e: browser_of(e)['served']['nero.html'].update(sha256='bad hash'),
        lambda e: browser_of(e)['pageErrors'].append('Uncaught Error'),
        lambda e: browser_of(e)['consoleErrors'].append('Content Security Policy violation'),
        lambda e: matrix_of(e).update(mode='unknown'),
        lambda e: matrix_of(e)['results'].pop(),
        lambda e: matrix_of(e)['results'][0].update(passed=False),
        lambda e: matrix_of(e).update(error='failed'),
    ]
    if suite == 'wheel-select':
        mutations += [lambda e: e['reports'][0].update(keyboardCycles=0), lambda e: e['reports'][0].update(forcedColors=False), lambda e: e.update(reports=[])]
    else:
        mutations += [lambda e: e.update(browserEvidence=[]), lambda e: e['results'][2].update(keyboardFocus=False), lambda e: e['results'][2].update(mode='unknown')]
    for mutate in mutations:
        evidence = copy.deepcopy(good)
        mutate(evidence)
        try:
            runner.validate_visual_evidence(evidence, suite)
        except (OSError, ValueError, KeyError, AssertionError, TypeError, AttributeError):
            checks += 1
        else:
            raise AssertionError('Invalid evidence accepted: '+suite)
    for malformed in [None, [], {}, 'broken JSON structure']:
        try:
            runner.validate_visual_evidence(malformed, suite)
        except (OSError, ValueError, KeyError, AssertionError, TypeError, AttributeError):
            checks += 1
        else:
            raise AssertionError('Malformed evidence accepted')
    assert f'tests/{suite}/managed-preview.html' in runner.source_files()
    checks += 1
print(f'PASS {checks} visual evidence checks; no browser launched')
