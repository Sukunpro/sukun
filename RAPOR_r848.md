# SÜKÛN r848

- Kullanıcıya görünen “Zikir Sayacı / Zikir Sayaç” terminolojisi “Zikir Çarkı” olarak güncellendi.
- Zikir Ayarları tetikleyicilerindeki eski capture listener çakışmasını aşmak için görünür tetikleyiciler temiz klonlarla yeniden bağlandı.
- Ayarlar açıldığında mevcut gerçek `r679ZikirAyarBox` ve içindeki canlı Tempo, Hedef, Zikir sesi, Bendir/Usûl vb. kontroller üst seviye portala alınır; kopya kontrol oluşturulmaz.
- Kapatıldığında aynı canlı DOM düğümü özgün yerine döner.
- r848 cache/release kimliği uygulandı.
