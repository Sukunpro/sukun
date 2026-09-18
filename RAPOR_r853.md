# SÜKÛN r853 — Tam Bug Taraması ve Sağlamlaştırma

## Düzeltilen kritik bulgular
- `manifest.webmanifest` r852 paketinde `shortcuts[].url` ve `version` alanlarında r849 kalmıştı. r853 ile tekilleştirildi.
- Berhetiyye arka planında iki ayrı runtime aynı CSS değişkenlerini yazıyordu: eski r831/R832 authority ve r848 authority. Eski authority kaldırıldı; 28 isim için tek `SukunR853Scene` otoritesi bırakıldı.
- Zikir Ayarları için r848 runtime hâlâ programatik click/open binding taşıyordu; r850 native `<details>` yaklaşımıyla çakışma riski vardı. r853 sahne runtime'ından ayar click otoritesi tamamen çıkarıldı. Zikir Ayarları yalnız native `details#r679ZikirAyarBox` davranışını kullanır.
- Uygulama/manifest/SW/latest/build marker r853'e senkronlandı.

## Statik regresyon kontrolleri
- `index.html` ve `nero.html`: duplicate ID = 0.
- HTML local src/href referansları: eksik = 0.
- 28 Berhetiyye canonical sahne girdisinin tamamı fiziksel asset'e karşı doğrulandı.
- Manifest JSON parse ve r853 start_url/version/shortcut senkronu doğrulandı.
- SW `SURUM`, cache adı ve build marker r853 olarak doğrulandı.
- Kritik r853 sahne runtime, native Zikir Ayarları runtime, SW kimlik runtime ve `sw.js` Node syntax kontrolünden geçirildi.
- ZIP CRC testi uygulanmıştır.

## Mimari not
Bu sürüm yeni özellik eklemekten çok otorite çakışmalarını azaltır. Özellikle Zikir Ayarları'nda programatik click köprüsü yeniden eklenmemelidir; görünür `summary` native açılır kontrol olarak kalmalıdır.
