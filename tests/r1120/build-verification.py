#!/usr/bin/env python3
"""Bounded r1120 acceptance. Missing, partial or stale evidence fails closed."""
from pathlib import Path
import hashlib,json,datetime,copy
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tests/r1120/evidence'
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text())
def matches(mapping):
 return bool(mapping) and all((ROOT/name).is_file() and sha(ROOT/name)==digest for name,digest in mapping.items())
EXPECTED=read(ROOT/'tests/r1120/gate-expectations.json')
def served_maps(value):
 if isinstance(value,dict):
  for key,item in value.items():
   if key=='served' and isinstance(item,dict):yield item
   else:yield from served_maps(item)
 elif isinstance(value,list):
  for item in value:yield from served_maps(item)
def resources(value):
 if isinstance(value,dict):
  for key,item in value.items():
   if key=='served' and isinstance(item,dict):
    if not matches({name:row['sha256'] for name,row in item.items()}):return False
   elif not resources(item):return False
 elif isinstance(value,list):return all(resources(x) for x in value)
 return True
NATIVE={
 'native-mode-smoke.json':(7,'tests/r1117/release-mode-smoke.cjs',None),
 'frequency-hub.json':(6,'tests/r1101/frequency-hub-browser.cjs',['390x844-tr']),
 'ambience-native-interaction.json':(8,'tests/r1102/ambience-compact-browser.cjs',['390x844-tr']),
 'service-worker-upgrade-native.json':(8,'tests/r1120/release-upgrade-browser.cjs',None),
 'audio-frequency-browser.json':(23,'tests/r1120/audio-frequency-browser.cjs',None),
}
def native_valid(data,name):
 total,script,profiles=NATIVE[name];actual=data.get('total',data.get('expectedChecks'))
 if not data.get('finishedAt') or data.get('fatal') or data.get('passed')!=total or actual!=total:return False
 if data.get('testSha256',data.get('scriptSha256'))!=sha(ROOT/script):return False
 if 'allPassed'in data and not data['allPassed']:return False
 if data.get('build','r1120')!='r1120':return False
 if [x.get('name')for x in data.get('checks',[])]!=EXPECTED['native'][name] or any(not x.get('passed') for x in data['checks']):return False
 if profiles is not None and ([p.get('label')for p in data.get('profiles',[])]!=profiles or any(p.get('fatal')for p in data['profiles'])):return False
 bound=data.get('sourceSha256')
 if name in ['native-mode-smoke.json','ambience-native-interaction.json','service-worker-upgrade-native.json'] and bound!=sha(ROOT/'index.html'):return False
 if bound and bound!=sha(ROOT/'index.html'):return False
 if name=='audio-frequency-browser.json':
  if data.get('browserExecuted')is not True or data.get('testUnchanged')is not True:return False
  if data.get('sourceHashes')!={k:sha(ROOT/(k+'.html')) for k in ['index','nero']}:return False
 if name=='service-worker-upgrade-native.json' and (set(data.get('sourceHashes',{}))!={'index.html','sw.js','sukun-build-r1120.json','sukun-site-assets-r1120.json'} or not matches(data['sourceHashes'])):return False
 if name in ['audio-frequency-browser.json','frequency-hub.json','ambience-native-interaction.json'] and not any(m.get('nero.html',{}).get('sha256')==sha(ROOT/'nero.html')for m in served_maps(data)):return False
 if not resources(data):return False
 if name=='frequency-hub.json' and not all(p.get('evidence',{}).get('served',{}).get('nero.html',{}).get('sha256')==sha(ROOT/'nero.html')for p in data['profiles']):return False
 return True

