#!/usr/bin/env python3
"""Run fresh checks against an exact checkout, retaining JSON evidence only.

Every child exit status participates in acceptance. Prior evidence files are not
read as results. Browser execution occurs in the CI runner, not by circumventing
the local workspace's process or browser-URL restrictions.
"""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, time

p=argparse.ArgumentParser()
p.add_argument('--baseline',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[2]
baseline=a.baseline.resolve(); out=a.output.resolve();out.mkdir(parents=True,exist_ok=True)
sha=lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
git=lambda *args: subprocess.check_output(['git',*args],cwd=root,text=True).strip()
source=sha(root/'index.html')
build=(root/'version.txt').read_text().strip()
inventory=json.loads((root/('sukun-site-assets-'+build+'.json')).read_text())
production_paths={item['path'] for item in inventory['files']}
production_paths.update(['sukun-site-assets-'+build+'.json','sukun-build-'+build+'.json','sw.js','manifest.webmanifest','sukun-latest.json','version.txt','index.html','nero.html'])
production_paths={name for name in production_paths if (root/name).is_file()}
test_paths={str(file.relative_to(root)) for folder in ['tests','tools'] for file in (root/folder).rglob('*') if file.is_file() and file.suffix in ['.cjs','.js','.py'] and 'evidence' not in file.parts and '__pycache__' not in file.parts}
test_paths.add('.github/workflows/r1121-release.yml')
snapshot=lambda paths: {name:sha(root/name) for name in sorted(paths)}
before_production=snapshot(production_paths);before_tests=snapshot(test_paths)
report={'startedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'commit':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'baselineCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=baseline,text=True).strip(),'build':(root/'version.txt').read_text().strip(),'sourceSha256':source,'checks':[],'limitations':['No physical Android/iOS, actual OS screen lock, phone interruptions or acoustic/hearing-safety acceptance.','Browser fixture details and controlled mechanisms are documented in each individual report.']}
assert report['baselineCommit']=='7b25996c9d545a3732d758136342da893bba6ed4'
commands=[
 ('release-integrity',['node','tools/release-integrity.cjs',str(root)]),
 ('health-marker',['node','tests/r1120/health-marker-bytes.cjs',str(root),str(out/'health-marker.json')]),
 ('controlled-regressions',['python3','tests/r1120/run-controlled-regressions.py','--root',str(root),'--output',str(out/'controlled')]),
 ('baseline-navigation',['node','tests/r1121/navigation-labels.cjs',str(baseline),str(out/'baseline-navigation.json'),'--baseline']),
 ('candidate-navigation',['node','tests/r1121/navigation-labels.cjs',str(root),str(out/'candidate-navigation.json')]),
 ('mode-transport',['node','tests/r1117/release-mode-smoke.cjs',str(root),str(out/'mode-transport.json')]),
 ('native-frequency',['node','tests/r1120/audio-frequency-browser.cjs',str(root),str(baseline),str(out/'native-frequency.json')]),
 ('native-headroom',['node','tests/r1120/headroom-matrix-browser.cjs',str(root),str(out/'native-headroom.json')]),
 ('release-upgrade',['node','tests/r1121/release-upgrade-browser.cjs',str(root),str(baseline),str(out/'release-upgrade.json')]),
]
# These are required gates, not optional discovery: absence fails acceptance.
for name in ['frequency-engine-contract','frequency-handoff-contract','frequency-handoff-regressions','frequency-engine-browser','frequency-renderer-browser','dhikr-lifecycle-contract','dhikr-source-regressions','dhikr-lifecycle-browser']:
 commands.append((name,['node','tests/r1121/'+name+'.cjs',str(root),str(out/(name+'.json'))]))
for name,cmd in commands:
 started=time.monotonic()
 print('\n=== '+name+' ===',flush=True)
 try:
  result=subprocess.run(cmd,cwd=root,capture_output=True,text=True,timeout=650)
  code=result.returncode; stdout=result.stdout; stderr=result.stderr
 except subprocess.TimeoutExpired as error:
  code='timeout';stdout=str(error.stdout or '');stderr=str(error.stderr or '')
 # CI logs contain only this synthetic test execution. Artifacts exclude logs.
 print(stdout[-16000:],flush=True);print(stderr[-6000:],flush=True)
 row={'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-started,3)}
 if name=='release-integrity' and (root/'tools/release-integrity-results.json').exists():
  (out/'release-integrity.json').write_bytes((root/'tools/release-integrity-results.json').read_bytes())
 evidence=out/('controlled/results.json' if name=='controlled-regressions' else name+'.json')
 try:
  data=json.loads(evidence.read_text())
  total=data.get('total',data.get('expectedChecks',data.get('groups')))
  passed=data.get('passed',data.get('passedGroups'))
  assert isinstance(total,int) and total>0, 'Missing nonzero completed check count'
  assert passed==total and not data.get('fatal'), 'Report does not show complete success'
  row['evidence']={'file':str(evidence.relative_to(out)),'sha256':sha(evidence),'passed':passed,'total':total}
 except (OSError,ValueError,AssertionError) as error:
  row['evidenceError']=str(error)
  row['exitCode']=code if code else 'invalid-evidence'
 report['checks'].append(row)
 report['passed']=sum(x['exitCode']==0 for x in report['checks']);report['total']=len(commands)
 (out/'acceptance-summary.json').write_text(json.dumps(report,indent=2)+'\n')
report['finishedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
report['productionHashes']=before_production
report['testInputHashes']=before_tests
report['productionUnchanged']=snapshot(production_paths)==before_production
report['testInputsUnchanged']=snapshot(test_paths)==before_tests
report['testHashes']={str(file.relative_to(root)):sha(file) for file in (root/'tests/r1121').glob('*') if file.is_file()}
report['evidenceHashes']={str(file.relative_to(out)):sha(file) for file in out.rglob('*.json') if file.name!='acceptance-summary.json'}
(out/'acceptance-summary.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'total':report['total'],'commit':report['commit'],'productionUnchanged':report['productionUnchanged']}),flush=True)
raise SystemExit(0 if report['passed']==report['total'] and report['productionUnchanged'] and report['testInputsUnchanged'] else 1)
