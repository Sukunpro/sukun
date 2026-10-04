# SÜKÛN r1004

r1003 düzeltmeleri korunarak Eng taraması genişletildi. 46 sabit UI metni ve beş dinamik şablon eklendi. Kayıt yeniden tarama sonuçları, stüdyo ses dosyası uyarıları, seans/uyarlama uyarıları, ses kaynağı seçenekleri, akış geçişi bildirimleri, canlı özet ve bildirim araçlarının erişilebilirlik etiketleri çevrilir. Sessizlik başlangıç kaydının açıklama/anons şablonları süreyi koruyarak çevrilir.

«292 kayıt görünüyor» Eng dilinde «292 recordings found» olur. Gerçek syncSafetyUI üretim fonksiyonu VM/DOM modelinde 0, 1, 28, 292 ve 1000 kayıtla çalıştırıldı. Çeviri panel oluşturulduğu anda uygulanır, MutationObserver turunu beklemez. Türkçe kaynak korunur; dil değişimi ve yeni tarama doğru kaydı/sayısal değeri gösterir.

Sabit HTML metin ve erişilebilirlik alanları ile sonradan üretilen JS metin adayları tarandı. Kod yorumları, teknik kimlikler, eser/isimler, dua okunuşları, tarihsel sürüm notları ve kullanıcı metinleri çeviri kapsamıyla karıştırılmadı. Bu çalışma gerçek tarayıcıda bütün ekranların tarandığı veya tüm dinamik olasılıkların bittiği iddiası değildir.

Ses/sayaç motoru değiştirilmedi. 44 runtime dosyasının r1003 ile byte eşliği offline sürüm sorgusu dışında korundu. Yeni üretim testinde kayıt statüsü fonksiyonunun farkı yalnız sunum çevirisi; herhangi bir kayıt/veri yazımı, sayım veya ses işlemi eklenmedi. Özel seans adı, imleç seçimi, kaydırma, Arapça ve özel isimler korunur.

88/88 regresyon grubu; yeni UI grubunda 4/4 kontrol ve 46 çeviri geçti. 272 JavaScript blok/dosyası, 44 runtime hash/SRI, 8 artwork ve build/SW/manifest eşliği doğrulandı. ZIP CRC ve 253 gerekli uygulama dosyasının byte eşliği doğrulandı.

Gerçek tarayıcı çizimi, fiziksel Android, duyulan ses ve kilit ekranı testleri NOT_RUN. Canlı yayın yapılmadı.
