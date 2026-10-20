#!/usr/bin/env python3
"""Re-run the documented r1048 controlled aggregate against final r1119 bytes.

The historical collector recursively selects later browser/helpers too. Freeze
its original range through r1048 here; newer G6/G7/G8 suites are separate results.
Temporary fixture copies live outside the source tree, never under tests/.
"""
from pathlib import Path
import argparse, concurrent.futures, importlib.util, json, re, shutil, subprocess, tempfile, time, sys, hashlib
sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('historical_runner', ROOT/'tests/r1048/run-regressions.py')
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path, default=ROOT/'tests/r1119/evidence/controlled-aggregate')
    args = parser.parse_args()
    source, output = args.root.resolve(), args.output.resolve()
    source_hash=hashlib.sha256((source/'index.html').read_bytes()).hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    selected = []
    for script in sorted((ROOT/'tests').rglob('*.cjs')):
        name = script.relative_to(ROOT).as_posix()
        parts = script.relative_to(ROOT/'tests').parts
        if len(parts)>1 and not (re.fullmatch(r'r\d+',parts[0]) and int(parts[0][1:])<=1048):
            continue
        if name in legacy.EXCLUDED or name==legacy.STATIC or 'fixture.cjs' in name:
            continue
        selected.append(name)
    with tempfile.TemporaryDirectory(prefix='sukun-r1119-fixtures-') as temp:
        workspace = Path(temp)
        shutil.copytree(ROOT/'tests', workspace/'tests', ignore=shutil.ignore_patterns('evidence','__pycache__'))
        for name in ['index.html','nero.html']:
            shutil.copyfile(source/name, workspace/name)
        shutil.copytree(source/'assets/runtime',workspace/'assets/runtime')
        wav='assets/audio/sukun-intro-signature-r1037.wav'
        (workspace/wav).parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(source/wav,workspace/wav)
        def run(name):
            argument=source/'index.html' if name in ['tests/recording-storage.cjs','tests/interaction_gate_lifecycle.cjs'] else source
            start=time.monotonic()
            try:
                r=subprocess.run(['node',str(workspace/name),str(argument)],cwd=source,capture_output=True,text=True,timeout=90)
                stdout,stderr,code=r.stdout,r.stderr,r.returncode
            except subprocess.TimeoutExpired as e:
                stdout=e.stdout.decode() if isinstance(e.stdout,bytes) else e.stdout or ''
                stderr=e.stderr.decode() if isinstance(e.stderr,bytes) else e.stderr or ''
                code='timeout'
            log=name.replace('/','_')+'.txt'
            (output/log).write_text(stdout+'\nSTDERR:\n'+stderr)
            return dict(script=name,exitCode=code,seconds=round(time.monotonic()-start,3),outputFile=log,summary=legacy.parsed_summary(stdout))
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results=list(pool.map(run,selected))
    assert source_hash==hashlib.sha256((source/'index.html').read_bytes()).hexdigest(), 'Production changed during aggregate execution'
    report=dict(sourceRoot=str(source),sourceBuild=(source/'version.txt').read_text().strip(),sourceSha256=source_hash,healthSha256=hashlib.sha256((source/'assets/runtime/health-r940.js').read_bytes()).hexdigest(),markerSha256=hashlib.sha256((source/('sukun-build-'+(source/'version.txt').read_text().strip()+'.json')).read_bytes()).hexdigest(),testSourceSha256={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in selected},runnerSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),method='Original r1048 controlled aggregate range only, explicit historical exclusions retained; later suites and native browser acceptance are separate.',groups=len(results),passedGroups=sum(x['exitCode']==0 for x in results),excluded=legacy.EXCLUDED,results=results)
    (output/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
    print(json.dumps([r for r in results if r['exitCode']!=0],indent=2))
    return int(report['passedGroups']!=report['groups'])
if __name__=='__main__':
    raise SystemExit(main())
