#!/usr/bin/env python3
"""Bind current candidate evidence to exact production and test bytes."""
from pathlib import Path
import datetime, hashlib, json

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT.parent/'sukun-g8-recovery'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
shell=sha(ROOT/'index.html')
# The harnesses checkpoint partial passing prefixes. Only completed, exact
# bounded runs are eligible, never merely passed == currently executed.
NATIVE_EXPECTATIONS={
 'native-worker':(8,'tests/r1119/release-upgrade-browser.cjs',[]),
 'native-audio':(7,'tests/r1117/release-mode-smoke.cjs',[]),
 'native-frequency':(6,'tests/r1101/frequency-hub-browser.cjs',['390x844-tr']),
 'native-ambience':(8,'tests/r1102/ambience-compact-browser.cjs',['390x844-tr']),
 'native-expanded-flows':(32,'tests/r1119/expanded-ambience-browser.cjs',['390x844-tr','390x844-en','320x740-tr','768x1024-en']),
 'native-panel':(271,'tests/r1119/recording-panel-browser.cjs',[]),
}
def native_complete(d,kind,total):
    expected,script,labels=NATIVE_EXPECTATIONS[kind]
    if not d.get('finishedAt') or total!=expected:return False
    if d.get('testSha256',d.get('scriptSha256'))!=sha(ROOT/script):return False
    profiles=d.get('profiles',[])
    if [x.get('label') for x in profiles]!=labels:return False
    if any(x.get('fatal') or x.get('pending') or x.get('status') in ['pending','running','incomplete','failed'] for x in profiles):return False
    if kind=='native-panel':
        return d.get('stage')=='complete' and d.get('status')=='passed' and not d.get('diagnosticOnly') and d.get('completedMatrixStates')==128 and len(d.get('matrix',[]))==128 and d.get('plannedCoverage',{}).get('matrixStates')==128
    return True

def entry(name,kind):
    p=ROOT/'tests/r1119/evidence'/name
    if not p.exists():return dict(path=str(p.relative_to(ROOT)),kind=kind,status='pending-not-run',ok=False)
    raw=p.read_bytes()
    digest=hashlib.sha256(raw).hexdigest()
    try:d=json.loads(raw)
    except (json.JSONDecodeError,UnicodeDecodeError):
        return dict(path=str(p.relative_to(ROOT)),sha256=digest,kind=kind,status='invalid-or-in-progress-json',ok=False)
    passed=d.get('passed',d.get('passedGroups'))
    total=d.get('total',d.get('expectedChecks',d.get('groups',d.get('executedChecks'))))
    ok=total is not None and total>0 and passed==total and not d.get('fatal') and not d.get('failed') and not d.get('baselineDefectChecks')
    if 'allPassed' in d:ok=ok and d['allPassed']
    if kind.startswith('native-'):ok=ok and native_complete(d,kind,total)
    bound=d.get('sourceSha256',d.get('sourceHashes',{}).get('candidateIndex'))
    if isinstance(bound,dict):
        ok=ok and all((ROOT/p).is_file() and sha(ROOT/p)==digest for p,digest in bound.items())
    elif bound is not None:ok=ok and bound==shell
    for key,file in [('collectorSha256','assets/runtime/health-r940.js'),('healthSha256','assets/runtime/health-r940.js'),('markerSha256','sukun-build-r1119.json')]:
        if key in d:ok=ok and d[key]==sha(ROOT/file)
    if name=='health-marker-bytes.json':ok=ok and d.get('scriptSha256')==sha(ROOT/'tests/r1119/health-marker-bytes.cjs') and all(sha(ROOT/p)==digest for p,digest in d['sourceFiles'].items())
    if kind=='release-integrity':ok=ok and d.get('runnerSha256')==sha(ROOT/'tests/r1119/run-release-integrity.py') and bool(d.get('testSourceSha256')) and all(sha(ROOT/p)==digest for p,digest in d['testSourceSha256'].items())
    if kind=='controlled-aggregate':ok=ok and d.get('runnerSha256')==sha(ROOT/'tests/r1119/run-controlled-regressions.py') and bool(d.get('testSourceSha256')) and all(sha(ROOT/p)==digest for p,digest in d['testSourceSha256'].items())
    if name=='verification-gate.json':ok=ok and d.get('verificationBuilderSha256')==sha(Path(__file__)) and d.get('testSha256')==sha(ROOT/'tests/r1119/verification-gate-test.py')
    if kind in ['native-frequency','native-ambience','native-expanded-flows']:
        profiles=d.get('profiles',[])
        ok=ok and bool(profiles)
        for profile in profiles:
            served=profile.get('evidence',{}).get('served',{})
            ok=ok and served.get('nero.html',{}).get('sha256')==shell
            ok=ok and all((ROOT/p).is_file() and sha(ROOT/p)==value['sha256'] for p,value in served.items())
    return dict(path=str(p.relative_to(ROOT)),sha256=digest,kind=kind,passed=passed,total=total,status='passed' if ok else 'failed-or-incomplete',finishedAt=d.get('finishedAt'),sourceSha256=bound,ok=ok)

