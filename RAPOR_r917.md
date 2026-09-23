# SÜKÛN r917 — 28 İsim / 28 Sahne

r916 tabanı korunarak hazırlanmıştır.

## Tamamlananlar

- 25 yeni dikey, sinematik ve arayüz öğesi içermeyen sahne üretildi. Her isim ayrı dosyaya bağlıdır; bir resmin renk varyantları kullanılmadı.
- 1 Berhetîhin, 10 Hûtîrin ve 11 Kalnehûdin’in onaylı r837 PNG dosyaları r876 tam paketinden bulundu. Dosya içerikleri byte düzeyinde aynen korundu; yeniden üretilmedi.
- Önceki pakette eksik kalan özgün ana sahne `assets/sukun-nur-sanctuary-r757.png` aynı eski tam paketten geri getirildi.
- Mevcut görsel otoritesi genişletildi. Aktif Berhetiyye seçimi → kanonik indeks → sceneId → mevcut sahne katmanı bağlantısı kuruldu. İkinci bir sahne yöneticisi veya yeni çark eklenmedi.
- Favori seçimlerinde mevcut zKat()/zIdx() çözümlemesi kullanılır. İsimler metin benzerliğine göre eşlenmez; özellikle 22–24 ayrı tutulur.
- Sayaç ve oynatma durumu sahne anahtarının parçası değildir. Aynı isimde sayı, pause/stop ve yeniden çizim sahneyi yeniden seçmez. Sahne dosyaları gerektiğinde yüklenir; 28 büyük görsel açılışta topluca indirilmez.
- Otomatik/elle seçim korunur. Otomatikte aktif isim, elle seçimde seçilen sabit sahne kullanılır. Kaydedilmiş seyir önizlemesi bağımsız bir ikinci arka plan seçmez.
- 99 Esmâ görünümünde Berhetiyye sahnesi ve sahne açıklaması gösterilmez. Mevcut tek çark düzeni, üç çark seçeneği ve r916 ambiyans düzeltmeleri korunur.
- Sahne açıklamalarında sembolik kurgu, anlatıdan ilham ve rivayet katmanı ayrıldı. Tahtın getirilmesi “İlim Sahibi Zât” olarak adlandırıldı; yüzük imtihanı rivayet olarak işaretlendi.
- Ses/TTS, PlaybackController, foreground queue ve sayaç/seyir motorlarının kodları değiştirilmedi. Mevcut kilit denetimi korunur.
- HTML, manifest, build işaretleri ve servis çalışanı sürümü r917 ile eşlendi.

## Doğrulama

- 241 çalıştırılabilir JavaScript bloğu ve servis çalışanı sözdizimi geçti.
- İzole görsel bileşen testi: 28/28 kanonik eşleme, 28/28 görsel çözme, 5→6 geçişi, tekil seçim, elle/otomatik seçim, erişim kapanınca sahne kaldırma ve 99 Esmâ önizlemesinde Berhetiyye arka planını kaldırma geçti.
- 60 sayaç/oynatma güncellemesinde sahne çözümleme sayısı sabit kaldı (2→2).
- 360/390/430 px genişlikte bir görünür çark, yatay taşma yok.
- Gerçek uygulama: kanonik 28 sıra manifestle aynı; +1/−1 sayımı, 99 Esmâ iç çarkı ve Rahmân etiketi, kilitli 28 sekmesinin gizli kalması, mini/midi/pro ambiyans açılımı ve “Kendi Seslerim” başlığının görünürlüğü kontrol edildi. JavaScript çalışma zamanı hatası görülmedi.
- Üç korunan görsel arşivdeki özgün dosyalarla aynı. index.html ile nero.html aynı; paket yolları ve ZIP bütünlüğü doğrulandı.

## Kullanım ve kapsam

Berhetiyye → Sahne → “İsme göre otomatik” seçin. Aktif isim değişince kendi sahnesi açılır. Sabit sahne seçiliyse isim geçişlerinde o sahne korunur.

ZIP’i mevcut sitenin üzerine birleştirerek aktarın; mevcut assets klasörünü silmeyin. Bu paket güncel uygulama kodu ve 28 sahnenin tamamını içerir, fakat uygulamanın tarih boyunca kullandığı bütün eski medya/kaynak dosyalarını yeniden toplamayı amaçlamaz. Kullanıcı kayıtları ve ayarlar silinmez. Canlı siteye yayın yapılmadı.

Berhetiyye geçiş testi izole bileşende yapıldı; gerçek uygulamanın kilidi aşılmadı. Gerçek Android kilit ekranı, kendi ses/TTS ile tam 28/99 bitişi ve uzun süre arka planda ses testi bu sürümde yapılmadı. Bu sürüm ses motoru değişikliği içermez.

## Sahne matrisi

Renk/unsur/simge alanları görsel sanat yönetimine aittir; uygulamanın kaynak, ebced ve geleneksel unsur bilgilerini değiştirmez.

