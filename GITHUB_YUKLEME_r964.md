# r964 GitHub yükleme kılavuzu

Depo: sukunpro/sukun. Tablodaki yollar depo köküne göredir. r963 üzerine güncelleme için SUKUN_r964_GITHUB_YUKLEME.zip dosyasını aç ve içindeki klasör yapısını koruyarak yükle. ZIP'in kendisini GitHub'a atma.

## Kesin dosya ve klasör listesi

| Dosya | GitHub hedefi |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r964.json` | `sukun-build-r964.json` |
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
| `assets/wheel-navigation-r964/gold.png` | `assets/wheel-navigation-r964/gold.png` |
| `assets/wheel-navigation-r964/copper.png` | `assets/wheel-navigation-r964/copper.png` |
| `assets/wheel-navigation-r964/silver.png` | `assets/wheel-navigation-r964/silver.png` |
| `assets/wheel-navigation-r964/dark.png` | `assets/wheel-navigation-r964/dark.png` |
| `assets/wheel-navigation-r964/crystal.png` | `assets/wheel-navigation-r964/crystal.png` |

## Yükleme sırası

1. Depo köküne altı dosya: index.html, nero.html, sw.js, manifest.webmanifest, sukun-build-r964.json, sukun-latest.json.
2. assets/runtime/ klasörüne paketteki 25 çalışma dosyasının tamamını yükle. Dosya adlarındaki eski r920/r924/r962 eklerini değiştirme.
3. assets/ altında wheel-navigation-r964 adlı yeni klasör oluştur. Bu klasöre gold.png, copper.png, silver.png, dark.png ve crystal.png dosyalarını koy. assets/runtime/ içine veya doğrudan depo köküne koyma.
4. Mümkünse tümünü aynı commit ile yayımla. Klasörleri birleştir; eski sahneleri, çarkları ve diğer dosyaları silme. GitHub Pages kaynağı mevcut uygulamanın yayımlandığı dal/klasör olmalıdır.
5. Pages yayını tamamlanınca uygulamada Güncellemeyi kontrol et. Uygulama ve SW birlikte r964 göstermeli.
6. İsim, çark ve görünüm altında Çark içi önceki–sonraki düğmeleri açık olmalı. Berhetiyye tefekkür görünümünde Kontroller ve görünüm panelinden bu ayara ulaşabilirsin.

## Paketler

Küçük paket mevcut r963 uygulaması içindir: 36 gerekli uygulama dosyası ve bu rehber/rapor. İlk kurulum veya daha eski bir taban için SUKUN_r964_TOPLU_YUKLEME.zip kullan; assets klasörünün tamamını mevcut assets ile birleştir. integration/, raporlar, kontrol listeleri ve rehber çalışma için gerekli değildir. Eski wheel-navigation-r962.png dosyası kalabilir; r964 bunu kullanmaz.

## Çarklara uyarlama

| Çark | Parça |
|---|---|
| ham-kristal | gold |
| faset-kesim | gold |
| ametist-yuvarlak | gold |
| ametist-saltanati | gold |
| zumrut-tac | gold |
| safir-ruzgari | silver |
| obsidyen-muhur | dark |
| bakir-ruzgari | copper |
| yakut-muhur | gold |
| billur-hisar | gold |
| lacivert-usturlap | gold |
| inci-sema | gold |
| zumrut-tesbih | gold |
| oniks-sukuneti | dark |
| kehribar-tesbih | gold |
| sedef-nuru | gold |
| crystal | gold |
| seal | gold |
| pearls | gold |
| classic | crystal |
