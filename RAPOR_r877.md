# SÜKÛN r877 — Service Worker handover
r876 UI düzeltmeleri aynen korunmuştur.

- register: ./sw.js?v=r877
- scope: ./
- updateViaCache: none
- registration.update() zorlanır
- waiting worker'a SKIP_WAITING gönderilir
- controllerchange sonrası yalnız bir kez reload
- SW GET_VERSION / SUKUN_SW_VERSION mesaj protokolü eklendi
- activate sırasında eski sukun-* cache'leri temizlenir
