# SÜKÛN

Zikir, esma ve sûre takibi için web uygulaması.

Uygulama adresi: https://sukunpro.github.io/sukun/

## r1069 — Niyet ve esma geçişi

Otomatik zikirde sonraki esmaya geçmeden önce “İlahi ente maksudi ve rıdake matlubi” niyet kaydı doğal bitişine kadar tamamlanır. Niyet kaydının başı ve sonu kırpılmaz; sonraki esmanın sesi ve tekrar sayacı niyet tamamlanınca devralır. Duraklatma ve bitirme, bekleyen eski geçişleri iptal eder.

Bu sürümün kaynak değişikliği: `8091cc1ef9a698252cd872280217225e7bd5fb60`.

Doğrulama: 171 ilgili ses/geçiş kontrolü ve 1.265 sürüm bütünlüğü kontrolü geçti. Tam uygulama Chromium testi gerçek medya saati ve doğal `ended` olayını kapsar; fiziksel Android kilit ekranı ve kullanıcı kaydının işitsel sonucu bu test kapsamına dahil değildir.

Teknik açıklama ve test kanıtları: [Geçiş düzeltmesi](docs/INTENTION_TRANSITION_r1069.md), [r1069 testleri](tests/r1069/).

Tam paket `SUKUN_r1069_TAM_PAKET.zip` olarak hazırlanmıştır. Kaynak kodunun depoda bulunması, canlı adresin aynı sürümü sunduğunu tek başına göstermez; canlı sürüm `version.txt` üzerinden doğrulanır.