| Sıra | İsim | Sahne | Ana renk | Görsel unsur | Sembol | Mekân | Durum |
|---:|---|---|---|---|---|---|---|
| 1 | Berhetîhin | Billur Sarayın Kapısı | Safir | Su ve nur | Kapı | Billur saray | Özgün korundu |
| 2 | Kerîrin | Süleyman’ın Tevhid Ufku | Lacivert | Rüzgâr | Ufuk | Yüksek teras | Yeni üretildi |
| 3 | Tetlîhin | Mührün Muhafız Odası | Gümüş-safir | Nur | Mühür | Muhafız odası | Yeni üretildi |
| 4 | Tûrânin | Billur Şelale | Turkuaz | Su | Şelale | Bahçe terasları | Yeni üretildi |
| 5 | Mezcelin | Sarayın Kozmik Mekanizması | Ametist | Hava | Göksel halkalar | Kozmik gözlemevi | Yeni üretildi |
| 6 | Bezcelin | Süleyman ile Belkıs’ın Bahçesi | Zümrüt | Su | Birlikte yürüyüş | Saray bahçesi | Yeni üretildi |
| 7 | Terkabin | İki Âlemin Birleşen Revakı | Safir-ametist | Hava | Birleşen yollar | Revak | Yeni üretildi |
| 8 | Berheşin | Basiret Aynası | Mor | Nur | Ayna | Kristal salon | Yeni üretildi |
| 9 | Galmeşin | Sebe’nin İhtişamı | Altın-topaz | Su | Şehir | Sebe bahçeleri | Yeni üretildi |
| 10 | Hûtîrin | Adalet ve Mühür | Yakut-lacivert | Nur | Mühür ve asâ | Adalet salonu | Özgün korundu |
| 11 | Kalnehûdin | Rüzgâr ve Hüdhüd | Safir | Rüzgâr | Hüdhüd | Ay ışıklı teras | Özgün korundu |
| 12 | Berşânin | Hüdhüd’ün Sebe’yi Keşfi | Topaz-turkuaz | Hava | Hüdhüd | Sebe üstü balkon | Yeni üretildi |
| 13 | Kazhîrin | Rüzgârlara Hükmeden Hükümdar | Gümüş-lacivert | Rüzgâr | Dalgalanan pelerin | Yüksek teras | Yeni üretildi |
| 14 | Nemûşelahin | Billur Taht Salonu | İnci-altın | Nur | Boş taht | Taht salonu | Yeni üretildi |
| 15 | Berheyûlen | Süleyman’ın Duası | Safir-altın | Nur | Dua | Saray terası | Yeni üretildi |
| 16 | Beşkeylahin | Emniyet Kubbesi | Gece mavisi | Su | Kubbe | Korunan şehir | Yeni üretildi |
| 17 | Kâzmezin | Karıncalar Vadisi | Zümrüt | Toprak | Karınca yolu | Vadi | Yeni üretildi |
| 18 | Engalelîtin | Karıncanın Fısıltısı | Kehribar-yeşil | Toprak | Karınca kolonisi | Yosunlu taş | Yeni üretildi |
| 19 | Kaberâtin | Fanilik Salonu | Dumanlı kuvars | Toprak | Bırakılmış taç | Fanilik salonu | Yeni üretildi |
| 20 | Gayâhen | Sebe Kraliçesinin Tahtı | Yakut | Su | Kraliçenin tahtı | Sebe sarayı | Yeni üretildi |
| 21 | Keydehûlen | İlim Sahibi Zât – Tahtın Getirilmesi | Beyaz-safir | Nur | Taht | Billur avlu | Yeni üretildi |
| 22 | Şemhâhirin | İlim Sahibi Zât | Ametist | Nur | Kitap | Sırlar kütüphanesi | Yeni üretildi |
| 23 | Şemhâhîrin | Uçan Halı – Rüzgâr Ordusu | Azur | Rüzgâr | Halı | Bulutların üstü | Yeni üretildi |
| 24 | Şemhâhiyerin | Süleyman’ın Mektubu | Fildişi-lapis | Hava | Mektup ve Hüdhüd | Yazı masası | Yeni üretildi |
| 25 | Bikehtahûniyyetin | Ayasofya Altındaki Billur Kale | Turkuaz-altın | Su | Ayasofya | Yeraltı billur kalesi | Yeni üretildi |
| 26 | Beşârişin | İfrit ve Yüzüğün İmtihanı | Obsidyen-yakut | Gölge ve nur | Yüzük | Çözülen saray | Yeni üretildi |
| 27 | Tûneşin | Mülkün İadesi ve Şükür | Beyaz-altın | Nur | Yüzük ve şükür | Şafak terası | Yeni üretildi |
| 28 | Şemhabârûhin | Sükûn’un Son Kapısı | Beyaz-altın | Nur | Açılan kapı | Son menzil | Yeni üretildi |
