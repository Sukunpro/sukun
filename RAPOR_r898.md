# SÜKÛN r898 — Build Authority / Split-Brain Fix

- Tüm `sukun-build` meta etiketleri r898 olarak tekilleştirildi.
- `index.html` ve `nero.html` byte-identical yapıldı; kök giriş ile uygulama girişi ayrışamaz.
- Görünür sürüm otoritesi r898.
- Service Worker r898; cache adı r898.
- Navigasyon HTML için gerçek network-first: ağdan başarılı gelen belge eski cache ile değiştirilmiyor.
- Offline fallback yalnız r898 doğrulanmış shell'e izin veriyor.
- Manifest start_url ve shortcut r898.
- Build/latest/cache marker dosyaları r898.
- r897 tek sayaç / Berhetiyye çark otoritesi r898 kimliğiyle korunuyor.

## Kabul testi
Alt sürüm satırı `Uygulama r898 · SW r898 · güncel` göstermeli. Bundan sonra Berhetiyye çarkı testi anlamlıdır.
