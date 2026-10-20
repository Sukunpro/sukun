#!/usr/bin/env python3
"""Fail-closed regression for completed-only native evidence acceptance."""
from pathlib import Path
import copy, datetime, hashlib, json
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'tests/r1119/build-verification.py'
# Load only the gate definitions, without running report construction.
ns={'__file__':str(source)}
exec(compile(source.read_text().split('\ndef entry(',1)[0],str(source),'exec'),ns)
checks=[]
def check(name,value):
    checks.append(dict(name=name,passed=bool(value)))
for kind,(total,script,labels) in ns['NATIVE_EXPECTATIONS'].items():
    d=dict(finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),testSha256=ns['sha'](ROOT/script),profiles=[dict(label=x) for x in labels])
    if kind=='native-panel':d.update(stage='complete',status='passed',completedMatrixStates=128,matrix=[{}]*128,plannedCoverage=dict(matrixStates=128))
    check(kind+': complete bounded fixture accepted',ns['native_complete'](d,kind,total))
    x=copy.deepcopy(d);x.pop('finishedAt');check(kind+': in-progress passing prefix rejected',not ns['native_complete'](x,kind,total))
    check(kind+': truncated check count rejected',not ns['native_complete'](d,kind,total-1))
    x=copy.deepcopy(d);x['testSha256']='0'*64;check(kind+': stale collector rejected',not ns['native_complete'](x,kind,total))
    if labels:
        x=copy.deepcopy(d);x['profiles'][0]['pending']=True;check(kind+': pending profile rejected',not ns['native_complete'](x,kind,total))
        x=copy.deepcopy(d);x['profiles'][0]['fatal']='fixture failure';check(kind+': fatal profile rejected',not ns['native_complete'](x,kind,total))
        x=copy.deepcopy(d);x['profiles'].pop();check(kind+': missing profile rejected',not ns['native_complete'](x,kind,total))
    if kind=='native-panel':
        x=copy.deepcopy(d);x['matrix'].pop();check(kind+': partial matrix rejected',not ns['native_complete'](x,kind,total))
        x=copy.deepcopy(d);x['diagnosticOnly']=True;check(kind+': diagnostic-only run rejected',not ns['native_complete'](x,kind,total))
report=dict(suite='Completed native evidence gate',finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),checks=checks,total=len(checks),passed=sum(x['passed'] for x in checks),sourceSha256=ns['shell'],verificationBuilderSha256=ns['sha'](source),testSha256=ns['sha'](Path(__file__)))
(ROOT/'tests/r1119/evidence/verification-gate.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['passed','total']}))
assert report['passed']==report['total']
