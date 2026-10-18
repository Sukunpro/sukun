#!/usr/bin/env python3
"""Exercise the actual release finalizer without writing production metadata."""
import importlib.util
import json
from pathlib import Path
import re
import sys

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("release_finalize", root / "tools/release_finalize.py")
finalizer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(finalizer)
results = []


def check(name, condition):
    assert condition, name
    results.append({"name": name, "passed": True})


source = """const SURUM = 'r1095';
const CACHE_META = './sukun-cache-meta-r1095.json';
const BUILD_MARKER = './sukun-build-r1095.json';
const IMAGE_PACK_MANIFEST='./assets/runtime/image-pack-manifest-r1095.json';
const RUNTIME='./assets/runtime/offline-images-ui-r1095.js?v=r1095';
const INVENTORY='./sukun-site-assets-r1095.json?v=r1095';
if(manifest.version!=='r1095')throw Error('image-manifest');
/* r1095 catalog implementation */
"""
updated = finalizer.worker_release_identity(source, "r1095", "r1096")
for text in (
    "const SURUM = 'r1096';",
    "const CACHE_META = './sukun-cache-meta-r1096.json';",
    "const BUILD_MARKER = './sukun-build-r1096.json';",
    "./assets/runtime/offline-images-ui-r1095.js?v=r1096",
    "./sukun-site-assets-r1096.json?v=r1096",
    "const IMAGE_PACK_MANIFEST='./assets/runtime/image-pack-manifest-r1095.json';",
    "manifest.version!=='r1095'",
    "/* r1095 catalog implementation */",
):
    check(text, text in updated)
check("Repeated finalization is idempotent", finalizer.worker_release_identity(updated, "r1095", "r1096") == updated)
try:
    finalizer.worker_release_identity(source.replace("const SURUM = 'r1095';", "const SURUM = 'r1094';"), "r1095", "r1096")
except AssertionError:
    check("Unexpected source release is rejected", True)
else:
    raise AssertionError("Unexpected source release must be rejected")

actual = (root / "sw.js").read_text()
current = re.search(r"^const SURUM\s*=\s*'(r\d+)';", actual, re.M)[1]
future = "r" + str(int(current[1:]) + 1)
next_release = finalizer.worker_release_identity(actual, current, future)
for pattern in (r"^const IMAGE_PACK_MANIFEST=.*$", r"^.*manifest\.version!==.*$", r"^const IMAGE_PACK_SHA256.*$"):
    check("Production immutable catalog field " + pattern, re.findall(pattern, next_release, re.M) == re.findall(pattern, actual, re.M))
check("Production runtime asset filenames stay unchanged", re.findall(r"\./assets/[^'\"?\s]+", next_release) == re.findall(r"\./assets/[^'\"?\s]+", actual))
print(json.dumps({"suite": "release identity preserves immutable dependencies", "passed": len(results), "total": len(results), "results": results}, indent=2))
