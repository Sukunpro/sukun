# SÜKÛN r979 — kilitten dönüşte görünüm ve tanılama

r978 tam paketi üzerine hazırlanmıştır. Uygulama, SW, manifest ve güncel build kimliği r979 olarak eşleştirildi. Bu paket tam web/PWA kaynağıdır; APK değildir. Canlı GitHub yayını yapılmadı.

## Kullanıcının siyah ekran olayı

Ekran görüntüsünde tarayıcı çubuğu görünürken uygulama alanı bütünüyle koyu renktir. Verilen iki sağlık raporu olayın ardından açılan aynı yeni sayfaya aittir; siyah ekran anında DOM veya piksel ölçümü içermez.

Önceki oturumda görünür dönüş 2 Ekim 2026 09:35:15 civarında (Türkiye saati) PLAYING ve Tefekkür açık olarak kaydedilmiştir. Daha sonra pagehide, count 139/336 ile duraklatma ve freeze; 09:36:49 civarında yeni sayfa açılışı görülür. Yeni sayfada aynı esmâ indeksi 12 ve 139 sayısı geri gelir. wasDiscarded false ve crashConfirmed false; raporlar bir işletim sistemi çökmesini veya bellek/GPU sorununun kesin neden olduğunu kanıtlamaz. Önceki sahip değişimi olayları tek başına duyulur bir ses kesintisinin kanıtı değildir.

Yeni sayfada daha sonra görülen SW hata aşaması ekran görüntüsündeki siyah olaydan sonradır. Dolayısıyla onu siyah ekranın nedeni olarak göstermiyoruz. Kesin ekran kaybolma nedeni mevcut kanıtla belirlenemedi; aşağıdaki doğrulanmış yaşam döngüsü açıkları düzeltildi ve eksik görünürlük kanıtı eklendi.

## Düzeltilen yaşam döngüsü

Global animasyon kapısı ve CIZ çizim zamanlayıcısı yalnız resume olayını bekleyip donmuş kalabiliyordu. Görünür visibilitychange veya pageshow da donma bayrağını temizler. Gizli sayfada animasyon/çizim yeniden başlatılmaz. Mevcut işler yeniden ölçülmek üzere işaretlenir; tek çizim döngüsü korunur.

Mevcut zikir arayüzü bekleyen rAF kimliğini iptal edip aynı durum modelinden tekrar gösterebilir. Bu yol start, resume, pause, stop, sayım veya sayfa yenileme komutu göndermez. Terkip, kayıt ve kilit ekranı ses sahipliği değiştirilmez.

Yeni presentation-r979.js kontrolü yalnız açılış, görünür dönüş, resume/pageshow/focus veya kullanıcının görünümü yeniden göster isteğinde çalışır. Arka planda ve her zikir sayımında DOM taraması yapmaz. Aynı dönüşün üst üste gelen olayları birleştirilir; zamanlayıcılar gizlenmede iptal edilir. Normal açılış perdesine dokunulmaz. Biten, gizlenen veya kaldırılan perdeden kalan r608/r610 gizleme sınıfları temizlenir. Tefekkür açıkken zikir bölümü gizli kalmışsa gösterilir.

Tefekkür yüzeyi bütünüyle ekran dışında kalmışsa ve kullanıcı dönüşten beri dokunmamış/kaydırmamışsa mevcut sayaç görünür yere getirilebilir. Görünür yüzeydeki normal okuma ve ayar konumu korunur; açık dialog veya yeni kullanıcı hareketi varken otomatik konum değiştirilmez. Kör bir stil sıfırlaması, bütün sekmeleri açma, otomatik Tefekkürden çıkış veya reload yapılmaz. Görünüm doğrulanamazsa sayacı sıfırlamayan TR/EN yeniden göster düğmesi sunulur.

## Sağlık raporu

Kayıtlı son görünürlük gözlemi, uygulama köklerinin bağlantı/görünürlük/boyut/viewport ve üst eleman engelleyicileri, scroll, bilinen body sınıfları, açılış perdesi, animasyon kapısı ve gözlenen rAF teslimini içerir. Snapshot yalnız önbellekteki küçük gözlemi döndürür; sağlık ekranının açılması yeni DOM kontrolü, ses eylemi veya kurtarma başlatmaz. Kullanıcı metni, kayıt sesi, URL sorgusu veya anahtar toplanmaz. DOM görünürlüğü ve rAF teslimi gerçek raster/GPU veya fiziksel ekran çiziminin kanıtı değildir.

SW_OPERATION işlemin başarısızlığını sürüm eşleşmesi ve temel dosya bütünlüğünden ayrı uyarır. Ham mesaj yerine sınıflandırılmış, sorgusuz hata bilgisi korunur. r932 açılış gözlemi artık tekil otomatik zikir dahil canonical peek() durumundan mode/phase/owner/index/count alır; durumu yenileyen snapshot() çağırmaz. pagehide ve persisted gözlemi freeze sırasında kaybolmaz, aynı sayfanın pageshow olayında temizlenir. Fiziksel medya bilgisi olarak yorumlanmamalıdır.

## Doğrulama

27 regresyon süiti geçti. Yeni yaşam döngüsü/çizim/oturum kanıtı 20, görünüm toparlama 22 ve sağlık kanıtı 11 model testinden geçti. Gizlenme, freeze/resume olay sırası, BFCache tarzı pageshow, teslim edilmeyen rAF, stale veya canlı açılış, Tefekkür görünürlüğü, kullanıcı kaydırması, TR/EN düğme, sınırlı iş ve ses/sayaç eylemsizliği test edildi. Mevcut terkip, eko, ayarlar, manuel ses, dokunma/kaydırma, çark katalogları ve çevrimdışı SW süitleri de geçti. Ayrıntılar integration/r979/evidence/ içindedir.

261 JavaScript kaynağı ayrıştırıldı, 31 runtime hash, mevcut sekiz yeni çark görseli, HTML SRI, index/nero eşitliği, SW zorunlu modül kaydı ve sürüm kimlikleri doğrulandı. ZIP CRC ve her uygulama dosyasının arşivde birebir bulunduğu paketleme sırasında denetlenir.

Gerçek tarayıcı çizimi, fiziksel Android ve uzun ekran kilidi testi NOT_RUN. Bu testler yaşam döngüsü olaylarını kontrollü hostlarda çalıştırır; telefondaki siyah ekranın tüm nedenlerinin çözülmüş olduğunu kanıtlamaz. Önceki r978 düzeltmeleri ve geçmiş raporlar arşiv olarak korunur; güncel rapor bu dosyadır.
