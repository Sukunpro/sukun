# RAPOR r816

## Yapılan düzeltmeler

1. **Sayaç otoritesi güçlendirildi**
   - Berhetiyye aktifken mücevher çarkının görünürlüğü yeniden zorlandı.
   - Berhetiyye dışına çıkıldığında eski `data-r811/r813/r809/r815` bayraklarının temizlenmesi eklendi.
   - Böylece **hem normal çarkın hem Berhetiyye çarkının kaybolması** problemi hedeflendi.

2. **Generic / normal çark geri yükleme koruması**
   - `#zCountVisual` içindeki standart sayaç katmanları (`zGlow`, `breathHalo`, `tsbGauge`, `rings`, `zMuhr`, `progArc`) generic modda tekrar görünür olacak şekilde zorlandı.

3. **Kendi sesin taşması azaltıldı**
   - `#r470VoiceSource`, `#bsStatus`, `#es99Status` ve ilgili durum satırlarında dar ekranlarda taşma/overflow için ek sınırlar ve metin sıkıştırma kuralları eklendi.

## Değişen dosyalar
- `nero.html`
- `RAPOR_r816.md`

## Not
Bu turda doğrudan odak:
- çark görünürlüğü,
- Berhetiyye/generic sayaç ayrımı,
- kendi sesin durum satırı taşması.
