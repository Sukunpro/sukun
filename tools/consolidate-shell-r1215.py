#!/usr/bin/env python3
"""Extract cacheable legacy CSS without changing script execution timing.

Default is a read-only plan. --apply writes exact owner bodies and replaces
their tags at their original parser positions in both identical entrypoints.
Classic core scripts intentionally stay inline: network pauses between them
can admit boot timers before later core bindings exist. A previous experimental
script extraction is restored exactly when encountered. Compatibility anchors,
JSON data and styles using document fragments remain.
"""
import argparse
import base64
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
import re

SCRIPT_IDS = [
    'r514-core-icons-ambience', 'r514-core-zikir-sentez',
    'r514-core-letaif-kayit', 'r514-core-akis-nefs', 'r514-core-yedek-vird',
]
STYLE_IDS = ['embFonts', 'r699-layout-authority']
MARKER = 'data-sukun-extracted'


def digest(data):
    return hashlib.sha256(data).hexdigest()


class Owners(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0] + [m.end() for m in re.finditer('\n', source)]
        self.items = []
        self.active = None
        self.feed(source)

    def position(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag not in ('script', 'style', 'link'):
            return
        start = self.position()
        raw = self.get_starttag_text()
        row = dict(tag=tag, attrs=dict(attrs), start=start, content_start=start + len(raw), raw=raw)
        if tag == 'link':
            row.update(end=row['content_start'], content='')
            self.items.append(row)
        else:
            assert self.active is None, 'Overlapping script/style owners'
            self.active = row

    def handle_endtag(self, tag):
        if not self.active or tag != self.active['tag']:
            return
        row = self.active
        end_start = self.position()
        end = self.source.index('>', end_start) + 1
        row.update(content=self.source[row['content_start']:end_start], end=end)
        self.items.append(row)
        self.active = None


def css_safe(source):
    # These selected owners currently use only data: URLs. Refuse extraction
    # if a future edit introduces document-relative or fragment semantics.
    if re.search(r'@import\b', source, re.I):
        raise ValueError('Stylesheet @import requires explicit migration')
    for raw in re.findall(r'url\(\s*(.*?)\s*\)', source, re.I | re.S):
        url = raw.strip(' \t\r\n\"\'')
        if not re.match(r'^(?:data:|https?://)', url, re.I):
            raise ValueError('Unsafe external CSS URL: ' + url[:100])


def plan(root, html):
    owners = Owners(html).items
    replacements, writes, manifest = [], {}, []
    seen = set()
    for owner in owners:
        attrs, tag, body = owner['attrs'], owner['tag'], owner['content']
        old_id = attrs.get('id')
        extracted = attrs.get(MARKER)
        # One known anonymous base stylesheet: unique >200KB style, no ID.
        base_style = tag == 'style' and not old_id and len(body.encode()) > 200000
        selected = (tag == 'style' and old_id in STYLE_IDS) or base_style
        if extracted:
            file = attrs.get('src') or attrs.get('href')
            if not file or not file.startswith('./'):
                raise ValueError('Invalid extracted owner reference')
            rel = file.split('?', 1)[0][2:]
            if '..' in Path(rel).parts or not (root / rel).is_file():
                raise ValueError('Missing extracted source: ' + rel)
            content = (root / rel).read_bytes()
            expected = attrs.get('data-sukun-source-sha256')
            if expected != digest(content):
                raise ValueError('Extracted owner source drift: ' + rel)
            if tag == 'script' and any(key in attrs for key in ('async', 'defer', 'type')):
                raise ValueError('Extracted script execution mode changed')
            if tag == 'script':
                # Classic-script network pauses can admit timers between core
                # owners. Restore their atomic parser sequence until their
                # initialization is explicitly gated by a single boot owner.
                replacements.append((owner['start'], owner['end'], '<script id="' + extracted + '">' + content.decode('utf-8') + '</script>'))
                continue
            seen.add(extracted)
            manifest.append(dict(owner=extracted, path=rel, bytes=len(content), sha256=digest(content), existing=True))
            continue
        if not selected:
            continue
        owner_id = old_id or 'legacy-base-style-r1215'
        if owner_id in seen:
            raise ValueError('Duplicate extracted owner: ' + owner_id)
        seen.add(owner_id)
        raw = body.encode('utf-8')
        sha = digest(raw)
        sri = base64.b64encode(hashlib.sha256(raw).digest()).decode()
        css_safe(body)
        rel = 'css/legacy-r1215-' + owner_id.replace('legacy-', '').replace('-r1215', '') + '.css'
        replacement = '<link rel="stylesheet" id="' + owner_id + '" href="./' + rel + '?v=r1215"'
        replacement += ' integrity="sha256-' + sri + '" crossorigin="anonymous" ' + MARKER + '="' + owner_id + '" data-sukun-source-sha256="' + sha + '">'
        writes[rel] = raw
        replacements.append((owner['start'], owner['end'], replacement))
        manifest.append(dict(owner=owner_id, path=rel, bytes=len(raw), sha256=sha, existing=False))
    expected = set(STYLE_IDS + ['legacy-base-style-r1215'])
    if seen != expected:
        raise ValueError('Expected owners missing or unexpected: ' + repr(expected ^ seen))
    result = html
    for start, end, replacement in reversed(replacements):
        result = result[:start] + replacement + result[end:]
    # IDs and parser script ordering remain the same, including classic
    # lexical scope boundaries; only the formerly anonymous CSS gains an ID.
    before_scripts = [x['attrs'].get('id') for x in owners if x['tag'] == 'script']
    result_owners = Owners(result).items
    after_scripts = [x['attrs'].get('id') for x in result_owners if x['tag'] == 'script']
    assert before_scripts == after_scripts, 'Script owner/order changed'
    core = [x for x in result_owners if x['tag'] == 'script' and x['attrs'].get('id') in SCRIPT_IDS]
    assert [x['attrs']['id'] for x in core] == SCRIPT_IDS, 'Core parser order changed'
    assert all(not x['attrs'].get('src') and x['content'].strip() for x in core), 'Core initialization must remain inline'
    return result, writes, manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    nero, index = root / 'nero.html', root / 'index.html'
    source = nero.read_text()
    if index.read_bytes() != nero.read_bytes():
        raise ValueError('Entrypoints differ; consolidate only after integrating both')
    result, writes, manifest = plan(root, source)
    # Complete validation before writes. Refuse to overwrite an unrelated file.
    for path, content in writes.items():
        target = root / path
        if target.exists() and target.read_bytes() != content:
            raise ValueError('Extraction target already differs: ' + path)
    if args.apply:
        for path, content in writes.items():
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        if result != source:
            nero.write_text(result)
            index.write_text(result)
    print(json.dumps(dict(applied=args.apply, originalBytes=len(source.encode()),
                          shellBytes=len(result.encode()), removedInlineBytes=len(source.encode()) - len(result.encode()),
                          owners=manifest), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
