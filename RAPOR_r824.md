# SÜKÛN r824 — Temiz Production

- r823 temiz production tabanı korundu.
- 28/99 İsim Seyri mobil kontrollerine son layout otoritesi eklendi; eski absolute/grid kuralları kontrolleri sayfaya dağıtamaz.
- Alt mini player için içerik rezervi eklendi.
- Service Worker basitleştirildi: navigasyon network-first; eski doğrulanmış-kabuk deadlock'u kaldırıldı; r824 aktive olunca eski `sukun-*` cacheleri temizlenir.
- index/manifest/build marker r824 / v20.73 olarak senkronize edildi.
- Ses/state/localStorage/IndexedDB temizliği yapılmaz; kullanıcı kayıtlarına dokunmaz.