def build():
 checks=[]
 def add(name,fn):
  try:ok=bool(fn());error=None
  except Exception as exc:ok=False;error=str(exc)
  checks.append(dict(name=name,ok=ok,**({'error':error}if error else {})))
 add('entrypoint parity',lambda:sha(ROOT/'index.html')==sha(ROOT/'nero.html') and (ROOT/'version.txt').read_text().strip()=='r1120')
 for name in NATIVE:add(name,lambda name=name:native_valid(read(OUT/name),name))
 def integrity():
  d=read(OUT/'integrity.json');return d['passed']==d['total']==1565 and matches(d['sourceSha256']) and matches(d['testSourceSha256']) and d['runnerSha256']==sha(ROOT/'tests/r1120/run-release-integrity.py')
 add('release integrity',integrity)
 def aggregate():
  d=read(OUT/'controlled-aggregate/results.json');return d['passedGroups']==d['groups']==66 and [x.get('script')for x in d['results']]==EXPECTED['aggregate'] and all(x['exitCode']==0 for x in d['results']) and d['sourceSha256']==sha(ROOT/'index.html') and d['healthSha256']==sha(ROOT/'assets/runtime/health-r940.js') and d['markerSha256']==sha(ROOT/'sukun-build-r1120.json') and matches(d['testSourceSha256']) and d['runnerSha256']==sha(ROOT/'tests/r1120/run-controlled-regressions.py')
 add('controlled aggregate',aggregate)
 def source():
  d=read(OUT/'controlled-source-binding.json');s=read(OUT/'controlled-regression-summary.json');return [x.get('suite')for x in s]==EXPECTED['source'] and len(s)==17 and all(x['exitCode']==0 and x['passed']==x['total'] and x['total']>0 for x in s) and d['sourceSha256']==sha(ROOT/'index.html') and d['healthSha256']==sha(ROOT/'assets/runtime/health-r940.js') and d['markerSha256']==sha(ROOT/'sukun-build-r1120.json') and matches(d['reports']) and matches({'tests/'+k+'.cjs':v for k,v in d['tests'].items()})
 add('bounded source and map groups',source)
 def health():
  d=read(OUT/'health-marker-bytes.json');return d['passed']==d['total']==7 and d['sourceSha256']==sha(ROOT/'index.html') and matches(d['sourceFiles']) and d['scriptSha256']==sha(ROOT/'tests/r1120/health-marker-bytes.cjs')
 add('exact full health marker',health)
 def supplemental():
  d=read(OUT/'supplemental-binding.json');return matches(d['sources']) and matches(d['reports']) and all(x['exitCode']==0 and x['passed']==x['total'] for x in d['rows']) and [(x['suite'],x['total'])for x in d['rows']]==[('manual-sets-contract',19),('audio-frequency-contract',4)]
 add('manual sets and digital gain contracts',supplemental)
 def background():
  d=read(OUT/'background-contract-binding.json');accepted={'r1059/background-mix':(26,27,1),'r1060/active-source':(57,57,0),'r1061/background-lock':(54,54,0)}
  rows=[x for x in d['rows']if x['suite']in accepted]
  return [x['suite']for x in rows]==EXPECTED['background'] and len(rows)==3 and matches(d['source']) and matches(d['reports']) and all(x['exitCode']==0 and (x['passed'],x['total'],x['skipped'])==accepted[x['suite']] and x['testSha256']==sha(ROOT/('tests/'+x['suite']+'.cjs')) for x in rows)
 add('background ownership and hidden-intent controlled regressions',background)
 def review():
  d=read(ROOT/'tests/r1120/review.json');return matches(d['sourceHashes']) and d['status']=='PASS_SOURCE_REVIEW' and not d['remainingSourceBlockers']
 add('independent exact-byte source review',review)
 def harmonic():
  d=read(OUT/'harmonic-automation-contract.json');return bool(d.get('finishedAt')) and not d.get('fatal') and d.get('allPassed')is True and [x.get('name')for x in d.get('checks',[])]==['In-band linear paths match native main ramp events', 'Upward crossing clamps at the exact guard and mutes', 'Downward crossing holds the guard then restores the ratio', 'Both-above paths stay clamped and silent', 'Exact-limit stationary paths remain supported', 'Exact-limit start moving upward mutes immediately', 'Exact-limit start moving downward remains supported', 'Downward arrival exactly at the limit restores gain', 'Upward arrival exactly at the limit remains supported', 'Log sweep keeps matching sampled frequency and gain curves', 'Immediate retune holds existing automation and uses the supplied timestamp'] and d['passed']==d['total']==11 and d['sourceSha256']==sha(ROOT/'index.html') and d['testSha256']==sha(ROOT/'tests/r1120/harmonic-automation-contract.cjs') and all(x['passed']for x in d['checks'])
 add('shared harmonic automation contracts',harmonic)
 def headroom():
  d=read(OUT/'headroom-matrix-browser.json');expected=['legacy-bin-sine','balanced-bin-sine','stack-bin-square','stack-mono-square','stack-iso-square','stack-mix-square','stack-iso-sawtooth','stack-iso-triangle','octave-high-frequency','lp-resonant-sine','lp-resonant-stack','hp-resonant-stack','narrow-band-stack','upper-lp-resonance','legacy-iso-stack']
  return bool(d.get('finishedAt')) and not d.get('fatal') and d.get('browserExecuted')is True and d.get('allPassed')is True and d.get('passed')==d.get('total')==17 and d.get('plannedCases')==15 and [x['id']for x in d['cases']]==expected and all(x['passed']for x in d['cases']+d['checks']) and [x['name']for x in d['checks']]==['Measured simple balanced profile preserves the 2× target bound','Exact source and served resource provenance'] and d['sourceSha256']==sha(ROOT/'index.html') and d['testSha256']==sha(ROOT/'tests/r1120/headroom-matrix-browser.cjs') and d['rendererSha256']==sha(ROOT/'assets/runtime/background-mix-render-r1059.js')
 add('targeted stereo headroom matrix',headroom)
 add('gate negative fixtures',lambda:gate_tests()['passed']==gate_tests()['total'])
 production=['index.html','nero.html','sw.js','sukun-build-r1120.json','sukun-site-assets-r1120.json','manifest.webmanifest','version.txt','sukun-latest.json','surumler.json','js/frequency-hub-r1101.js','assets/runtime/background-mix-r1059.js','assets/runtime/background-mix-render-r1059.js','assets/runtime/frequency-workbench-r1120.js','assets/runtime/frequency-workbench-r1120.css','assets/runtime/frequency-sets-r1120.js','assets/runtime/frequency-sets-r1120.css','assets/runtime/health-r940.js','assets/runtime/startup-intro-r1027.js']
 return dict(build='r1120',generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),baseline={'build':'r1119','mergeCommit':'48926b39f90d71c9784f269b148608f7aa11e964','tree':'262eb2983a1a9e672c7af079b0434fbefbd35cd1'},boundedCandidateAccepted=all(x['ok']for x in checks),productionPublished=False,checks=checks,production={p:{'sha256':sha(ROOT/p),'bytes':(ROOT/p).stat().st_size}for p in production},testSources={str(p.relative_to(ROOT)):sha(p)for p in (ROOT/'tests/r1120').glob('*')if p.suffix in ['.py','.cjs']},gateExpectationsSha256=sha(ROOT/'tests/r1120/gate-expectations.json'),evidence={str(p.relative_to(ROOT)):sha(p)for p in OUT.rglob('*.json')if 'attempt'not in str(p)},remaining=['Physical Android/PWA, screen-lock/background, Bluetooth and OS focus acceptance are not established by Linux Chromium.','Digital RMS and peak are not calibrated acoustic loudness or hearing-safety measurements.','Manual sets use optimistic same-browser storage checks, not atomic simultaneous multi-tab transactions.','Timed and changing frequencies use the live audio route; lock continuity depends on device support.'])

