# SÜKÛN r991

r990 tam paketi üzerine set kartını kapatma ve ilk Tekke giriş ayarları eklendi. Canlı siteye yayın yapılmadı.

- Ana sayfa ve Tekke set kartının sağ üstünde × bulunur. × seti durdurur ve iki kartı gizler. Ayrı çalışan Tekke zikir/nefes seansı devam eder. Set seçimi ve kendi ses kayıtları korunur.
- İlk Tekke giriş ekranındaki Tefekkür Seti bölümünden set seçilebilir. “Set kartını ana sayfada ve Tekke’de göster” seçeneği, aynı tercih üzerinden iki kartı yönetir. Mihrap → Kendi Sesinle Anlatıcı bölümünde de bu seçenek bulunur.
- Kapatma tercihi cihazda saklanır ve ayar yedeğine dahil edilir. Set değiştirmek gizlenmiş kartı açmaz. Kartı yeniden göstermek sesi başlatmaz. Bir seti açıkça Başlatmak kontrol kartını yeniden gösterir.
- Aktif veya duraklatılmış seti ayarlardan gizlemek de yalnız seti bitirir. Eski hazırlama işlemi, ses sonu ve TTS callback’i yeniden oynatamaz. Boştaki kartı kapatmak cihazın diğer konuşmasını iptal etmez.
- İlk ekrandaki set seçimi Mihrap’taki kayıt seçimi/liste ile eşleşir. Devam eden bir sette yapılan seçim sonraki başlatma içindir; mevcut akışın sırası ve adı korunur. Kendi kayıt önceliği ve eksik adımda TTS yolu aynıdır.
- × için 44 × 44 px dokunma alanı, klavye odağı, erişilebilir ad ve açıklama eklendi. Türkçe/İngilizce açıklamalar bulunur. Ayrı duraklatma/devam ve Bitir davranışı korunur.

## Doğrulama

58/58 kontrol grubu geçti. Önceki 17 set akış senaryosu korunarak yeniden çalıştırıldı. Yeni kapatma/görünürlük için 12 senaryo ve arayüz/CSS için 36 kontrol geçti. Boş kart, kayıt oynatımı, TTS, tam kayıtlı native set, hazırlama iptali, geç callback, tercihin geri yüklenmesi, iki ayarın eşleşmesi, seçimde kartı kapalı tutma, açık Başlat ile gösterme ve İngilizce metinler denetlendi.

270 JavaScript blok/dosyası parse edildi. 40 zorunlu runtime dosyası, hash/SRI, çevrimdışı varlık, r991 uygulama/servis çalışanı/manifest eşliği ve 8 çark görseli doğrulandı. Önceki ses motorları, Berhetiyye çerçeveleri ve çarklar değişmedi. Minimum tempo 0,6 sn ve ilk kullanım 1 sn; geçerli kullanıcı tercihi korunur. ZIP CRC, tekil yollar ve 249 uygulama dosyasının byte eşliği paketlemede kontrol edilir.

Bu kontroller üretim kodu ile deterministik DOM, medya, TTS ve saat modelleri üzerinde yapıldı. Gerçek tarayıcı çizimi, fiziksel Android/Xiaomi dokunması, duyulan ses ve kilit ekranı çalışması bu ortamda denenmedi; DOGRULAMA_r991.json içinde NOT_RUN olarak belirtilir. Tarihsel raporlar arşivdir; güncel rapor bu dosyadır.
