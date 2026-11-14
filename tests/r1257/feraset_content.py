#!/usr/bin/env python3
"""Validate the full supplied prayer and its accessible entry in both app pages."""
from hashlib import sha256
from html import unescape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
EXPECTED = '8ad1e9db66b240e965e74c8a1305b79414e26bf93b3bd5f2f50e74432f5cf662'
rendered = []
for page in ('index.html', 'nero.html'):
    html = (ROOT / page).read_text(encoding='utf-8')
    assert html.count('id="ferasetBox"') == 1, page
    assert 'Feraset, Basiret ve Hikmet Duası</summary>' in html, page
    group = re.search(r"id:'zmgOkumalar'.*?items:\[(.*?)\]", html)
    assert group and "'ferasetBox'" in group.group(1), page
    blocks = re.findall(r'<pre id="ferasetText"[^>]*>(.*?)</pre>', html, flags=re.S)
    assert len(blocks) == 1, page
    text = unescape(blocks[0])
    assert sha256(text.encode('utf-8')).hexdigest() == EXPECTED, page
    for fragment in ('هُوَ الَّذِي يُصَلِّي عَلَيْكُمْ', 'Hüvellezî yusallî aleyküm',
                     'Sizi karanlıklardan aydınlığa çıkarmak', '[Ahzâb 33/43]',
                     'Âmin yâ Rabbi’l-âlemîn.'):
        assert fragment in text, (page, fragment)
    rendered.append(text)
assert rendered[0] == rendered[1]
print('Feraset content and Ahzâb 33/43: both entry pages OK')
