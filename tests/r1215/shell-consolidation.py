#!/usr/bin/env python3
"""Exact owner/order and fail-closed extraction checks; no browser claims."""
from pathlib import Path
import importlib.util
import tempfile
import subprocess
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('consolidate', ROOT / 'tools/consolidate-shell-r1215.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Consolidation(unittest.TestCase):
    def source(self):
        # Classic top-level declarations span owners; execution must remain in
        # the exact same order. The fake script in a comment is parser CDATA.
        scripts = ''.join('<script id="' + owner + '">\n' +
                          ('const shared=41; /* <script> is a comment */' if i == 0 else 'globalThis.answer=shared+1;') +
                          '\n</script>' for i, owner in enumerate(module.SCRIPT_IDS))
        return '<!doctype html><style id="embFonts">@font-face{src:url(data:font/woff2;base64,AA==)}</style>' + \
               '<style>/*' + 'x' * 200001 + '*/body{color:white}</style>' + scripts + \
               '<style id="r699-layout-authority">body{display:block}</style>'

    def test_exact_bodies_order_and_idempotency(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.source()
            transformed, writes, manifest = module.plan(root, source)
            self.assertEqual(len(writes), 3)
            self.assertNotIn(' defer', transformed)
            self.assertNotIn(' async', transformed)
            for relative, raw in writes.items():
                file = root / relative
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(raw)
            again, next_writes, second = module.plan(root, transformed)
            self.assertEqual(again, transformed)
            self.assertEqual(next_writes, {})
            self.assertTrue(all(row['existing'] for row in second))
            # The shared current-source test loader reconstructs identical raw
            # HTML, so existing function contracts continue testing actual code.
            (root / 'nero.html').write_text(transformed)
            command = ['node', '-e', 'process.stdout.write(require(process.argv[1]).readShippedShell(process.argv[2]))',
                       str(ROOT / 'tests/helpers/shipped-shell.cjs'), str(root / 'nero.html')]
            restored = subprocess.check_output(command, text=True)
            self.assertEqual(restored, source)

    def test_fragment_css_stays_manual(self):
        with self.assertRaisesRegex(ValueError, 'Unsafe external CSS URL'):
            module.css_safe('svg{filter:url(#filter)}')
        with self.assertRaisesRegex(ValueError, 'Unsafe external CSS URL'):
            module.css_safe('body{background:url(./assets/scene.webp)}')

    def test_source_drift_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            transformed, writes, _ = module.plan(root, self.source())
            for relative, raw in writes.items():
                file = root / relative
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(raw)
            (root / next(iter(writes))).write_text('changed')
            with self.assertRaisesRegex(ValueError, 'source drift'):
                module.plan(root, transformed)

    def test_prior_script_extraction_is_restored_exactly(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.source()
            candidate = source
            for owner in module.SCRIPT_IDS:
                match = re.search('<script id="' + owner + '">(.*?)</script>', source, re.S)
                body = match[1].encode()
                relative = 'assets/runtime/' + owner + '.js'
                file = root / relative
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(body)
                external = '<script id="' + owner + '" src="./' + relative + '?v=r1215" data-sukun-extracted="' + owner + '" data-sukun-source-sha256="' + module.digest(body) + '"></script>'
                candidate = candidate.replace(match[0], external)
            restored, writes, manifest = module.plan(root, candidate)
            self.assertEqual(len(manifest), 3)
            self.assertTrue(all(row['path'].endswith('.css') for row in manifest))
            for owner in module.SCRIPT_IDS:
                pattern = '<script id="' + owner + '">(.*?)</script>'
                self.assertEqual(re.search(pattern, restored, re.S)[1], re.search(pattern, source, re.S)[1])
            self.assertNotRegex(restored, '<script[^>]+src=')

    def test_shipped_plan(self):
        source = (ROOT / 'nero.html').read_text()
        result, writes, manifest = module.plan(ROOT, source)
        self.assertEqual(len(manifest), 3)
        self.assertEqual([x['owner'] for x in manifest if x['path'].endswith('.js')], [])
        if writes:
            self.assertGreater(len(source.encode()) - len(result.encode()), 500_000)


if __name__ == '__main__':
    unittest.main()
