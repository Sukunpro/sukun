# SÜKÛN r907 — Cache Break / Update Recovery

- r905 sağlam tabanı korunmuştur.
- HTML build meta artık gerçekten r907; eski r901 meta uyuşmazlığı giderildi.
- Manifest start_url r907 olarak düzeltildi (r905 paketinde r899 kalmıştı).
- Service Worker yeni `sukun-r907-cachebreak-20260921-v1` namespace kullanır.
- Activate aşamasında eski `sukun-*` cacheleri koşulsuz temizlenir.
- `skipWaiting()` ve `clients.claim()` aktiftir.
- HTML navigasyonları network-first + no-store kalır.
- Yeni controller geldiğinde tek seferlik kontrollü reload uygulanır.
- Berhetiyye görsel katmanlarına bu sürümde dokunulmamıştır.
