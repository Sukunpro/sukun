# SÜKÛN r975 — GitHub'a hangi dosya nereye?

Depo: sukunpro/sukun. ZIP'i aç; aşağıdaki dosyaları mevcut yayının kullandığı depo köküne yükle. ZIP'i tek başına GitHub'a yüklemek uygulamayı güncellemez. Yeni r975_work veya delivery_r975 klasörü oluşturma. index.html ve assets/ yan yana olmalı. Aynı adlı dosyaları değiştir; paket dışındaki dosyaları silme. Kök ve assets dosyalarını aynı commit ile gönder.

## Depo köküne

| ZIP dosyası | GitHub hedefi |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r975.json` | `sukun-build-r975.json` |
| `sukun-latest.json` | `sukun-latest.json` |
| `icon-192.png` | `icon-192.png` |
| `icon-512.png` | `icon-512.png` |

## Assets klasörü

assets/ klasörünün 222 dosyasının tamamını aynı kökteki assets/ içine alt klasörlerini koruyarak yükle. Eski sürüm adları taşıyan dosyaları yeniden adlandırma. GITHUB_DOSYA_LISTESI_r975.txt bütün gerekli dosyaların kesin hedefini tek tek listeler.

| ZIP kaynak yolu | GitHub hedef yolu |
|---|---|
| assets/runtime/ tüm 25 dosya | assets/runtime/ |
| assets/berhetiyye-premium/ | assets/berhetiyye-premium/ |
| assets/scenes/ ve alt klasörleri | Aynı alt yollarla assets/scenes/ |
| assets/wheels-r924/ ve alt klasörleri | Aynı alt yollarla assets/wheels-r924/ |
| assets/wheel-navigation-r964/ | assets/wheel-navigation-r964/ |
| Doğrudan assets/ altındaki dosyalar | Doğrudan assets/ |

## Bu sürümde özellikle değişen dosyalar

| Dosya | Hedef | Neden? |
|---|---|---|
| index.html, nero.html | Depo kökü | Ses tercihi düzeltmeleri, İngilizce ve balonlar |
| assets/runtime/health-r940.js | Aynı yol | Tamamlanamayan doğrulama/ilerleme denetimi |
| assets/runtime/health-view-r943.js | Aynı yol | Onaylı, çalışan health arayüzü ve iki dil |
| assets/runtime/health-view-r943.css | Aynı yol | Sade mobil health görünümü |
| sw.js, sukun-build-r975.json, sukun-latest.json, manifest.webmanifest | Depo kökü | Çevrimdışı sürüm, hash ve sürüm uyumu |

Yalnız HTML veya yalnız runtime dosyalarını yükleme. Yeni SRI/hash değerleri nedeniyle birlikte yüklenmeli. En güvenli yükleme tam 8 kök + 222 assets dosyasıdır.

## Telefonda sürümü kontrol

1. GitHub Pages dağıtımı bittikten sonra okumayı duraklat ve Güncellemeyi kontrol et ile güncelle. Uygulama ve SW birlikte r975 görünmeli.
2. Zikir devam ederken Arapça hız/perde ve cihaz sesi tercihini değiştir. Mevcut okuyuş kesilmemeli; yeni ayar sonraki okuyuşa uygulanmalı. Kilitte önceden kuyruklanmış okuyuşlar bitene kadar önceki ayar duyulabilir.
3. Ana ses düzeyini değiştirip Duraklat veya Bitir yap. Eski okuyuş gecikmeli yeniden başlamamalı. TTS düzeyi sonraki okuyuşta değişir.
4. Araçlar → Sistem kontrolü: Hızlı kontrol, yerel açıklama, açılır gruplar, ayrıntılı doğrulama, adımlı cihaz denemeleri ve TXT/JSON indirmeyi dene. İnterneti kapatınca yerel açıklama kullanılabilmeli; AI yorumu çevrimdışıyken istek göndermemeli.
5. English düğmesiyle dili değiştir. Health, manuel dokunuş, tık/ses ayarları ve açıklama balonlarını kontrol et; Türkçeye geri dönüp dinamik etiketleri de dene.
6. Çarktaki doğal Önceki/Sonraki parçalarında r974'te kaldırılan kare çerçeve geri gelmemeli.

Kişisel ses kayıtlarını veya tarayıcı verilerini silme. integration/, raporlar, kılavuzlar ve doğrulamalar geliştirme arşividir; uygulamayı çalıştırmak için yüklemek gerekmez. Health tasarımı artık entegredir; arşivdeki eski mockup onay öncesi tasarım kaydıdır. Bu çalışmada GitHub'a canlı yayın yapılmadı.
