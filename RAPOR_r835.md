SÜKÛN r835 — Zikir arayüzü ve sahne düzeltmeleri

Taban: r834. Bu paket canlı siteye yayımlanmadı.

Yapılan düzeltmeler:
1. Berhetiyye düğme ve sahne görünümü, erişim açıkken gerçekten yüklenmiş Berhetiyye ismine bağlandı. 99 Esmâ seyrinin düğmeleri normal görünüme döner. Aktif akıllı seans ve favorinin gerçek kaynak kategorisi korunur.
2. “Bitir” düğmesindeki kesik görsel için çakışan stiller geçersiz kılındı; mevcut saydam kenarlı görsel kullanıldı. Gizli eski duraklat düğmesi yeniden görünmez.
3. Sayaç Başlat/Duraklat düğmesi aktif bağlama uyar. Boş görünen −1/+1 metinleri geri getirildi. Zikir ve ses motorlarının düğme davranışları değiştirilmedi.
4. “Oynatıcıyı göster” üzerindeki bulanıklık, opak arka plan ve gölge kaldırıldı. Berhetiyye görünümünde görselin saydam kenarları korunur.
5. Zikir ayarlarının başka bölümlere taşınıp boş kalmasına neden olan düzenleyici düzeltildi. Tempo, hedef ve ses ayarları aynı canlı kontrol öğeleriyle açılır panelde gösterilir; değerler ve olay bağlantıları korunur.
6. Zikir bölümüne Esmâü’l-Hüsnâ listesi kısayolu eklendi. Kasem-i Berhetiyye kısayolu yalnız kilit açıkken görünür ve kullanılabilir. Aynı kategorinin listesini açmak sayacı ya da seçimi sıfırlamaz.
7. Hûtîrin dahil aktif Berhetiyye isimleri, Otomatik seçiliyken Süleyman sahnelerini seçer. Normal zikre geçiş veya kilitleme Mevlevi arka planını geri getirir. Tefekkür panelindeki eski sabit görsel katmanı kaldırıldı.
8. Arka plan menüsü dokuz mevcut sahneye bağlandı. Geç yüklenen eski bir seçim yeni seçimin üzerine yazamaz; dosya yükleme hatasında Billur Saray ve açıklama gösterilir. Tekrar seçimle yeniden denenebilir.

Sahneler: Billur Saray, Sırlar Sarayı, Asâ, Saray Şelalesi, Rüzgâr Terası, Kristal Sarayın Sırrı, Mühr-ü Süleyman, Ametist Saray, Ayasofya · Billur Saray.

GitHub yüklemesi:
- Tam kurulum veya mevcut sürüm belirsizse SUKUN_r835_TAM_PAKET.zip kullan.
- r834 kuruluysa SUKUN_r835_GITHUB_GUNCELLEME.zip yeterlidir. ZIP içindekileri açıp site köküne klasör yapısını koruyarak yükle; ZIP dosyasını tek başına yüklemek uygulamayı güncellemez.
- index.html, nero.html, sw.js, manifest.webmanifest, surumler.json ve __sukun_ sürüm dosyaları kökte kalır. assets klasörünü olduğu gibi birleştir.
- Jewel görselleri assets/berhetiyye-premium/ altında kalır. Yeni dağınık Jewel klasörü yoktur. Güncelleme paketine dokuz sahne, Mevlevi arka planı ve gereken sayaç/düğme görselleri özellikle dahil edildi.
- Güncelleme paketini boş bir siteye kurma; r834'ün kalan dosyalarını kullanır. Tam paket bu bağımlılığı taşımaz.
- Yayın tamamlanınca nero.html?v=r835 adresini aç. Uygulama içi sürüm etiketi r835 olmalıdır. Gerekirse normal yeniden yükleme kullan; yerel kayıtları silmek gerekmez.

Doğrulama:
126 sayaç/ses/taşıma regresyon kontrolü, 20 DOM/CSS/bağlam kontrolü ve 11 Service Worker kontrolü geçti: toplam 157/157.
57 sabit yerel kaynak yolu ve 71 tekil önbellek yolu doğrulandı. Dokuz sahne dosyası okunabiliyor. 121 mevcut asset dosyası SHA-256 karşılaştırmasında r834 ile byte düzeyinde aynı; yeniden sıkıştırma veya görsel kalite düşürme yok. Önceki animasyon dosyaları korunmuştur.
Arayüz kontrolleri, olay akışını ve stil seçicilerini sınayan DOM/kaynak testleridir. Bu ortamda yerel tarayıcı önizlemesi engellendi; canlı Nero/index erişimi de araç erişim denetiminden geçmedi. Bu yüzden canlı site, Android Chrome çizimi, dokunma/scroll ve gerçek ses donanımı üzerinde doğrulanmış sayılmaz. Sıfır hata veya fiziksel cihazda kusursuz görünüm garantisi verilmez.

Telefonda kısa kontrol: 99 Esmâ → kilitli Berhetiyye → kilidi açıp Hûtîrin → Tefekkür → Zikir Ayarları → dokuz sahne → 99 Esmâ geçişi. Ayarlar açılıp kapanırken sayaç korunmalı; kısayollar erişime uymalı; Bitir tek dokunuşta mevcut seyir motoruna iletilmelidir.
