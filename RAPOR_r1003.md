# SÜKÛN r1003

r1002 üzerine Eng çeviri tamamlaması. Atlas'ta durak ve bu cihazda gözlenen tamamlanma bilgisi, dinamik kayıt adedi (292 dahil), seans adı placeholder ve erişilebilirlik etiketi çevrilir. Kaynak Merkezi'nin dört açıklama katmanı ve HTML içinde bölünmüş kaynak notu, Okuyucu ekle, kuyruk türleri/süreleri, adım/sorun adetleri, ileri süre, geri al, kilitli bölüm ve Ay menzili açıklamalarındaki kalıntılar tamamlandı.

Dil geçişleri Eng → Türkçe → Eng deterministik DOM modeliyle kontrol edildi. Özel seans adı, giriş değeri, imleç seçimi, kaydırma konumu, sayılar ve özel isimler korunur. Ses/sayaç kodu değiştirilmedi. Runtime varlıklarının r1002 ile byte eşliği, offline sürüm sorgusu dışında doğrulandı.

87/87 regresyon grubu; yeni dinamik ekran grubunda 5/5 kontrol geçti. 272 JavaScript blok/dosyası, 44 runtime hash/SRI, 8 artwork ve build/SW/manifest eşliği kontrol edildi. ZIP CRC ve 253 gerekli uygulama dosyasının byte eşliği doğrulandı.

Gerçek tarayıcı çizimi, fiziksel Android, duyulan ses ve ekran kilidi testleri NOT_RUN. Canlı yayın yapılmadı.
