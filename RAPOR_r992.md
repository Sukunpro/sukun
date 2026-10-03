# SÜKÛN r992

Onaylanan üç ekranlı Tekke mockup’ı r991 tam uygulamasına işlendi. Canlı siteye yayın yapılmadı.

- İlk girişte üç amaç seçilir: Zikir ve nefes, Tefekkür seti, Sessiz tefekkür. Seçim cihazda saklanır. Tek bir Başlat düğmesi seçilen amaca yönelir; tefekkür setinde setin adı yazılır. Set seçimi ve gerçek kayıt/TTS adım sayıları gösterilir.
- Tefekkür setinde büyük kart, daraltılabilir küçük bir başlık ve adım şeridine dönüştü. Daraltma sesi kesmez. Adım metni isteğe bağlı açılır. × set anlatımını durdurur ve kartı gizler; seçim ve kayıtlar korunur. İlk giriş/Mihrap içindeki görünürlük tercihi eşleşir. Hata açıklaması daraltılmış kartta da görünür.
- Alt oynatma alanı hangi akışı yönettiğini söyler. Duraklat/Devam et, Bitir ve Ses bir aradadır. Duraklat nefes fazı ve süreyi korur; Bitir Tekke seansını kapatır. Kayıt önceliği ve eksik adımda TTS akışı değişmedi. Cihaz sesindeki ses seviyesi bir sonraki okumada uygulanır; kontrol açıklamasında belirtilir.
- Mihrap açmak ve kapatmak sesi durdurmaz. Ayarlar Seans, Sesler, Kayıtlar ve Görünüm başlıklarında toplanır. Orijinal ayar düğümleri ve bağlı işlevleri taşındı; ayrı kopyaları oluşturulmadı. Uzman ayarları, tema seçimi, sesli rehber, kayıt ekranı ve haptik tercihleri erişilebilirdir.
- SÜKÛN’a dönmek akışı sürdürür. Tekke’ye geri gelince aktif set/seyir yeniden başlatılmaz; eski giriş kapısını zorla açan katman düzeltildi. Zikir/nefes seansı ana sayfadayken aynı faz saatiyle yürür. Sessiz mod ses motorlarını başlatmaz; set modunda ilgisiz zikir sayacı/nefes fazı gösterilmez.
- Duraklatılmış Tekke zikir akışı ortak oynatıcıya doğru durumuyla bildirilir. Kendi kayıtlı/TTS setleri önceki ses sahiplerini kullanır. Farklı sekme ses sahibi olduğunda zikir seansı devam ettirilemez.
- Türkçe/İngilizce yeni amaçlar, başlıklar, düğmeler ve açıklamalar bulunur. Klavye odağı, yön tuşlarıyla ayar sekmeleri, Escape ile kapatma, 44px dokunma alanları ve native kaydırma eklendi.

## Doğrulama

61/61 kontrol grubu geçti. Önceki 17 set akış senaryosu, 12 görünürlük/kapatma senaryosu ve 36 eski kart/CSS kontrolü korunarak çalıştırıldı. Yeni üretim fonksiyonlarıyla 11 transport/saat senaryosu, gerçek tkTpl işaretlemesi ve üretim UI koduyla 16 DOM/erişilebilirlik senaryosu, kapsamlı eski CSS çakışmalarına karşı 135 seçici/kaskad kontrolü geçti.

271 JavaScript blok/dosyası parse edildi. 42 zorunlu runtime varlığı, hash/SRI, çevrimdışı varlık listesi ve r992 uygulama/servis çalışanı/manifest eşliği doğrulandı. Sekiz çark görseli ve Berhetiyye çerçeveleri byte olarak korundu. Minimum tempo 0,6 sn ve ilk kullanım değeri 1 sn; geçerli kullanıcı seçimi kendiliğinden değiştirilmez. Paket CRC, tekil yollar ve tüm uygulama dosyalarının byte eşliği denetlendi.

Bu doğrulama üretim kodu üzerinde deterministik DOM, medya, TTS, saat ve CSS modelleri kullanır. Gerçek tarayıcı çizimi, fiziksel Android/Xiaomi dokunması, duyulan ses ve kilit ekranı bu ortamda denenmedi. DOGRULAMA_r992.json içinde NOT_RUN olarak belirtilir. Tarihsel raporlar arşivdir; güncel rapor bu dosyadır.
