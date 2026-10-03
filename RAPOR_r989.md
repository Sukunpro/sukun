# SÜKÛN r989

r988 tam paketi üzerine, gönderilen Berhetiyye tefekkür ekranı referansına göre hazırlanmıştır. Canlı siteye yayın yapılmadı.

- Aynı native mor kristal çıkış düğmesi Hedef ile Kalan arasına taşındı. Ayrı 48 × 48 px hücresi vardır; sayaç kartlarının üzerine binmez. Kontroller kapalıyken de erişilebilir. Çıkışın mevcut işlevi, SVG simgesi ve erişilebilir adı korunur; ikinci düğme veya ses komutu eklenmez.
- Berhetiyye tefekkür başlığı ve aktif isim, ayrı ve şeffaf ince altın işlemeli çerçevelere alındı. Uzun isim satıra sığacak şekilde bölünebilir; başlık mevcut tekil/seyir durumunu korur.
- Bu yerleşim yalnız Berhetiyye tefekküründe uygulanır. Esmâ tefekküründe çıkışın önceki sağ üst yerleşimi, normal uygulamanın başlıkları ve Klasik/Feyz tercihi korunur. Mod değişimi aynı düğmeyi yerleştirir; dinleyici, sayaç veya kayıt kopyalamaz.
- Gizli native çıkış düğmesini tekrar gösterebilen eski CSS önceliği giderildi. Kontrol paneli bağımsız açılıp kapanır; Escape ve odak davranışı korunur.
- Onaylı çark görselleri ve seçili çark değişmez. Ses motorları, eko/tık, sayaç, erişim sahibi, kayıtlar ve tempo tercihi r988 ile byte eşliğiyle kontrol edildi. Tempo alt sınırı 0,6 sn, ilk kullanım değeri 1 sn olarak kalır; geçerli kullanıcı seçimi değiştirilmez.
- Altın çerçeve doğrulanan stil dosyasına gömüldü; çevrimdışı görünümü ek bir görsel indirmesine bağlı değildir. Uygulama/servis çalışanı/manifest r989 kimliği, 39 runtime hash/SRI ve 8 çark görseli doğrulandı.

## Doğrulama

55/55 kontrol grubu geçti. Yeni yerleşim için 7 üretim DOM senaryosu ve 22 CSS/yerleşim kontrolü vardır. 50 ardışık mod çevrimi, panel açık/kapalı çıkış erişimi, orijinal düğme ve işlev sahipliği, gizlenme/geri kurma, ayrı dokunma hücreleri ve çevrimdışı çerçeve denetlendi. Önceki 19 akış senaryosu ile içerik, kayıt, sayaç, tempo, ses ve çevrimdışı testleri de geçti.

269 JavaScript blok/dosyası parse edildi. ZIP CRC, tekil arşiv yolları ve bütün uygulama dosyalarının kaynakla byte eşliği paketlemede ayrıca kontrol edilir.

Bunlar üretim kodunun deterministik DOM/medya ve CSS modellerindeki kontrolleridir. SVG varlığı ayrıca rasterize edilerek incelendi. Tam ekranın gerçek tarayıcı çizimi, fiziksel Android/Xiaomi dokunması, duyulan ses/eko ve kilit ekranı denemesi yapılmadı; DOGRULAMA_r989.json içinde NOT_RUN olarak belirtilir. Önceki raporlar tarihsel arşivdir; güncel rapor bu dosyadır.