files=[('integrity.json','release-integrity'),('recording-panel-contract.json','source-contract'),('controlled-aggregate/results.json','controlled-aggregate'),('health-entry-allowlist.json','controlled-health'),('recording-inspection-ui-contract.json','controlled-recording'),('service-worker-upgrade-native.json','native-worker'),('native-audio.json','native-audio'),('frequency-hub.json','native-frequency'),('ambience-native-interaction.json','native-ambience'),('recording-panel-browser.json','native-panel'),('expanded-ambience-full.json','native-expanded-flows')]
files.extend([('health-marker-bytes.json','exact-marker-health'),('verification-gate.json','evidence-gate-regression')])
checks=[entry(name,kind) for name,kind in files]
for row in json.loads((ROOT/'tests/r1119/evidence/controlled-regression-summary.json').read_text()):
    item=entry(Path(row['report']).name,'map-tests' if row['suite'].startswith('g8/') else 'controlled-source')
    item['exitCode']=row['exitCode'];item['ok']=item['ok'] and row['exitCode']==0;checks.append(item)
production=['index.html','nero.html','sw.js','sukun-build-r1119.json','sukun-site-assets-r1119.json','manifest.webmanifest','version.txt','sukun-latest.json','surumler.json','assets/runtime/recording-panel-r1119.css','assets/runtime/health-r940.js','assets/runtime/startup-intro-r1027.js']
mapping=json.loads((ROOT/'tests/r1119/visual-reference-map.json').read_text())
report=dict(build='r1119',generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),baseline=dict(build='r1118',publishedMerge='6ef3b9cca3d7b8c737b5656737ea683effe74e7f',indexSha256=sha(BASE/'index.html')),production={p:dict(bytes=(ROOT/p).stat().st_size,sha256=sha(ROOT/p)) for p in production},testSources={str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'tests/r1119').glob('*')) if p.suffix in ['.cjs','.py']},checks=checks,boundedCandidateAccepted=all(c['ok'] for c in checks),productionPublished=False,globalG8Complete=False,map=dict(path='tests/r1119/visual-reference-map.json',sha256=sha(ROOT/'tests/r1119/visual-reference-map.json'),summary=mapping['summary'],openDynamicDecisions=mapping['dynamicVisuals']['openDecisions']),remaining=['Review and any subsequent authorized exact-commit publication and live validation.','Physical Android/PWA, lock/background, Bluetooth/OS audio focus, audible quality and real microphone/recording acceptance.','Global G8 bounded completion decision; no exhaustive extraction denominator was established.'],evidencePolicy='Historical r1118 evidence and initial failed attempts are retained but are not counted as fresh candidate passes. Controlled suite counts are not native/device acceptance. No live state changed by this task.')
binding_path=ROOT/'tests/r1119/evidence/controlled-source-binding.json'
binding=json.loads(binding_path.read_text()) if binding_path.exists() else None
bound=bool(binding) and binding['sourceSha256']==shell and binding['healthSha256']==sha(ROOT/'assets/runtime/health-r940.js') and binding['markerSha256']==sha(ROOT/'sukun-build-r1119.json') and all(sha(ROOT/p)==digest for p,digest in binding['reports'].items()) and all(sha(ROOT/('tests/'+p+'.cjs'))==digest for p,digest in binding['tests'].items())
report['controlledSourceBinding']=dict(path=str(binding_path.relative_to(ROOT)),sha256=sha(binding_path) if binding else None,ok=bound)
report['boundedCandidateAccepted']=report['boundedCandidateAccepted'] and bound
(ROOT/'tests/r1119/verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(dict(accepted=report['boundedCandidateAccepted'],checks=[dict(path=x['path'],passed=x.get('passed'),total=x.get('total'),ok=x['ok']) for x in checks]),indent=2))
