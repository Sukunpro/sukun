# SÜKÛN r996

Tekke setinin Başlat sonrası kendi kayıt veya TTS çalmaması için r995 tam paketine düzeltme uygulandı. Canlı siteye yayın yapılmadı.

Kullanıcının ekranında set Hazır, Duraklat ise devre dışıydı. Kodda Tekke ekranı ses başlatılmadan açılıyor, set ise ses sekmesinin sahipliği yoksa sahipliği almaya çalışmadan false dönüyordu. Yeni açılan sekmede bu iki durum aynı ekranı oluşturur. Önceki r995 üretim denetleyicisi, gerçek Tekke başlatma köprüsü ve gerçek sekme sahipliği koduyla kontrollü ortamda aynı sessiz Hazır durumu yeniden üretildi. Bu bulgu telefondaki tüm olası ses sorunlarının fiziksel teşhisi değildir.

## Düzeltmeler

- Kullanıcının Başlat eylemi mevcut tek sekme sahipliği mekanizmasından erişim alır; erişim almadan kayıt/TTS başlamaz. Başka sekmede etkin ses varsa o sekme susturulmaz, burada hata ve tekrar başlatma yolu gösterilir.
- Ses context'i gerçek Başlat/Devam et dokunuşunda, asenkron kayıt yüklemesinden önce hazırlanır. Erişim veya yükleme sırasında Bitir, eski işlem bittiğinde sesin geç başlamasını engeller.
- Tekke seti hazırlarken, okurken ve duraklatılmışken sahiplik rezervasyonu korunur. Önceki Stop işleminin gecikmiş boşalma kontrolü bu rezervasyonu düşürmez. Bitiş/hata/Bitir sonrası gerçek kaynaklar temizlenince sahiplik bırakılır. Sahiplik iptalinde Tekke kaydı/TTS de durur.
- Erişim hazırlığı 12 sn, her kayıt yüklemesi 10 sn sınırı kullanır. Süre dolarsa okunamamış bir kayıt üstünden sessizce adım atlanmaz; kayıtlar korunur ve hata/tekrar başlatma sunulur. Geç sonuçlar yeni seansı etkileyemez.
- Kayıt ve TTS başlangıcı için 8 sn kontrolü eklendi. Kayıt play vaadi veya TTS başlangıç olayı gelmezse aynı adımda duraklatılır. Devam et açık kullanıcı eylemiyle aynı dosya/metni yeniden dener; otomatik tekrar deneme veya adım atlama yoktur. Gerçek playing/onstart olayı başlangıç beklemesini bitirir.
- Tüm adımları kayıtlı set yine tek yerel WAV ve native medya saatiyle ilerler. Kısmi kayıtta her adım kendi kayıtla, kayıt yoksa TTS ile okunur. Bozuk kayıt aynı adımda mevcut TTS geri dönüşünü kullanır. Duraklat/Devam et mevcut dosya, konum ve adım sırasını korur; TTS aynı metnin başından devam eder.
- Aktif sahne Hazır durumundaysa Başlat, hata durumundaysa Tekrar başlat görünür. Devre dışı Duraklat çıkmaz. Hazırlama sırasında tekrarlı başlatma düğmesi kapalıdır; Bitir erişilebilirdir. Yeni hata açıklamaları Türkçe/İngilizce desteklidir.

Kişisel kayıt/ham kayıt arşivi, IndexedDB şeması, çark resimleri ve tema görselleri değiştirilmedi. Minimum tempo 0,6 sn, ilk kullanım 1 sn ve kullanıcının geçerli tempo seçimi korunur. r994 ekran yüksekliği/Mihrap/alt kontrolleri ve r995 güncelleme süre sınırı/iptal/yeniden deneme düzeltmeleri korunur.

Değişen assetler yalnız tekke-set-r990.js, tekke-sequence-r988.js, tekke-ux-r992.js ve offline-scenes-r962.js sürüm query'sidir. Inline Tekke adaptörüne ses hazırlama; sekme sahipliği adaptörüne Tekke busy/paused/stop desteği eklendi. Runtime dosya isimleri mevcut bağlantıları korur. Uygulama, SW, manifest, latest, SRI ve zorunlu runtime SHA-256 r996 ile eşlenmiştir.

## Doğrulama

73/73 otomatik kontrol grubu geçti. 16 yeni üretim kodu senaryosu önceki sessiz başlatma hatasını, ilk açılışta kendi kayıt/TTS ve 9 kayıtlı tek WAV başlatmasını, başka sekme engelini, hazırlama/duraklatmada sahiplik korumasını, erişim ve kayıt bekleme sınırlarını, geç yanıt ve Bitir temizliğini, sessiz TTS kuyruğunu, bitmeyen play vaadini, gerçek playing olayını ve sahiplik kaybını sınar. Native DOM testine Hazır/hata ekranındaki Başlat/Tekrar başlat davranışı eklendi. Önceki testlerin kapsamı korunmuştur; yeni asenkron yollar için model zamanlayıcıları ve mikroiş kuyruğu uyarlanmıştır.

272 JS blok/dosyası parse edildi. 44 zorunlu runtime hash/SRI, index/nero eşliği, uygulama/SW/manifest kimliği ve 8 onaylı çarkın hash/alpha bilgisi geçti. ZIP CRC, tekil yollar, eksiksiz asset listesi ve gereken uygulama dosyalarının byte eşliği doğrulanır.

Bu testlerde kaynak kodu gerçektir; IndexedDB/Web Lock kökeni, ses/TTS çıkışı ve DOM olayları modellenmiştir. Fiziksel Android/Xiaomi, gerçek kilit ekranı, hoparlörden çıkan ses ve tarayıcı görüntüsü NOT_RUN durumundadır. Güncelleme telefona yüklendikten sonra kendi kayıtlı, kayıtsız ve karışık set; Duraklat/Devam et/Bitir; kilit dönüşü; çevrimdışı kayıt ve başka sekme akışları telefonda denenmelidir. Önceki sürüm raporları arşivdir; bu dosya güncel rapordur.
