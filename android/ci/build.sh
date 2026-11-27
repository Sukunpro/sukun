#!/usr/bin/env bash
# Sükûn Android paketi: depodaki web sürümünden imzasız App Bundle (AAB) üretir.
# Adımlar android/BUILD.txt ile aynıdır; sürüm kimliği version.txt dosyasından alınır.
#
# Gerekenler: Python 3.11+, OpenJDK 21 ve şu ortam değişkenleri:
#   SDK         Android SDK "platforms/android-36" klasörü
#   BUILDTOOLS  Android SDK "build-tools/36.0.0" klasörü
#   BUNDLETOOL  bundletool 1.18.3 jar dosyasının yolu
#   SEQ         aynı web sürümü için kaçıncı paket (1-999, varsayılan 1)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(dirname "$HERE")"
REPO="$(dirname "$APP")"
: "${SDK:?SDK tanımlı değil}" "${BUILDTOOLS:?BUILDTOOLS tanımlı değil}" "${BUNDLETOOL:?BUNDLETOOL tanımlı değil}"
SEQ="${SEQ:-1}"

REL="$(tr -d '\r\n' < "$REPO/version.txt")"
[[ "$REL" =~ ^r[1-9][0-9]*$ ]] || { echo "version.txt beklenmeyen değer: $REL" >&2; exit 1; }
[[ "$SEQ" =~ ^[1-9][0-9]{0,2}$ ]] || { echo "SEQ 1-999 arasında olmalı: $SEQ" >&2; exit 1; }
CODE=$(( ${REL#r} * 1000 + SEQ ))

cd "$APP"
# Kaynaktaki sürüm kimliğini depodaki web sürümüne taşı. Betikler tam eşleşme
# aradığı için web kabuğu beklenmedik biçimde değiştiyse derleme burada değil,
# hazırlama adımında açık bir hatayla durur.
CUR="$(sed -n 's/^RELEASE = "\(r[0-9]\+\)"$/\1/p' pack.py)"
CURCODE="$(sed -n 's/.*android:versionCode="\([0-9]\+\)".*/\1/p' AndroidManifest.xml)"
[[ -n "$CUR" && -n "$CURCODE" ]] || { echo "Kaynaktaki sürüm kimliği okunamadı" >&2; exit 1; }
if [[ "$CUR" != "$REL" ]]; then
  sed -i "s/$CUR/$REL/g" BUILD.txt AndroidManifest.xml web/android_shell.py policy-content/apply.py pack.py
fi
if [[ "$CURCODE" != "$CODE" ]]; then
  sed -i "s/$CURCODE/$CODE/g" BUILD.txt AndroidManifest.xml
fi
echo "Sürüm: $REL · sürüm kodu: $CODE (kaynakta: $CUR / $CURCODE)"

rm -rf build
mkdir -p build
python3 pack.py stage "$REPO"
python3 policy-content/apply.py build/site
"$BUILDTOOLS/aapt2" compile --dir res -o build/compiled.zip
"$BUILDTOOLS/aapt2" link --proto-format -o build/linked.apk -I "$SDK/android.jar" \
  --manifest AndroidManifest.xml build/compiled.zip
python3 compile.py src "$SDK/android.jar" "$BUILDTOOLS/lib/d8.jar" build/classes.dex --min-api 26
python3 pack.py module "$REPO"
java -jar "$BUNDLETOOL" build-bundle --modules=build/base.zip --config=bundle-config.json \
  --output=build/unsigned.aab
java -jar "$BUNDLETOOL" validate --bundle=build/unsigned.aab > build/validate.txt

MANIFEST="$(java -jar "$BUNDLETOOL" dump manifest --bundle=build/unsigned.aab)"
grep -q "android:versionCode=\"$CODE\"" <<<"$MANIFEST" || { echo "Pakette sürüm kodu $CODE değil" >&2; exit 1; }
grep -q "android:versionName=\"$REL\"" <<<"$MANIFEST" || { echo "Pakette sürüm adı $REL değil" >&2; exit 1; }
grep -q 'package="tr.sukun.cevrimdisi"' <<<"$MANIFEST" || { echo "Paket adı değişmiş" >&2; exit 1; }
if grep -q 'android.permission.INTERNET' <<<"$MANIFEST"; then
  echo "Pakette internet izni var; çevrimdışı paket bunu içermemeli" >&2; exit 1
fi

python3 -I "$HERE/verify_bundle.py" build/unsigned.aab "$REL"

OUT="build/Sukun-$REL-$CODE-imzasiz.aab"
mv build/unsigned.aab "$OUT"
sha256sum "$OUT"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  { echo "release=$REL"; echo "code=$CODE"; echo "unsigned=android/$OUT"; } >> "$GITHUB_OUTPUT"
fi
