#!/usr/bin/env python3
"""Run the bounded G6/G7/CSS/map source checks and bind their exact inputs."""
from pathlib import Path
import hashlib, json, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tests/r1120/evidence'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=sha(ROOT/'index.html')
suites=['r1107/storage-snapshot','r1107/storage-snapshot-ui','r1108/kandil-preferences','r1108/health-presentation-context','r1108/presentation-notice','r1109/category-flow-extraction','r1110/tooltip-help-extraction','r1111/notification-layout-extraction','r1111/css-assets','r1112/tekke-set-card-extraction','r1029/ui-surface-contract','r1031/personal-centre-glass','r1112/ambience-ready-theme','g8/visual-reference-map','g8/wheel-catalog-map','g8/wheel-map-integration','g8/dynamic-visual-map']
summary=[]
for name in suites:
    dest=OUT/(name.replace('/','-')+'.json')
    direct=name.startswith('g8/') or name in ['r1029/ui-surface-contract','r1031/personal-centre-glass']
    args=['node',str(ROOT/('tests/'+name+'.cjs'))]
    if not name.startswith('g8/'):args.append(str(ROOT))
    if not direct:args.append(str(dest))
    result=subprocess.run(args,cwd=ROOT,capture_output=True,text=True)
    dest.with_suffix('.log').write_text(result.stdout+result.stderr)
    if direct:dest.write_text(result.stdout)
    data=json.loads(dest.read_text())
    row=dict(suite=name,exitCode=result.returncode,passed=data.get('passed'),total=data.get('total'),report=str(dest.relative_to(ROOT)))
    summary.append(row);print(row,flush=True)
(OUT/'controlled-regression-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
with tempfile.TemporaryDirectory(prefix='r1120-allowlist-') as directory:
    script=Path(directory)/'test.cjs';script.write_bytes((ROOT/'tests/r1105/health-entry-allowlist.cjs').read_bytes())
    result=subprocess.run(['node',str(script),str(ROOT)],capture_output=True,text=True)
    (OUT/'health-entry-allowlist.json').write_text(result.stdout)
    (OUT/'health-entry-allowlist.log').write_text(result.stderr)
    assert result.returncode==0,result.stderr
for mode,dest in [('output','map-generation.log'),('check','map-check.json')]:
    result=subprocess.run(['node','tools/visual-reference-map.cjs','--root','.',f'--{mode}','tests/r1120/visual-reference-map.json'],cwd=ROOT,capture_output=True,text=True)
    (OUT/dest).write_text(result.stdout+result.stderr);assert result.returncode==0,result.stderr
assert source==sha(ROOT/'index.html'),'Production changed while source checks ran'
paths=[row['report'] for row in summary]+['tests/r1120/evidence/health-entry-allowlist.json','tests/r1120/visual-reference-map.json']
binding=dict(sourceSha256=source,healthSha256=sha(ROOT/'assets/runtime/health-r940.js'),markerSha256=sha(ROOT/'sukun-build-r1120.json'),reports={p:sha(ROOT/p) for p in paths},tests={name:sha(ROOT/('tests/'+name+'.cjs')) for name in suites})
(OUT/'controlled-source-binding.json').write_text(json.dumps(binding,indent=2)+'\n')
if any(row['exitCode'] or row['passed']!=row['total'] for row in summary):raise SystemExit(1)
