"""Adapt the verified r1278 web entry point for the bundled Android origin."""
import re
from pathlib import Path

ORIGIN = 'https://appassets.androidplatform.net'
POLICY = ("default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; "
          "style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; "
          "media-src 'self' data: blob:; connect-src 'self' data: blob:; worker-src 'self' blob:; "
          "object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'self'")


def replace_once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Unexpected Android shell input: '+before[:68])
    return source.replace(before, after, 1)


def android_shell(source: bytes) -> bytes:
    html = source.decode('utf-8')
    version = re.search(r'<meta name="sukun-build" content="(r\d+)"', html).group(1)
    if version != 'r1278':
        raise ValueError('Unsupported Android source release '+version)
    html, count = re.subn(r'<meta content="[^"]*" http-equiv="Content-Security-Policy"\s*/>', '', html)
    if count != 1:
        raise ValueError('Unexpected Content-Security-Policy count')
    # WebView enforces a local-only policy before the first application script.
    script = Path(__file__).with_name('export-android.js').read_text('utf-8')
    if '</script' in script.lower():
        raise ValueError('Unexpected closing tag inside Android export script')
    header = (f'<head>\n<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="{POLICY}">'
              f'\n<script id="sukun-android-export">{script}</script>\n'
              '<style>#r1095ImagePack,#r1213AudioPack,#r1165FooterUpdate{display:none!important}</style>')
    html = replace_once(html, '<head>', header)
    # The upstream footer has more-specific !important styles. Removing the web
    # update button also keeps it out of TalkBack and keyboard navigation.
    html, count = re.subn(r'<div id="r1165FooterUpdate" data-noi18n>.*?</div>', '', html, flags=re.S)
    if count != 1:
        raise ValueError('Unexpected update footer count')
    html = re.sub(r'<link\b[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>', '', html)
    html = replace_once(html, "if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)){",
                        f"if(location.origin==='{ORIGIN}'||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)){{")
    html = replace_once(html, "  const s=window.SukunUpdateManager?.snapshot?.();\n  const controller=s?.controllerVersion||'';",
                        f"""  if(location.origin==='{ORIGIN}'){{
    label.setAttribute('data-i18n-owned','');label.textContent='SÜKÛN — Android · '+build;
    label.dataset.sukunBuild=build;return;
  }}
  const s=window.SukunUpdateManager?.snapshot?.();
  const controller=s?.controllerVersion||'';""")
    html = replace_once(html, 'SÜKÛN — Uygulama r963 · SW denetleniyor…', 'SÜKÛN — Android · '+version)
    # The classic home header used an inline geometric crest, independent of the splash artwork.
    # Keep the alternate Berhetiyye theme's own CSS-driven header intact.
    html, count = re.subn(r'<span class="logo shimmer-logo">.*?</svg>.*?</span>',
        '<span class="logo shimmer-logo"><img class="play-home-mark" aria-hidden="true" alt="" '
        'width="110" height="110" src="./assets/branding/sukun-frameless-logo-r1029.png?v=r1278"></span>',
        html, count=1, flags=re.S)
    if count != 1:
        raise ValueError("Missing classic home mark")
    style = ('<style id="sukun-play-home-mark">'
             '.wrap>header .play-home-mark{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}'
             'html[data-r1074-theme="berhet"] .wrap>header .play-home-mark{display:none!important}'
             '</style>')
    html = replace_once(html, '</head>', style + '</head>')
    return html.encode('utf-8')
