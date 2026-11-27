"""Derlenen App Bundle'ın içeriğini proje betiklerinden bağımsız olarak denetler.

Kullanım: python3 -I verify_bundle.py PAKET.aab r1278
"""
import base64
import hashlib
import json
import re
import sys
from zipfile import ZipFile

aab_path, release = sys.argv[1], sys.argv[2]
P = "base/assets/sukun/"
ORIGIN = "https://appassets.androidplatform.net"
fails = []


def check(ok, label, detail=""):
    print(("OK   " if ok else "HATA ") + label + (" — " + detail if detail and not ok else ""))
    if not ok:
        fails.append(label)


def sha(data):
    return hashlib.sha256(data).hexdigest()


with ZipFile(aab_path) as z:
    names = set(z.namelist())
    read = z.read
    bad = z.testzip()
    check(bad is None, "paketteki her dosyanın CRC değeri", str(bad or ""))

    # 1. Envanter, paketlenen dosyalarla birebir aynı olmalı.
    inv = json.loads(read(P + f"sukun-site-assets-{release}.json"))
    check(inv["build"] == release, "envanter sürümü " + release, str(inv["build"]))
    site = {n[len(P):] for n in names if n.startswith(P) and not n.endswith("/")}
    listed = {e["path"] for e in inv["files"]}
    extra = site - listed - {f"sukun-site-assets-{release}.json"}
    missing = listed - site
    check(not extra and not missing, "envanter paketteki dosyaları eksiksiz listeliyor",
          f"fazla={sorted(extra)[:3]} eksik={sorted(missing)[:3]}")
    wrong = []
    for entry in inv["files"]:
        if entry["path"] in site:
            data = read(P + entry["path"])
            if sha(data) != entry["sha256"] or len(data) != entry["bytes"]:
                wrong.append(entry["path"])
    check(not wrong, f"{len(inv['files'])} dosyanın SHA-256 ve boyutu envanterle aynı", str(wrong[:3]))

    # 2. Sürüm işaretçisi ve giriş belgeleri.
    marker = json.loads(read(P + f"sukun-build-{release}.json"))
    nero, index = read(P + "nero.html"), read(P + "index.html")
    check(nero == index, "nero.html ile index.html aynı")
    check(marker["shell"]["sha256"] == sha(nero), "işaretçideki kabuk özeti paketteki nero.html ile aynı")
    stale, count = [], 0
    for field in ("runtime", "optionalAudio"):
        for entry in marker[field]:
            url = entry.get("url", "")
            if url.startswith("./") and "sha256" in entry:
                rel = url[2:].split("?")[0].split("#")[0]
                count += 1
                if rel not in site or sha(read(P + rel)) != entry["sha256"]:
                    stale.append(rel)
    check(not stale, f"işaretçideki {count} çalışma zamanı ve ses özeti doğru", str(stale[:3]))

    # 3. Servis çalışanındaki tablolar işaretçiyle aynı olmalı.
    worker = read(P + "sw.js").decode("utf-8")
    for const, field in (("REQUIRED_RUNTIME", "runtime"), ("OPTIONAL_AUDIO", "optionalAudio")):
        found = re.search(rf"const {const} = (\[[\s\S]*?\]);", worker)
        check(bool(found) and json.loads(found.group(1)) == marker[field], f"sw.js {const} tablosu işaretçiyle aynı")

    # 4. Android kabuğu.
    html = nero.decode("utf-8")
    check(f'<meta name="sukun-build" content="{release}"' in html, "kabuk sürümü " + release)
    check(html.count('http-equiv="Content-Security-Policy"') == 1 and "connect-src 'self' data: blob:" in html,
          "tek ve yalnız yerel içerik güvenlik politikası")
    check('id="sukun-android-export"' in html and 'id="sukun-play-local-voices"' in html,
          "Android dışa aktarma ve yerel ses betikleri yerinde")
    check(f"location.origin==='{ORIGIN}'" in html, "Android adres denetimleri yerinde")
    check("SÜKÛN — Android · " + release in html, "alt etiket Android · " + release)
    check('href="./gizlilik.html"' in html and 'href="./open-online-ai"' in html,
          "gizlilik ve çevrimiçi AI bağlantıları yerinde")
    remote = re.findall(r'<(?:link|script|img|audio|video|source|iframe)\b[^>]*\b(?:href|src)="https?://[^"]*"', html)
    check(not remote, "kabuk uzak adresten kaynak yüklemiyor", str(remote[:2]))

    # 5. Bütünlük özeti taşıyan her yerel alt kaynak.
    broken, count = [], 0
    for tag in re.findall(r'<(?:script|link)\b[^>]*\bintegrity="sha256-[^"]+"[^>]*>', html):
        src = re.search(r'\b(?:src|href)="([^"]+)"', tag)
        if not src or re.match(r"[a-z]+:", src.group(1)):
            continue
        expected = re.search(r'integrity="sha256-([^"]+)"', tag).group(1)
        rel = src.group(1).removeprefix("./").split("?")[0].split("#")[0]
        count += 1
        if rel not in site or base64.b64encode(hashlib.sha256(read(P + rel)).digest()).decode() != expected:
            broken.append(rel)
    check(not broken, f"{count} yerel alt kaynağın bütünlük özeti doğru", str(broken[:4]))

    # 6. Kabuktaki yerel bağlantılar pakette karşılık buluyor.
    refs = set(re.findall(r'(?:src|href)="\./([^"?#]+)', html))
    unresolved = sorted(r for r in refs if r not in site and r != "open-online-ai" and not r.endswith("/"))
    check(not unresolved, f"kabuktaki {len(refs)} yerel bağlantı pakette var", str(unresolved[:5]))

    # 7. Paketin web dışındaki bölümü.
    for required in ("base/manifest/AndroidManifest.xml", "base/dex/classes.dex", "base/resources.pb",
                     "base/assets/android-source.zip", "BundleConfig.pb"):
        check(required in names, required + " pakette")

print("\nSONUÇ:", "tüm denetimler geçti" if not fails else f"{len(fails)} denetim başarısız: {fails}")
sys.exit(1 if fails else 0)
