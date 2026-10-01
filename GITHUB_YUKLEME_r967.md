# SÜKÛN r967 — tam paket ve GitHub yükleme

Depo: `sukunpro/sukun`. Aşağıdaki hedefler depo köküne göredir. Mevcut kılavuzdaki depo yolunu koruyoruz; bu çalışmada canlı GitHub yayını yapılmadı.

**SUKUN_r967_TAM_PAKET.zip dosyasını aç. ZIP içindeki dosyaları ve assets klasörünü depo köküne yükle. ZIP dosyasını tek başına GitHub'a yüklemek uygulamayı güncellemez.**

`r967_work`, `delivery_r967` veya ayrıca `sukun` adlı bir üst klasör oluşturma. `index.html` ile `assets` yan yana olmalı. GitHub Pages mevcut uygulamanın yayımlandığı dal/klasörü kullanmalı.

## Kök dosyalar

| Paketteki dosya | GitHub hedef yolu |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r967.json` | `sukun-build-r967.json` |
| `sukun-latest.json` | `sukun-latest.json` |
| `icon-192.png` | `icon-192.png` |
| `icon-512.png` | `icon-512.png` |

## Klasörler

| Paketteki klasör/dosyalar | GitHub hedefi |
|---|---|
| `assets/runtime/` içindeki 25 JS/CSS dosyasının tamamı | `assets/runtime/` |
| `assets/berhetiyye-premium/` içindeki tüm görseller | `assets/berhetiyye-premium/` |
| `assets/scenes/` ve alt klasörlerinin tamamı | `assets/scenes/` ve aynı alt klasörler |
| `assets/wheels-r924/` ve iki alt klasörü | `assets/wheels-r924/` ve aynı alt klasörler |
| `assets/wheel-navigation-r964/` içindeki beş PNG | `assets/wheel-navigation-r964/` |
| Doğrudan `assets/` içindeki PNG/SVG dosyaları | Doğrudan `assets/` |

**assets klasörünün tamamını, alt klasörleriyle birlikte birleştir.** Dosyaları tek klasöre toplama; eski r920/r924/r938/r964 isimlerini yeniden adlandırma. Sürüm numarası r967 olsa da bu dosya adları uygulama bağlantılarının parçasıdır.

Mümkünse kök dosyaları ve assets dosyalarını aynı commit ile gönder. Aynı yol/ad varsa yeni dosya ile değiştir. Mevcut depoda bu paketin dışında kalan dosyaları silme.

## Çalışma dosyaları — tek tek hedefler

| Dosya | GitHub hedefi |
|---|---|
| `assets/runtime/audio-palette-r945.js` | `assets/runtime/audio-palette-r945.js` |
| `assets/runtime/background-owner-r949.js` | `assets/runtime/background-owner-r949.js` |
| `assets/runtime/berhet-controls-r933.css` | `assets/runtime/berhet-controls-r933.css` |
| `assets/runtime/berhet-dock-r933.css` | `assets/runtime/berhet-dock-r933.css` |
| `assets/runtime/berhet-layout-r938.css` | `assets/runtime/berhet-layout-r938.css` |
| `assets/runtime/berhet-layout-r938.js` | `assets/runtime/berhet-layout-r938.js` |
| `assets/runtime/berhet-materials-r933.css` | `assets/runtime/berhet-materials-r933.css` |
| `assets/runtime/berhet-theme-r933.js` | `assets/runtime/berhet-theme-r933.js` |
| `assets/runtime/dock-r920.js` | `assets/runtime/dock-r920.js` |
| `assets/runtime/esma-scenes-r923.js` | `assets/runtime/esma-scenes-r923.js` |
| `assets/runtime/health-r940.js` | `assets/runtime/health-r940.js` |
| `assets/runtime/health-view-r943.css` | `assets/runtime/health-view-r943.css` |
| `assets/runtime/health-view-r943.js` | `assets/runtime/health-view-r943.js` |
| `assets/runtime/interface-r920.js` | `assets/runtime/interface-r920.js` |
| `assets/runtime/lifecycle-r949.js` | `assets/runtime/lifecycle-r949.js` |
| `assets/runtime/nefs-data-r948.js` | `assets/runtime/nefs-data-r948.js` |
| `assets/runtime/nefs-model-r948.js` | `assets/runtime/nefs-model-r948.js` |
| `assets/runtime/nefs-r948.css` | `assets/runtime/nefs-r948.css` |
| `assets/runtime/nefs-ui-r948.js` | `assets/runtime/nefs-ui-r948.js` |
| `assets/runtime/offline-scenes-r962.js` | `assets/runtime/offline-scenes-r962.js` |
| `assets/runtime/scene-picker-r945.css` | `assets/runtime/scene-picker-r945.css` |
| `assets/runtime/scene-picker-r945.js` | `assets/runtime/scene-picker-r945.js` |
| `assets/runtime/session-r919.js` | `assets/runtime/session-r919.js` |
| `assets/runtime/wheels-r924.css` | `assets/runtime/wheels-r924.css` |
| `assets/runtime/wheels-r924.js` | `assets/runtime/wheels-r924.js` |
| `assets/feyz-mark-r718.svg` | `assets/feyz-mark-r718.svg` |
| `assets/feyz-ornament.svg` | `assets/feyz-ornament.svg` |
| `assets/feyz-pattern-r718.svg` | `assets/feyz-pattern-r718.svg` |
| `assets/sukun-nur-orbit-r757.svg` | `assets/sukun-nur-orbit-r757.svg` |
| `assets/ui-exit-r722.svg` | `assets/ui-exit-r722.svg` |
| `assets/ui-hourglass-r722.svg` | `assets/ui-hourglass-r722.svg` |
| `assets/ui-speaker-r722.svg` | `assets/ui-speaker-r722.svg` |
| `assets/ui-target-r722.svg` | `assets/ui-target-r722.svg` |

`GITHUB_DOSYA_LISTESI_r967.txt`, uygulama için gereken bütün kök ve assets dosyalarını tek tek listeler. `integration/`, eski sürüm raporları ve kılavuzlar geliştirme arşividir; uygulamayı çalıştırmak için yüklenmeleri gerekmez. Tam pakette kaynak kodu, görseller, testler ve kanıt raporları birlikte bulunur.

## Yayından sonra

1. GitHub Pages dağıtımının tamamlanmasını bekle.
2. Uygulamadaki okumayı durdur ve “Güncellemeyi kontrol et” düğmesine bas. Güncellemeyi tamamlayıp yeniden aç.
3. Uygulama ve SW sürümleri birlikte **r967** olmalı. Biri eskiyse dosya yollarını ve Pages dağıtımını kontrol et; henüz r967 davranışını test etmiş sayılmazsın.
4. Haftalık virdde istediğin günün “Çarkta aç” düğmesini kullan. Gününü beklemeden doğru isim ve hedef çarkta görünmeli. Başlat düğmesiyle zikre başla.
5. Esmâ, terkip ve Berhetiyye'de ana kontroller çarkın hemen altında; “Bitir” ek ayarları açmadan erişilebilir olmalı.
6. “Formül 4” terkibini aç/başlat/duraklat/bitir; başka bir isim seç; yeniden başlat. “Zikre geç” düğmesi açılış ekranını atlayabilmeli. Üst üste kalan sayım veya seri tık sesi olmamalı.
7. Şifre kapalıyken Berhetiyye isimlerini tertip/vird seçiminde kontrol et: Mezcelin ve Bezcelin istisnadır; öteki 26 isim eklenemez. Kaydedilmiş özel isimli tertipler de kilitliyken başlatılamaz.

Tarayıcı verilerini veya kendi ses kayıtlarını silmek bu güncellemenin yükleme adımı değildir. Kişisel kayıtlar cihazında durur; bu ZIP içinde kişisel kayıtların kopyası bulunmaz.

## Doğrulama ve uygulamaya dönüşüm

14 akış senaryosu, 260 JavaScript sözdizimi denetimi, 30 çalışma dosyası hash/SRI kontrolü, 20 çarkta 120 geometri durumu ve mevcut ses/önbellek regresyonları geçti. 235 sabit görsel/çalışma dosyası yolunda eksik dosya kalmadı. Açılış, seçim ve okuma testleri kontrollü DOM/zamanlayıcı modelleriyle çalıştırıldı.

Gerçek tarayıcı çizimi, telefonda duyulan ses, ekran kilidi/çağrı davranışı ve kullanıcının bildirdiği donmanın cihaz üzerinde yeniden denenmesi bu ortamda yapılmadı. Bu sürüm web/PWA kaynak ve dağıtım paketidir. APK/AAB üretimi ve mağaza yayını yapılmadı. Telefon testleri geçtikten sonra Android paketleme aşamasına geçilebilir.
