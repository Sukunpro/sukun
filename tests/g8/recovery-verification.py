"""Create a manifest of the recovered release and its fresh evidence, without changing production."""
import json,hashlib,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256((root/p).read_bytes()).hexdigest()
e='tests/g8/evidence/recovery-20261020/'
files=['integrity','owner-continuity','surface','personal-centre','ready-theme','offline-controlled','image-pack-controlled','baseline-native-audio','candidate-native-audio','candidate-frequency-hub','ambience-native-interaction','service-worker-upgrade','visual']
checks=[]
for name in files:
 p=e+name+'.json';d=json.loads((root/p).read_text());total=d.get('total',d.get('expectedChecks',len(d.get('checks',[]))));passed=d.get('passed');checks.append(dict(path=p,sha256=sha(p),passed=passed,total=total,ok=passed==total and total>0 and not d.get('fatal')))
production=['index.html','nero.html','sw.js','sukun-build-r1118.json','sukun-site-assets-r1118.json']
report=dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),build='r1118',baseline='5459587e2a4ce794683908c1b098076b3f2eb081',evidenceOrigin='Reconstructed missing test harnesses and freshly rerun checks after workspace loss; production bytes recovered unchanged from reviewed persisted update ZIP.',updateZipSha256='ab5ac0ef57bc8a34ddbfa0017894e92a507179ea8934a0c0a14d2a7656c656bb',production={p:sha(p) for p in production},checks=checks,boundedBatchAccepted=all(x['ok'] for x in checks),globalG8Complete=False,productionPublished=False,remaining=['Fourth historical panel identity not verified; preserved inline.','Physical Android, audible output, screen lock and OS audio focus not verified.'],interactionScope='390px Turkish native interaction; responsive shell/family equivalence separately covers 320/390/430/1280px.',mapEvidence='tests/g8/recovered-map-results.json')
(root/'tests/g8/current-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'accepted':report['boundedBatchAccepted'],'checks':[(x['path'],x['passed'],x['total']) for x in checks]},indent=2))
