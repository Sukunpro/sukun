# SÜKÛN r1014

Onaylanan Cabir Tekkesi görünümü r1013 üzerine uygulandı. Berhetiyye isimlerinin tamamı, geçerli seçili isim ve erişim durumuna göre bu görünümü kullanır. Feyz/Klasik ana uygulama ve önceki ses/veri düzeltmeleri korunur.

## Görünüm ve canlı bağlam

Tekke'ye özgü tek parça gece billur sarayı, kristal sütunlar, kandiller, ametist çiçekler ve küçük Hüthüt kullanılır. Mevlevi figürü veya yinelenen arka plan bulunmaz. SÜKÛN ametist, yardım ametist, Mihrap ve Değiştir safir, Duraklat zümrüt, Bitir yakut olur; yerel düğmelerin mevcut olayları korunur. Arka plan bir tam viewport katmanıdır, Chrome çubuğunun açığa çıkardığı alanı da kaplar. Kök grid ve oynatma kontrolleri sabit küçük viewport içinde kalır. Hareket nefes simgesi ve çizgisindedir.

Yeni görsel assets/scenes/tekke-r1014/berhet-billur.webp yolundadır. Onaylanan mockup'tan yerleşik image_gen ile arayüz yazıları, düğmeleri, sayaç ve halka kaldırılarak üretildi; sahne değişmeden WebP kalite88 ile kodlandı. Tam istem aynı klasörde GENERATION_PROMPT.json içinde bulunur. Görsel, service worker'ın SHA-256 doğrulanan zorunlu varlık listesine eklendi. Önceki görseller bayt düzeyinde korunur.

Tekke'nin saklanan bağlamına kategori ve doğrulanmış Berhetiyye indeksi eklendi. Tema canlı ana sayfa seçimi yerine mevcut seansı izler; açık veya duraklatılmış seansa geri girildiğinde o seansın zikri korunur. Ad, Arapça metin, sayaç ve süreye göre hedef hesaplama değişmedi. Değiştir gerçek ana seçim ekranını açar; mevcut akışın yeni zikir için önce bitirilmesi gerektiği açıkça gösterilir. Erişim kilitlenirse görünür ve gizli özel metinler temizlenir; ses ve sayaç durumu bu sunum işlemiyle sıfırlanmaz.

## Boyut dalgalanmasının nedenleri ve düzeltme

Önceki kod, Chrome görsel viewport yüksekliğinin adres çubuğu animasyonu sırasında değişen her değerini uygulama yüksekliğine yazıyordu. Ayrıca değişen telkin ve açıklama metinlerinin anlık yüksekliği nefes halkası ölçüsünden çıkarılıyordu. Kontrollü gerçek üretim işlevi testleri bu iki değişimin yerleşimi oynattığını doğruladı.

Desteklenen tarayıcıda 100svh kullanılır; eski tarayıcı için yön/genişlik değişimi ve büyük gerçek pencere değişimiyle yenilenen piksel tabanı vardır. Metin alanı odaklı klavye küçülmesi geçici olarak ele alınır; yakınlaştırma, kaydırma çubuğu animasyonu ve ses kaydırıcısı odağı tabanı bozmaz. Nefes halkası yalnız sabit viewport bütçesi ve genişlikten ölçülür. Telkin ve uzun açıklama büyüyebilir ve sahne içinde doğal olarak kaydırılır; merkez üstten sabitlenir. Dar ekranda eşit iki oynatma düğmesi ve tam genişlikte ses satırı kullanılır. Mevcut Hû nefes dönüşümü korunur.

## Doğrulama

705 kontrollü işlev senaryosu ve statik görünüm kontrolü, 150 sürüm/dosya/SRI kontrolü ve 272 JavaScript gövdesi sözdizimi kontrolü geçti. Önceki 552 senaryo korunur. Geometri testinin 34 senaryosu r1014'te geçer; aynı testler r1013'te 17 hata yakalar. Bu sonuç, mobil yerleşimin gerçek CSS motorunda veya fiziksel telefonda ölçüldüğü anlamına gelmez.

Önceki mikrofon kaydetme, katalog, atomik kayıt erişimi, eksik ses yedeği tamamlama, otomatik kendi ses önceliği, TTS alternatifi ve Feyz/Klasik kaydırma/tıklama testleri yeniden çalıştırılır. Tam ZIP ayrıca bağımsız çıkarılıp dosya hash'leri, CRC ve taşınabilir testler ile kontrol edilir. Gerçek Android mikrofonu, duyulabilir ses, işletim sistemi kilit ekranı, tarayıcı kompozitörü ve dokunmatik kaydırma ataleti bu ortamda doğrulanmadı.
