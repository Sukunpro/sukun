#!/usr/bin/env python3
"""Run fresh checks against an exact checkout, retaining JSON evidence only.

Every child exit status participates in acceptance. Prior evidence files are not
read as results. Browser execution occurs in the CI runner, not by circumventing
the local workspace's process or browser-URL restrictions.
"""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, os, subprocess, time

p=argparse.ArgumentParser()
p.add_argument('--baseline',type=Path,required=True)
p.add_argument('--upgrade-baseline',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--jobs',type=int,choices=[1,2,3],default=3,help='Independent isolated check groups to run concurrently (default: 3)')
a=p.parse_args()
root=Path(__file__).resolve().parents[2]
baseline=a.baseline.resolve();upgrade_baseline=a.upgrade_baseline.resolve(); out=a.output.resolve();out.mkdir(parents=True,exist_ok=True)
sha=lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
git=lambda *args: subprocess.check_output(['git',*args],cwd=root,text=True).strip()
source=sha(root/'index.html')
build=(root/'version.txt').read_text().strip()
inventory=json.loads((root/('sukun-site-assets-'+build+'.json')).read_text())
production_paths={item['path'] for item in inventory['files']}
production_paths.update(['sukun-site-assets-'+build+'.json','sukun-build-'+build+'.json','sw.js','manifest.webmanifest','sukun-latest.json','version.txt','index.html','nero.html'])
production_paths={name for name in production_paths if (root/name).is_file()}
test_paths={str(file.relative_to(root)) for folder in ['tests','tools'] for file in (root/folder).rglob('*') if file.is_file() and file.suffix in ['.cjs','.js','.py'] and 'evidence' not in file.parts and '__pycache__' not in file.parts}
test_paths.update(str(file.relative_to(root)) for file in (root/'.github/workflows').glob('*.yml'))
snapshot=lambda paths: {name:sha(root/name) for name in sorted(paths)}
before_production=snapshot(production_paths);before_tests=snapshot(test_paths)
report={'startedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'commit':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'upgradeBaselineCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=upgrade_baseline,text=True).strip(),'baselineCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=baseline,text=True).strip(),'build':(root/'version.txt').read_text().strip(),'sourceSha256':source,'jobs':a.jobs,'checks':[],'limitations':['No physical Android/iOS, actual OS screen lock, phone interruptions or acoustic/hearing-safety acceptance.','Browser fixture details and controlled mechanisms are documented in each individual report.']}
assert build=='r1126', 'This required acceptance runner must test r1126, not silently skip'
assert report['upgradeBaselineCommit']=='1ead4017fd3d8159a7224cf749d42cffd2ac21da'
assert report['baselineCommit']=='7b25996c9d545a3732d758136342da893bba6ed4'
commands=[
 ('release-integrity',['node','tools/release-integrity.cjs',str(root)]),
 ('health-marker',['node','tests/r1120/health-marker-bytes.cjs',str(root),str(out/'health-marker.json')]),
 ('controlled-regressions',['python3','tests/r1120/run-controlled-regressions.py','--root',str(root),'--output',str(out/'controlled')]),
 ('baseline-navigation',['node','tests/r1121/navigation-labels.cjs',str(baseline),str(out/'baseline-navigation.json'),'--baseline']),
 ('candidate-navigation',['node','tests/r1121/navigation-labels.cjs',str(root),str(out/'candidate-navigation.json')]),
 ('mode-transport',['node','tests/r1117/release-mode-smoke.cjs',str(root),str(out/'mode-transport.json')]),
 ('native-frequency',['node','tests/r1121/audio-frequency-browser.cjs',str(root),str(baseline),str(out/'native-frequency.json')]),
 ('native-headroom',['node','tests/r1120/headroom-matrix-browser.cjs',str(root),str(out/'native-headroom.json')]),
 ('release-upgrade',['node','tests/r1126/release-upgrade-browser.cjs',str(root),str(upgrade_baseline),str(out/'release-upgrade.json')]),
]
# These are required gates, not optional discovery: absence fails acceptance.
for name in ['activation-deadline-contract','frequency-engine-contract','frequency-handoff-contract','frequency-handoff-regressions','frequency-engine-browser','frequency-renderer-browser','dhikr-lifecycle-contract','dhikr-source-regressions','dhikr-lifecycle-browser']:
 folder='r1126' if name=='activation-deadline-contract' else 'r1121'
 commands.append((name,['node','tests/'+folder+'/'+name+'.cjs',str(root),str(out/(name+'.json'))]))
for name in ['frequency-onset-contract','frequency-onset-browser']:
 commands.append((name,['node','tests/r1122/'+name+'.cjs',str(root),str(out/(name+'.json'))]))
commands.append(('dhikr-navigation-route-contract',['node','tests/r1122/dhikr-navigation-route-contract.cjs',str(root),str(out/'dhikr-navigation-route-contract.json')]))
commands.append(('dhikr-navigation-browser',['node','tests/r1123/dhikr-navigation-browser.cjs',str(root),str(out/'dhikr-navigation-browser.json')]))
for name in ['global-pause-feedback','media-resume-recording','media-fallback-contract','media-wheel-native-browser']:
 commands.append((name,['node','tests/r1124/'+name+'.cjs',str(root),str(out/(name+'.json'))]))
commands.append(('berhet-theme-browser',['node','tests/r1125/berhet-theme-browser.cjs',str(root),str(out/'berhet-theme-browser.json')]))
commands.append(('atlas-private-access',['node','tests/r1125/atlas-private-access.cjs',str(root),str(out/'atlas-private-access.json')]))
commands.append(('delail-tts-lifecycle',['node','tests/r1126/delail-tts-lifecycle.cjs',str(root),str(out/'delail-tts-lifecycle.json')]))
commands.append(('delail-screen-browser',['node','tests/r1126/delail-screen-browser.cjs',str(root),str(out/'delail-screen-browser.json')]))
assert len(commands)==30 and len({name for name,cmd in commands})==30
required_counts={'global-pause-feedback':10,'media-resume-recording':2,'media-fallback-contract':6,'media-wheel-native-browser':12,'berhet-theme-browser':15,'atlas-private-access':7,'delail-screen-browser':8,'delail-tts-lifecycle':26}
def execute(item):
 name,cmd=item
 started=time.monotonic()
 try:
  result=subprocess.run(cmd,cwd=root,capture_output=True,text=True,timeout=650)
  code=result.returncode; stdout=result.stdout; stderr=result.stderr
 except subprocess.TimeoutExpired as error:
  code='timeout';stdout=str(error.stdout or '');stderr=str(error.stderr or '')
 return name,cmd,code,stdout,stderr,round(time.monotonic()-started,3)

# Every group uses its own output filename and disposable browser origin/profile.
# The controlled aggregate uses mkdtemp; shared source/test inputs are read-only.
# Only one release-integrity invocation writes its separate generated JSON.
# map returns results in command order, preserving deterministic evidence/log order.
with concurrent.futures.ThreadPoolExecutor(max_workers=a.jobs) as pool:
 for name,cmd,code,stdout,stderr,seconds in pool.map(execute,commands):
  print('\n=== '+name+' ===',flush=True)
  # CI logs contain only synthetic execution; artifacts exclude logs.
  print(stdout[-16000:],flush=True);print(stderr[-6000:],flush=True)
  row={'name':name,'command':cmd,'exitCode':code,'seconds':seconds}
  if name=='release-integrity' and (root/'tools/release-integrity-results.json').exists():
   (out/'release-integrity.json').write_bytes((root/'tools/release-integrity-results.json').read_bytes())
  evidence=out/('controlled/results.json' if name=='controlled-regressions' else name+'.json')
  try:
   data=json.loads(evidence.read_text())
   total=data.get('total',data.get('expectedChecks',data.get('groups')))
   passed=data.get('passed',data.get('passedGroups'))
   assert isinstance(total,int) and total>0, 'Missing nonzero completed check count'
   assert passed==total and not data.get('fatal'), 'Report does not show complete success'
   if name in required_counts: assert total==required_counts[name], 'Required case count changed or incomplete'
   if 'expectedChecks' in data: assert total==data['expectedChecks'], 'Partial expected-check report'
   if 'allPassed' in data: assert data['allPassed'] is True, 'Suite rejected acceptance'
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
report['testHashes']={str(file.relative_to(root)):sha(file) for folder in ['r1121','r1122','r1123','r1124','r1125','r1126'] for file in (root/'tests'/folder).glob('*') if file.is_file()}
report['evidenceHashes']={str(file.relative_to(out)):sha(file) for file in out.rglob('*.json') if file.name!='acceptance-summary.json'}
(out/'acceptance-summary.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'total':report['total'],'commit':report['commit'],'productionUnchanged':report['productionUnchanged']}),flush=True)
raise SystemExit(0 if report['passed']==report['total'] and report['productionUnchanged'] and report['testInputsUnchanged'] else 1)
