"""Apply the Play-specific local policy and text to a staged Android r1278 site."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PRIVACY = 'Gizlilik politikası'
WELLNESS = ('Sükûn, zikir ve tefekkür eşliğinde dinleme ve nefes egzersizleri sunar. '
            'Tıbbi cihaz değildir. Hastalıkların tanı, tedavi veya önlenmesi amacıyla kullanılmaz. '
            'Sağlığınla ilgili sorular için bir sağlık uzmanına danış.')
OFFLINE = ('Tefekkür düzeni cihazında hazırlanır. Yazdıkların çevrimiçi bir yapay zekâ hizmetine gönderilmez.')
AI_LINK = 'Ücretsiz çevrimiçi AI’ı tarayıcıda aç'
AI_DETAIL = 'Tarayıcıda Sükûn’un web sürümü açılır. Uygulamadaki metinlerin ve kayıtların aktarılmaz.'
TRANSLATIONS = {
    PRIVACY: 'Privacy policy',
    AI_LINK: 'Open free online AI in the browser',
    AI_DETAIL: 'This opens Sükûn on the web. Your text and recordings stay in the Android app.',
    OFFLINE: 'Contemplation sessions are prepared on your device. Your words are not sent to an online AI service.',
    WELLNESS: 'Sükûn offers devotional listening and breathing exercises. It is not a medical device and is not intended to diagnose, treat, cure or prevent disease. Consult a healthcare professional for health advice.',
}
OLD_HINT = ('💡 Tefekkür düzeni tamamen cihazında, çevrimdışı kurulur. İstersen Ayarlar → «AI sağlayıcıları» '
            'bölümüne bir veya birkaç API anahtarı girip 🪄 ile daha derin açıklama alabilirsin. Bir sağlayıcı '
            'çalışmazsa sistem sıradakine geçer. Bu bir tıbbî tavsiye değildir; tasavvufî bir tefekkür ve dinginlik aracıdır.')


def single(text, marker, replacement):
    if text.count(marker) != 1:
        raise ValueError(f'Unexpected number of occurrences: {marker[:100]}')
    return text.replace(marker, replacement, 1)


def build_shell(text):
    if 'id="sukun-play-local-voices"' in text:
        return text
    if '<meta name="sukun-build" content="r1278"' not in text:
        raise ValueError('Expected the r1278 shell')
    anchor = '<script id="sukun-android-export">'
    script = (HERE / 'local-voices.js').read_text(encoding='utf-8')
    style = ('<style id="sukun-play-network-controls">'
             '#aiProvidersBox,[data-rxai],#adaptiveSessionPanel .adaptAsk{display:none!important}'
             '.playPrivacyLink{display:inline-block;padding:.5em;color:inherit;text-decoration:underline;'
             'text-underline-offset:.16em;font-size:14px}</style>')
    text = single(text, anchor, f'<script id="sukun-play-local-voices">{script}</script>{style}\n' + anchor)
    link = f'<a class="playPrivacyLink" href="./gizlilik.html">{PRIVACY}</a>'
    web_ai = (f'<a class="playPrivacyLink" href="./open-online-ai">{AI_LINK}</a>'
              f'<p class="hint">{AI_DETAIL}</p>')
    settings = '<div class="aikeyBox" id="aiProvidersBox">'
    text = single(text, settings, web_ai + '\n' + settings)
    text = single(text, '<section id="sukunDiscovery"', link + '\n<section id="sukunDiscovery"')
    text = single(text, '<div class="genNot">Kaydederken uygulanır', link + '\n<div class="genNot">Kaydederken uygulanır')
    text = single(text, '<p class="hint">' + OLD_HINT + '</p>',
                  f'<p class="hint">{OFFLINE}</p>{web_ai}<p class="hint">{WELLNESS}</p>')
    text = single(text, '<footer>', f'<footer>\n<p class="hint">{WELLNESS}</p>')
    text = single(text, 'window.I18N=I18N;', f'Object.assign(I18N.D,{json.dumps(TRANSLATIONS,ensure_ascii=False)});\nwindow.I18N=I18N;')
    text = text.replace('5.5 sn giriş · 5.5 sn çıkış; kalp ritmini dengeler.', '5,5 saniye nefes al, 5,5 saniye ver.')
    text = text.replace('5.5 s in · 5.5 s out; balances the heart rhythm.', 'Breathe in for 5.5 seconds, then out for 5.5 seconds.')
    text = text.replace('tiz ağırlıklı — tinnitus maskeleme, keskin odak', 'tiz ağırlıklı, parlak bir ses dokusu')
    return text.replace('treble-weighted — tinnitus masking, sharp focus', 'a bright, treble-weighted sound texture')


def atomic_write(dest, data):
    if dest.is_file() and dest.read_bytes() == data:
        return
    tmp = dest.with_name(dest.name + '.play-tmp')
    tmp.write_bytes(data)
    tmp.replace(dest)


def apply(site):
    first = (site / 'nero.html').read_bytes()
    if first != (site / 'index.html').read_bytes():
        raise ValueError('The two staged r1278 shell entries must match')
    shell = build_shell(first.decode('utf-8'))
    # The native host deliberately has no service worker. A port from the singleTask
    # Activity authenticates the only top-level document able to modify this app's data.
    guard = site / 'assets/runtime/recovery-versions-r1019.js'
    prefix = 'async function assertSingleClient(lease){lease?.assertCurrent?.();'
    native = 'if(window.SukunAndroidSingleWindow?.()===true)return true;'
    source = guard.read_text(encoding='utf-8')
    if prefix + native not in source:
        adapted = single(source, prefix, prefix + native)
        def sri(text):
            return 'sha256-' + base64.b64encode(hashlib.sha256(text.encode('utf-8')).digest()).decode('ascii')
        shell = single(shell, 'integrity="' + sri(source) + '"', 'integrity="' + sri(adapted) + '"')
        atomic_write(guard, adapted.encode('utf-8'))
    for filename in ('nero.html', 'index.html'):
        atomic_write(site / filename, shell.encode('utf-8'))
    atomic_write(site / 'gizlilik.html', (HERE / 'gizlilik.html').read_bytes())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('site', type=Path)
    apply(parser.parse_args().site.resolve())
