# SÜKÛN r872

- Berhetiyye seyir düğmelerindeki Android flashing/repaint sorunu için tek son CSS otoritesi bırakıldı.
- Büyük 1744×830 düğme dokuları yarı boyuta optimize edildi; GPU texture baskısı azaltıldı.
- Butonlarda animation/transition/filter/transform repaint zinciri kapatıldı.
- `Bitir` için düz kırmızı fallback yerine tek ruby texture zorlandı.
- r871 son runtime kaldırıldı; r872 runtime DOM skin katmanı eklemiyor, yalnız eski injected IMG kalıntılarını bir kez temizliyor.
- Uygulama ve Service Worker r872 olarak eşlendi.
