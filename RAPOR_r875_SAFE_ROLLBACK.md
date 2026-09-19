# SÜKÛN r875 SAFE ROLLBACK

Amaç: r877/r878 başlangıç döngüsünden son çalışan r875 CLEAN tabanına dönmek.

- index.html / nero.html: r875 CLEAN tabanı.
- controllerchange -> reload YOK.
- location.reload / location.replace eklenmedi.
- registration.update zorlaması eklenmedi.
- SW navigasyonlarda network-first + no-store.
- Yeni SW activate olduğunda eski `sukun-*` cache'leri temizlenir.
- clients.claim + skipWaiting yalnız worker devrini tamamlamak için kullanılır; sayfa yenileme tetiklemez.
- Uygulama sürümü r875 olarak tutulmuştur.
