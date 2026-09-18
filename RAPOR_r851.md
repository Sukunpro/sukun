# SÜKÛN r851 — Güncelleme Zinciri Onarımı

- r850 paketindeki gerçek tutarsızlık giderildi: `sw.js` r850 iken HTML/meta ve manifest r849, `__sukun_latest__.json` ise r838 idi.
- HTML/meta, manifest, Service Worker, latest marker ve build marker tek sürümde: **r851**.
- Service Worker `skipWaiting()` + `clients.claim()` kullanır.
- Navigasyon HTML isteği `cache: no-store` ile network-first çalışır.
- Yeni r851 shell + manifest + marker doğrulandıktan sonra eski `sukun-*` cache'leri silinir.
- Alt sürüm etiketi artık iki kimliği ayrı gösterir: **Uygulama r851 · SW r851**. Eski worker varsa doğrudan görünür.
- Zikir Çarkı / Zikir Ayarları davranışı r850 tabanından korunmuştur; bu sürümün ana değişikliği update authority senkronizasyonudur.
