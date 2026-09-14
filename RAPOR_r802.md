# RAPOR r802

## Amaç
- Berhetiyye aktif değilken normal sayaç görünsün.
- Berhetiyye aktif olunca otomatik özel yüzük devreye girsin.
- Geçişte görsel zıplama / layout sıçraması minimum olsun.

## Yapılanlar
- `r778RingSkin` artık mod kapanınca DOM’dan silinmiyor; görünürlük CSS ile yönetiliyor.
- Sayaç modülü açılışta `ring()` ile hazırlanıyor; ilk geçişte sonradan eleman eklenmesinden doğan zıplama azaltıldı.
- Berhetiyye özel sayaç boyutu normal sayaç ölçüsüne sabitlendi (`min(82vw, 340px)`).
- Özel yüzük için `opacity` tabanlı geçiş eklendi.
- `cntNums` merkezi korunarak aktif durumda hafif iç inset ile özel yüzüğe uyumlandı.
- Manifest/SW/build r802’ye yükseltildi; cache yenilenir.

## Beklenen sonuç
- Normal zikirlerde standart jewel sayaç görünür.
- Berhetiyye seçilince özel yüzük otomatik gelir.
- Geri dönünce normal sayaç geri gelir.
- Geçiş daha yumuşak ve sıçramasız hissedilir.
