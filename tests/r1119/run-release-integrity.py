#!/usr/bin/env python3
"""Run the unchanged release collector without overwriting historical evidence."""
from pathlib import Path
import datetime, hashlib, json, shutil, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
build=(ROOT/'version.txt').read_text().strip()
inputs=['index.html','nero.html','sw.js','sukun-build-'+build+'.json','sukun-site-assets-'+build+'.json','assets/runtime/health-r940.js']
before={p:sha(ROOT/p) for p in inputs}
collectors=['tools/release-integrity.cjs','tools/css-assets.cjs']
with tempfile.TemporaryDirectory(prefix='r1119-integrity-') as directory:
    tmp=Path(directory)
    for name in collectors:shutil.copyfile(ROOT/name,tmp/Path(name).name)
    result=subprocess.run(['node',str(tmp/'release-integrity.cjs'),str(ROOT)],capture_output=True,text=True)
    (ROOT/'tests/r1119/evidence/integrity.log').write_text(result.stdout+result.stderr)
    report=json.loads((tmp/'release-integrity-results.json').read_text())
assert before=={p:sha(ROOT/p) for p in inputs},'Source changed while checking integrity'
report.update(sourceSha256=before,testSourceSha256={p:sha(ROOT/p) for p in collectors},runnerSha256=sha(Path(__file__)),finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
(ROOT/'tests/r1119/evidence/integrity.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['passed','total']}))
raise SystemExit(result.returncode)
