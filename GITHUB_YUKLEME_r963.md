# r963 GitHub yükleme kılavuzu

Depo: sukunpro/sukun. Aşağıdaki yollar depo köküne göredir. GitHub Pages kaynağı bu uygulamanın yayımlandığı dal/klasör olmalıdır. Tüm dosyalar aynı güncellemede yüklenmelidir.

ZIP dosyasını GitHub'a yükleme; önce aç. ZIP'in içindeki klasör yapısını aynen koru. `assets` klasörü zaten varsa mevcut klasörle birleştir. Dosyaları tek klasöre toplama; mevcut sahneleri veya ses kayıtlarını silme.

## Kesin dosya–hedef listesi

| ZIP içindeki dosya | GitHub depo yolu |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r963.json` | `sukun-build-r963.json` |
| `sukun-latest.json` | `sukun-latest.json` |
| `assets/runtime/berhet-layout-r938.css` | `assets/runtime/berhet-layout-r938.css` |
| `assets/runtime/berhet-materials-r933.css` | `assets/runtime/berhet-materials-r933.css` |
| `assets/runtime/berhet-controls-r933.css` | `assets/runtime/berhet-controls-r933.css` |
| `assets/runtime/berhet-dock-r933.css` | `assets/runtime/berhet-dock-r933.css` |
| `assets/runtime/background-owner-r949.js` | `assets/runtime/background-owner-r949.js` |
| `assets/runtime/lifecycle-r949.js` | `assets/runtime/lifecycle-r949.js` |
| `assets/runtime/audio-palette-r945.js` | `assets/runtime/audio-palette-r945.js` |
| `assets/runtime/esma-scenes-r923.js` | `assets/runtime/esma-scenes-r923.js` |
| `assets/runtime/session-r919.js` | `assets/runtime/session-r919.js` |
| `assets/runtime/dock-r920.js` | `assets/runtime/dock-r920.js` |
| `assets/runtime/wheels-r924.js` | `assets/runtime/wheels-r924.js` |
| `assets/runtime/berhet-layout-r938.js` | `assets/runtime/berhet-layout-r938.js` |
| `assets/runtime/interface-r920.js` | `assets/runtime/interface-r920.js` |
| `assets/runtime/wheels-r924.css` | `assets/runtime/wheels-r924.css` |
| `assets/runtime/berhet-theme-r933.js` | `assets/runtime/berhet-theme-r933.js` |
| `assets/runtime/health-view-r943.css` | `assets/runtime/health-view-r943.css` |
| `assets/runtime/health-view-r943.js` | `assets/runtime/health-view-r943.js` |
| `assets/runtime/scene-picker-r945.css` | `assets/runtime/scene-picker-r945.css` |
| `assets/runtime/scene-picker-r945.js` | `assets/runtime/scene-picker-r945.js` |
| `assets/runtime/health-r940.js` | `assets/runtime/health-r940.js` |
| `assets/runtime/nefs-r948.css` | `assets/runtime/nefs-r948.css` |
| `assets/runtime/nefs-data-r948.js` | `assets/runtime/nefs-data-r948.js` |
| `assets/runtime/nefs-model-r948.js` | `assets/runtime/nefs-model-r948.js` |
| `assets/runtime/nefs-ui-r948.js` | `assets/runtime/nefs-ui-r948.js` |
| `assets/runtime/offline-scenes-r962.js` | `assets/runtime/offline-scenes-r962.js` |
| `assets/wheel-navigation-r962.png` | `assets/wheel-navigation-r962.png` |

## GitHub arayüzüyle yükleme sırası

1. Depo kökünde altı kök dosyayı değiştir: `index.html`, `nero.html`, `sw.js`, `manifest.webmanifest`, `sukun-build-r963.json`, `sukun-latest.json`.
2. `assets/runtime/` klasörünü aç ve ZIP'teki aynı klasörün bütün dosyalarını bu klasöre yükle. Eski dosya adlarında r920/r924/r962 bulunması normaldir; adları değiştirme.
3. `assets/` klasörüne `wheel-navigation-r962.png` dosyasını yükle. Görsel r963'te de bu adı kullanır. `1000315103.png` adıyla veya depo kökünde duran kopya yerine geçmez.
4. Tek commit içinde klasör yapısını koruyabiliyorsan tüm ZIP içeriğini köke sürükleyip yükle; arayüzde dosya yollarının yukarıdaki listeyle aynı kaldığını kontrol et. Alternatif olarak Git veya GitHub Desktop ile klasörleri birleştirerek tek commit gönder.
5. GitHub Pages yayını tamamlandıktan sonra Sükûn'da “Güncellemeyi kontrol et” düğmesine bas. Uygulama ve SW birlikte r963 göstermeli.
6. “İsim, çark ve görünüm” ayarında “Çark içi önceki–sonraki düğmeleri” işaretli olmalı. Berhetiyye Tefekkür'de önce “Kontroller ve görünüm” panelini aç.

## Neyi yüklemene gerek yok?

Küçük GitHub yükleme ZIP'i r962 üzerine güncellemek içindir. Eski sahne/çark klasörleri korunur. `integration/`, raporlar, SHA256 listeleri ve bu kılavuz uygulamanın çalışması için gerekli değildir. İlk kurulum yapıyorsan tam paketi kullan; tam paketin `assets` klasörünün tamamını yükle.

## r962'de neden görünmedi?

Canlı sitede yeni taş PNG dosyası ve çalışma dosyaları HTTP 200 ile alındı. Tarayıcıdaki taş düğmesi gizli değildi; ancak `::before` görsel katmanının hesaplanan görünümü `display:none` idi. Eski ortak düğme CSS kuralı katmanı gizliyordu. r963 bu katmanı açıkça görünür yapar. SVG yön simgeleri de otomatik grid ölçüsü yerine düğmeye göre konumlanır.
