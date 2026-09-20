# r875 SüleymanSet GRIDLOCK

- Berhetiyye kontrol DOM'u tek: bsStart/bsPause/bsPrev/bsNext/bsAgain/bsStop/bsReset.
- Yerleşim kesin 1–2–2–1: Başlat; Önceki|Sonraki; Baştan|Bitir; Tüm seyri baştan.
- Asset üzerindeki yazılar kullanılıyor; HTML yazısı Başlat/Prev/Next/Again/Stop/Reset için görünmez.
- hidden butonlar `display:none!important`; eski kurallar hidden durumunu bozamaz.
- Pseudo/jewel çocukları kapalı. Observer/repaint yok.
- 99 Esmâ kontrol bloğuna dokunulmadı.
- SW/manifest değiştirilmedi.
