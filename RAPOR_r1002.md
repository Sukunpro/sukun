# SÜKÛN r1002

r1001 tam paketi üzerine Eng dilindeki kalan ekran metinleri tamamlandı. 164 yeni çeviri ve sekiz dar UI şablonu eklendi.

- Okumalar ve Seyir menüleri; klasik/sade/odak küçük düzen etiketi; kaldığın yerden devam.
- Vakit önerisinin «Yâ … zikrine geç» düğmesi ve yeni seans oluşturucunun alt açıklaması.
- Kayıtlı oturum özetleri, kişisel kayıt adetleri, ilk grafiğin gün adları, seri bilgisi, en iyi gelen seans açıklaması ve ikinci grafiğin devam metni.
- Günün yerleşik sözleri ve güncel açıklamaları. Etkin 63 söz ve 30 hadis metni üretim fonksiyonu üzerinden kontrol edildi. Kendi eklediğin sözler ve kaynak/kişi kimlikleri çevrilmez.
- Atlas'ın sabit menzil takvimi, ay adları, anlık Ay konumu hesaplanmadığı uyarısı, metin/kaynak statüsü, Abjad ve unsur/tabiat kaynak rozetleri, Nero tefekkür notu etiketi.
- Okuma metni düzenleme uyarıları, cihaz sesi/kayıt açıklamaları ve yeni görünüm/performans/akış barı ayarlarının kalan metinleri.

Çeviri sözlüğünün tek başına sorgulanmasına ek olarak gerçek üretim JavaScript'inin oluşturduğu HTML parçaları deterministik DOM modeliyle ayrıştırıldı. Eng → Türkçe → Eng geçişi; HTML içinde bölünmüş metinler, yeni eklenen düğmeler, 12 ay, iki grafik, seçili sözün aynı kalması, özel metin/isim/arama değeri korunması kontrol edildi. Dil değişimi yeni söz seçmez, söz geçmişine yazmaz; yalnız dil tercihi kaydedilir. İlk grafiğin sunumu yeniden çizilir; seans kayıtları ve sayısal değerleri değişmez.

Ses ve sayaç motorlarında değişiklik yapılmadı. Runtime dosyaları r1001 ile byte karşılaştırıldı; yalnız offline-scenes dosyasının sürüm sorgusu güncellendi. Arapça metin, eser künyeleri, tempo, hedef, ses dosyaları ve önceki tüm işlevler korunur.

86/86 regresyon grubu ve yeni ekran grubundaki 14/14 kontrol geçti. 272 JavaScript blok/dosyası, 44 runtime hash/SRI, build/SW/manifest r1002 eşliği ve 8 çark artwork kontrolü geçti. ZIP CRC ve 253 gerekli uygulama dosyasının byte eşliği doğrulandı.

Gerçek tarayıcı çizimi, fiziksel Android, duyulan ses ve ekran kilidi testleri NOT_RUN. Model testleri gerçek cihaz testi yerine geçmez. Canlı siteye yayın yapılmadı.

Güncel yükleme yönergesi GITHUB_YUKLEME_r1002.md, kaynak index.html/nero.html ve test kanıtları integration/r1002 altındadır. Eski raporlar tarihsel arşivdir.
