# SÜKÛN r893 — Flat Root / Cache Fix

Kök neden bulundu:
- r892 güncelleme ZIP'i `r891/` alt klasörüyle paketlenmişti; repo köküne açıldığında mevcut `nero.html`, `sw.js` ve manifest dosyalarını değiştirmiyordu.
- SW hâlâ `r889` kimliği/cache adıyla çalışıyordu.
- SW CORE listesi pakette bulunmayan `.png` kontrol dosyalarını istiyordu; gerçek dosyalar `.webp` idi. Bu SW install/refresh zincirini bozabiliyordu.

r893 dosyaları ZIP kökünde doğrudan yer alır. Build, manifest, latest ve cache marker'ları r893 ile senkronizedir. Berhetiyye çarkı r892 direct-host renderer'ı korunur.
