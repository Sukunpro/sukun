# SÜKÛN r968 — TAM paket / GitHub yükleme

Depo: `sukunpro/sukun`. Hedef yollar mevcut GitHub Pages yayınının kullandığı depo köküne göredir. Bu çalışmada GitHub’a canlı yayın yapılmadı.

**SUKUN_r968_TAM_PAKET.zip’i aç. İçindeki kök uygulama dosyalarını ve assets klasörünün tamamını aynı commit ile yükle. ZIP dosyasını tek başına GitHub’a koymak uygulamayı güncellemez.**

`r968_work`, `delivery_r968` veya yeni bir üst `sukun` klasörü oluşturma. `index.html` ve `assets/` yan yana bulunmalı. Aynı adlı mevcut dosyaları değiştir; klasörleri alt yollarını koruyarak birleştir. Depoda paket dışında kalan dosyaları silme.

## Depo köküne yüklenecek dosyalar

| ZIP içindeki dosya | GitHub hedefi |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r968.json` | `sukun-build-r968.json` |
| `sukun-latest.json` | `sukun-latest.json` |
| `icon-192.png` | `icon-192.png` |
| `icon-512.png` | `icon-512.png` |

## Klasörlerin hedefi

| ZIP içindeki kaynak | GitHub hedefi |
|---|---|
| `assets/runtime/` içindeki 25 JS/CSS dosyasının TAMAMI | `assets/runtime/` |
| `assets/berhetiyye-premium/` tüm taş ve kontrol görselleri | `assets/berhetiyye-premium/` |
| `assets/scenes/` ve alt klasörleri | `assets/scenes/` ve aynı alt klasörler |
| `assets/wheels-r924/` ve alt klasörleri | `assets/wheels-r924/` ve aynı alt klasörler |
| `assets/wheel-navigation-r964/` beş PNG | `assets/wheel-navigation-r964/` |
| Doğrudan `assets/` içindeki dosyalar | Doğrudan `assets/` |

**assets klasörünün tamamı 222 dosyadır.** Alt klasörleri düzleştirme, eski r919/r920/r938/r964 dosya adlarını değiştirme. Sürüm r968 olsa da bu isimler bağlantıların parçasıdır. Yalnız HTML veya yalnız sw.js yüklemek yeni düzeni etkinleştirmek için yeterli değildir.

## Çalışma dosyalarının tek tek hedefleri

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

`GITHUB_DOSYA_LISTESI_r968.txt`, gereken 8 kök + 222 assets dosyasının TAM yol listesidir. Paketteki `integration/`, eski raporlar ve sürüm kılavuzları kaynak/geliştirme arşividir; uygulamayı çalıştırmak için yüklenmeleri gerekmez. En güncel açıklama bu kılavuz ve RAPOR_r968.md’dir.

## Yükledikten sonra telefon kontrolü

1. GitHub Pages dağıtımının bitmesini bekle. Okumayı durdur, “Güncellemeyi kontrol et” ile güncelle ve yeniden aç. Uygulama ve SW sürümleri birlikte **r968** görünmeli.
2. Normal Berhetiyye ve 99 Esmâ’da kulakçık kapalıyken tüm alt kontrol bloğu gizlenmeli. Kulakçık açıldığında Önceki/Baştan başla/Sonraki ve Tefekkür/Bitir aynı blokta olmalı.
3. Tefekkür modunda da aynı aç/kapa davranışını ve Hedef/Kalan’ın taşların merkezinde sığmasını kontrol et. Bitir çark üzerinden de erişilebilir olmalı. Kulakçığı açıp Tefekkürden Çık kullanılabilir.
4. Berhetiyye’de Bitir yakut, Tefekküre geç/Çık ametist, Kontroller ve görünüm billur kaplı olmalı. Atlas ve Seyir ortada yan yana durmalı.
5. Tekil zikir ve 28/99 seyirde Başlat→Duraklat→+1→−1→Devam yolunu dene. Düzeltmede ses başlamamalı; çark, hedef/kalan ve devam sayısı uyuşmalı. Aktif okumada ±1 kapalıdır. Sıfırda −1 kapalıdır; duraklatılmış hedef−1’de +1 kapalıdır, son tekrarı Devam ile tamamla.
6. Farklı çarklarda kulakçık ve çark üzerindeki düğmelerin tıklanabildiğini kontrol et. Telefonda yatay/dikey yönde metin taşmamalı.
7. Önceki sürüm düzeltmelerini de kontrol et: haftanın herhangi bir virdini günü gelmeden çarkta aç; Formül 4’ü aç/başlat/atla/duraklat/bitir; kilitliyken özel Berhetiyye isimleri terkibe/virdlere eklenememeli, Mezcelin/Bezcelin istisnası kalmalı.

Tarayıcı verilerini veya kendi ses kayıtlarını silme. Bu pakette kişisel kayıtlarının kopyası bulunmaz. İlk kez hiç ziyaret edilmemiş büyük görseller çevrimdışıyken hazır olmayabilir; çevrimdışı sahne hazırlama aracını kullan.

Kod, sayaç, geometri, ses ve önbellek regresyonları geçti. Gerçek tarayıcı çizimi ve fiziksel Android kabul testi bu ortamda yapılmadı. Bu web/PWA kaynak paketidir; APK/AAB henüz üretilmedi.
