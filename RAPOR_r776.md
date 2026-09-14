# SÜKÛN r776 — Berhetiyye Billur Saray Skin Authority

## Canlı ekranda doğrulanan eksik
r775 tema sınıfı etkinleşmesine rağmen eski r616/r721/r722/r709 kuralları daha yüksek CSS özgüllüğü ve `!important` kullandığı için gövde arka planı, Hedef/Kalan ve ana kumandaları tekrar eski SÜKÛN görünümüne çeviriyordu. Yerel Chromium hesaplanan stil kontrolünde Berhetiyye aktifken body arka planının hâlâ `tefekkur-sanctuary-r710.webp`, Hedef/Kalan ve Duraklat yüzeylerinin de eski gradient olduğu görüldü.

## r776 çözümü
- Berhetiyye görsel katmanı `inline !important` authority ile uygulanır; bu, eski uzun seçicilerden daha üst görsel önceliktedir.
- Body arka planı doğrudan `berhetiyye-palace.png` assetine kilitlenir.
- Hedef/Kalan -> `control-primary.png`; −1/+1 -> ayrı mücevher düğmeleri; Duraklat -> `control-primary.png`; Önceki/Baştan/Sonraki -> ilgili assetler.
- Tefekkür gezintisi, 28 İsim Seyri, Atlas, kategori yüzeyleri ve mini-player aynı lacivert/billur/altın aileye bağlandı.
- Tema kapanınca yalnız r776'nın dokunduğu görsel inline değerler geri yüklenir.
- Sayaç, kayıt/TTS, Global Playback, pause/stop/resume ve seyir motorunun event sahipliği değiştirilmedi.
