# Sükûn Android paketi

Google Play'deki çevrimdışı Android uygulamasının (`tr.sukun.cevrimdisi`) kaynağı ve derleme düzeni.
Uygulama, depodaki web sürümünü paketin içine koyar ve onu internet izni olmayan bir WebView'de
`https://appassets.androidplatform.net/sukun/nero.html` adresinden açar. Bu adres ve paket adı
değişirse kullanıcıların cihazdaki kayıtları görünmez olur; ikisi de sabit kalmalıdır.

## Paket üretmek

1. Yeni web sürümü `main` dalına girdikten sonra GitHub'da **Actions → Android AAB (Play paketi) →
   Run workflow** ile akışı başlat.
2. Akış bitince sayfanın altındaki **Artifacts** bölümünden `.aab` dosyasını indir.
3. Dosyayı Play Console'da ilgili test kanalına yükle.

Sürüm kimliği `version.txt` dosyasından alınır: `r1278` → sürüm adı `r1278`, sürüm kodu `1278001`.
Aynı web sürümü için ikinci bir paket gerekirse akışı başlatırken **sıra** alanına `2` yaz
(`1278002`). Play Console, daha önce yüklenmiş bir sürüm kodunu kabul etmez.

Akış, web kabuğunda beklediği satırları bulamazsa (ör. üst bilgi ya da alt etiket değiştiyse)
açık bir hatayla durur. O zaman `android/web/android_shell.py` ve
`android/policy-content/apply.py` içindeki eşleşmeler yeni kabuğa göre güncellenir.

## İmza

Play, paketi ancak Console'da kayıtlı **yükleme anahtarıyla** imzalıysa kabul eder. Anahtar depoya
konmaz; **Settings → Secrets and variables → Actions** altında şu gizli ayarlar tanımlanır:

| Ad | İçerik |
| --- | --- |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | Anahtar dosyasının base64 hâli (`base64 -w0 dosya.jks`) |
| `ANDROID_UPLOAD_KEYSTORE_PASSWORD` | Anahtar deposunun şifresi |
| `ANDROID_UPLOAD_KEY_ALIAS` | Anahtarın takma adı |
| `ANDROID_UPLOAD_KEY_PASSWORD` | Anahtarın şifresi (depo şifresiyle aynıysa boş bırakılabilir) |

İlk yükleme anahtarı kaybolduğu için 27 Kasım 2026'da Play Console'dan sıfırlama istendi. Yeni anahtar
`sukun-upload` takma adıyla üretildi (SHA-256 `DB:6F:6D:…:2F:F5`). Google sıfırlamayı onaylayıp yeni
anahtarın geçerlilik tarihini bildirmeden Console bu anahtarla imzalanan paketleri kabul etmez.

Bunlar tanımlı değilse akış imzasız paket üretir. İmzadan sonra sertifikanın SHA-256 parmak izi,
Console'da kayıtlı yükleme sertifikasıyla karşılaştırılır; farklıysa akış uyarı verir. Yükleme
anahtarı Console'dan sıfırlanırsa yeni parmak izi `ANDROID_UPLOAD_CERT_SHA256` depo değişkenine
yazılır.

## Elle derlemek

`android/BUILD.txt` adımları geçerlidir. Aynı adımları tek komutla çalıştırmak için:

```
SDK=…/platforms/android-36 BUILDTOOLS=…/build-tools/36.0.0 BUNDLETOOL=…/bundletool-all-1.18.3.jar \
  bash android/ci/build.sh
```

Gerekenler: Python 3.11+, OpenJDK 21, Android SDK Platform 36, Build Tools 36.0.0, bundletool 1.18.3.
Çıktı `android/build/` altında oluşur.
