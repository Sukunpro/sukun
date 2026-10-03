# SÜKÛN r990

r989 tam paketi üzerine Tekke tefekkür setlerinin ana ekran kontrolü eklendi. Canlı siteye yayın yapılmadı.

- Tekke ayarlarında seçilen set, adıyla SÜKÛN ana ekranında ve Tekke sahnesinde görünür. Aynı set akışı iki karttan da kontrol edilir. Başlat / Duraklat / Devam et tek düğmededir; Bitir ayrı ve görünürdür. Bitir kayıtları silmez. Set ayarları kapalı kayıt akordiyonunu açar.
- Set seçimi cihazda saklanır ve ayar yedeğine dahil edilir. Yeniden açılışta set adı geri gelir, ses kendiliğinden başlamaz. Set sürerken başka bir set seçilirse devam eden setin adı, toplamı ve sırası korunur; yeni seçim sonraki başlatma içindir.
- Bütün adımlar katalogdaki sırayla oynar. Her adımın kendi ses kaydı önceliklidir. Kaydı eksik veya oynatılamayan adım için gösterilen dilde cihaz TTS’si kullanılır. TTS kullanılamazsa sessizce adım atlamak yerine açıklamalı hata gösterilir.
- Tam kayıtlı setler r988’deki mevcut tek native WAV motorunu kullanır; kayıtlar ve sessiz aralar birlikte hazırlanır. Hazırlama bütçesine sığmayan setler belleği büyütmeden adım adım oynar. Kısmi setler kendi kayıtlarını ve TTS’yi sırayla kullanır. Kaynak kayıtlar değiştirilmez.
- Kayıt duraklatıldığında aynı dosya ve konumdan devam eder. Sessiz aranın kalan süresi korunur. Mobil cihaz TTS’si güvenilir biçimde duraklatılamadığı için Devam et mevcut metni aynı adımın başından okur; bu davranış kartta açıklanır. Adım sayacı ileri atlamaz.
- Bitir, yeni set başlatma ve hazırlama iptali eski ses/geri çağırımlarını engeller. Tarayıcı sesi engellerse otomatik tekrar denenmez; kullanıcı Devam et ile başlatır. Set kaydı alınırken set başlatılması engellenir. Tekke makam duyuruları set anlatıcısına karışmaz.
- Hızlı set seçiminde geç gelen kayıt taramasının yanlış listeyi göstermesi, eski kayıt ön izlemesinin yeni set üstüne başlaması ve durdurulduktan sonra tamamlanan ekran kilidi isteğinin açık kalması önlendi.
- Yeni düğmelerde açıklama ve İngilizce çeviri vardır. Kartlar için ayrı CSS kapsamı, sarılabilen etiketler, 44 px dokunma alanları ve klavye odağı kullanılır. Onaylı Berhetiyye çerçeveleri, çarklar, Klasik/Feyz düzeni ve mevcut zikir ses motorları korunur. Tempo minimum 0,6 sn / ilk kullanım 1 sn kalır; kullanıcı seçimi değiştirilmez.

## Doğrulama

57/57 kontrol grubu geçti. Yeni set kontrolünde 17 üretim kodu akış senaryosu, arayüz sözleşmesi/CSS hesaplamasında 26 kontrol vardır. Kayıt önceliği, 9 adımlı native set, karma kayıt/TTS sırası, ara duraklatması, TTS yeniden okuma, Bitir sonrası geç callback, engellenen medya, eksik TTS, seçim yarışları, ana ekran kontrolü ve açıklamalar denetlendi. Önceki 19 kayıt/native medya ve 7 Berhetiyye yerleşim senaryosu da geçti.

270 JavaScript blok/dosyası parse edildi. 40 zorunlu runtime dosyasının hash/SRI’sı, servis çalışanı/manifest/uygulama r990 kimlikleri, çevrimdışı runtime varlığı, HTML eşliği ve 8 çark görseli doğrulandı. Paketlemede ZIP CRC, tekil yollar ve uygulama dosyalarının byte eşliği ayrıca denetlenir.

Bu kontroller üretim kodu, deterministik DOM/medya/TTS/saat modelleri ve CSS bildirimleri üzerinde yapıldı. Gerçek tarayıcı çizimi, fiziksel Android/Xiaomi dokunması, duyulan ses ve kilit ekranı çalışması bu ortamda denenmedi; DOGRULAMA_r990.json içinde NOT_RUN’dır. Özellikle karma TTS setlerinin kilit ekranında kesintisiz sürmesi cihazın TTS ve tarayıcı desteğine bağlıdır. Kayıtlı tam setlerin tek native dosyalı yolu korunur. Tarihsel raporlar önceki sürümlerin arşividir; güncel rapor bu dosyadır.