def gate_tests():
 name='audio-frequency-browser.json'
 try:d=read(OUT/name)
 except Exception:d={}
 variants=[('valid completed baseline',native_valid(d,name))]
 for key,value in [('finishedAt',None),('fatal','incomplete'),('total',22),('passed',22),('testSha256','0'*64),('testUnchanged',False),('browserExecuted',False),('sourceHashes',{'index':'0'*64,'nero':'0'*64})]:
  x=copy.deepcopy(d);x[key]=value;variants.append((key,not native_valid(x,name)))
 x=copy.deepcopy(d);x['checks']=[d.get('checks',[{}])[0]]*23;variants.append(('duplicate inventory',not native_valid(x,name)))
 x=copy.deepcopy(d);x.pop('sourceHashes',None);variants.append(('missing production binding',not native_valid(x,name)))
 return dict(total=len(variants),passed=sum(x[1]for x in variants),checks=[dict(name=k,rejected=v)for k,v in variants],builderSha256=sha(__file__))
if __name__=='__main__':
 (OUT/'verification-gate.json').write_text(json.dumps(gate_tests(),indent=2)+'\n');report=build();(ROOT/'tests/r1120/verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'accepted':report['boundedCandidateAccepted'],'checks':report['checks']},indent=2));raise SystemExit(0 if report['boundedCandidateAccepted']else 1)
