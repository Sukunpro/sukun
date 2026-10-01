# SÜKÛN r973 — TAM paket / GitHub yükleme

Depo: `sukunpro/sukun`. Hedef yollar mevcut GitHub Pages yayınının kullandığı depo köküne göredir. Bu çalışmada GitHub’a canlı yayın yapılmadı.

**SUKUN_r973_TAM_PAKET.zip’i aç. İçindeki kök uygulama dosyalarını ve assets klasörünün tamamını aynı commit ile yükle. ZIP dosyasını tek başına GitHub’a koymak uygulamayı güncellemez.**

`r973_work`, `delivery_r973` veya yeni bir üst `sukun` klasörü oluşturma. `index.html` ve `assets/` yan yana bulunmalı. Aynı adlı mevcut dosyaları değiştir; klasörleri alt yollarını koruyarak birleştir. Depoda paket dışında kalan dosyaları silme.

## Depo köküne yüklenecek dosyalar

| ZIP içindeki dosya | GitHub hedefi |
|---|---|
| `index.html` | `index.html` |
| `nero.html` | `nero.html` |
| `sw.js` | `sw.js` |
| `manifest.webmanifest` | `manifest.webmanifest` |
| `sukun-build-r973.json` | `sukun-build-r973.json` |
| `sukun-latest.json` | `sukun-latest.json` |
| `icon-192.png` | `icon-192.png` |
| `icon-512.png` | `icon-512.png` |

## Klasörlerin hedefi

| ZIP içindeki kaynak | GitHub hedefi |
|---|---|
| `assets/runtime/` içindeki 25 JS/CSS dosyasının TAMAMI | `assets/runtime/` |
| `assets/berhetiyye-premium/` tüm taş ve kontrol görselleri | `assets/berhetiyye-premium/` |
| `assets/scenes/` ve alt klasörleri | `assets/scenes/` ve aynı alt klasörler |
| `assets/wheels-r924/` ve alt klasörleri | `assets/wheels-r924/` ve aynı alt klasörler |
| `assets/wheel-navigation-r964/` beş PNG | `assets/wheel-navigation-r964/` |
| Doğrudan `assets/` içindeki dosyalar | Doğrudan `assets/` |

**assets klasörünün tamamı 222 dosyadır.** Alt klasörleri düzleştirme, eski r919/r920/r938/r964 dosya adlarını değiştirme. Sürüm r973 olsa da bu isimler bağlantıların parçasıdır. Yalnız HTML veya yalnız sw.js yüklemek yeni düzeni etkinleştirmek için yeterli değildir.

## Çalışma dosyalarının tek tek hedefleri

| Dosya | GitHub hedefi |
|---|---|
| `assets/runtime/audio-palette-r945.js` | `assets/runtime/audio-palette-r945.js` |
| `assets/runtime/background-owner-r949.js` | `assets/runtime/background-owner-r949.js` |
| `assets/runtime/berhet-controls-r933.css` | `assets/runtime/berhet-controls-r933.css` |
| `assets/runtime/berhet-dock-r933.css` | `assets/runtime/berhet-dock-r933.css` |
| `assets/runtime/berhet-layout-r938.css` | `assets/runtime/berhet-layout-r938.css` |
| `assets/runtime/berhet-layout-r938.js` | `assets/runtime/berhet-layout-r938.js` |
| `assets/runtime/berhet-materials-r933.css` | `assets/runtime/berhet-materials-r933.css` |
| `assets/runtime/berhet-theme-r933.js` | `assets/runtime/berhet-theme-r933.js` |
| `assets/runtime/dock-r920.js` | `assets/runtime/dock-r920.js` |
| `assets/runtime/esma-scenes-r923.js` | `assets/runtime/esma-scenes-r923.js` |
| `assets/runtime/health-r940.js` | `assets/runtime/health-r940.js` |
| `assets/runtime/health-view-r943.css` | `assets/runtime/health-view-r943.css` |
| `assets/runtime/health-view-r943.js` | `assets/runtime/health-view-r943.js` |
| `assets/runtime/interface-r920.js` | `assets/runtime/interface-r920.js` |
| `assets/runtime/lifecycle-r949.js` | `assets/runtime/lifecycle-r949.js` |
| `assets/runtime/nefs-data-r948.js` | `assets/runtime/nefs-data-r948.js` |
| `assets/runtime/nefs-model-r948.js` | `assets/runtime/nefs-model-r948.js` |
| `assets/runtime/nefs-r948.css` | `assets/runtime/nefs-r948.css` |
| `assets/runtime/nefs-ui-r948.js` | `assets/runtime/nefs-ui-r948.js` |
| `assets/runtime/offline-scenes-r962.js` | `assets/runtime/offline-scenes-r962.js` |
| `assets/runtime/scene-picker-r945.css` | `assets/runtime/scene-picker-r945.css` |
| `assets/runtime/scene-picker-r945.js` | `assets/runtime/scene-picker-r945.js` |
| `assets/runtime/session-r919.js` | `assets/runtime/session-r919.js` |
| `assets/runtime/wheels-r924.css` | `assets/runtime/wheels-r924.css` |
| `assets/runtime/wheels-r924.js` | `assets/runtime/wheels-r924.js` |

`GITHUB_DOSYA_LISTESI_r973.txt`, gereken 8 kök + 222 assets dosyasının TAM yol listesidir. Paketteki `integration/`, eski raporlar ve sürüm kılavuzları kaynak/geliştirme arşividir; uygulamayı çalıştırmak için yüklenmeleri gerekmez. En güncel açıklama bu kılavuz ve RAPOR_r973.md’dir.

## r973 açılış ve taşıma düzeltmesi

Eski kayıt, açılış olaylarının boş sayaç yazmasıyla ezilmez. Kullanıcı yeni bir işlem yaparsa gecikmiş restore eski seçimi geri getirmez. Duraklat→Devam yeni başlatma isteği oluşturur; önceki ses temizliği bitmeden başlatmaz. Sistem sağlığına Zikir ilerleme kaydı satırı eklenmiştir. Depolama hatası varsa WARN görünür. Ani telefon kapanmasının kesin nedeni hâlâ belirlenmedi.

## Ses ve manuel dokunuş (r972’den korunur)

Kontroller ve görünüm → Zikir ayarları → Manuel dokunuş altında **Dokunuşta titreşim**, **Dokunuşta tempo vuruşu** ve **Dokununca zikri seslendir** ayrı ayrı açılır/kapanır. Seslendirme varsayılan kapalıdır. Açıkken tek okuyuş tamamlanınca sayaç bir artar; okuyuş bitmeden yeni dokunuş sayılmaz. −1 yalnız düzeltmedir. Mevcut Ses kaynağı seçimi korunur; otomatik/kendi kayıt öncelikli seçeneğinde kendi zikir kaydın, yoksa uygun Arapça veya Türkçe cihaz sesi kullanılır. Otomatik akışta manuel sayım engeli, çift sayım ve ses-sayaç eşleşmesi gerekçesiyle açıklanır.

**Tesbih tık sesi** bölümünde Tok ahşap / taş (varsayılan), Klasik ince tık veya Kendi tık kaydım seçilir. **Tık sesi kaydet** yaklaşık iki saniye mikrofon kaydı alır; içinden kısa vuruş saklanır. Kayıt/Dene için aktif okumayı duraklat. Başka mikrofon kaydı açıkken bu işlem engellenir. Telefonun mikrofon izni gerekir. Kaydı sil yalnız bu tık kaydını kaldırır; zikir kayıtlarını etkilemez. Kişisel kayıt bu ZIP’e dahil değildir, cihazındaki mevcut kayıt yedeğiyle taşınır.

Manuel ses/tık ayarları index.html/nero.html içindedir; r973 komut düzeltmesi assets/runtime/session-r919.js, tanı satırı assets/runtime/health-r940.js içindedir; kaplamalar ayrıca assets/runtime/berhet-controls-r933.css ve berhet-dock-r933.css içindedir. Tam paket yüklemesinde aşağıdaki 230 yolu birlikte koru.

## Önceki sürümün kapanma incelemesi

Raporlardaki iki gözlenmiş yazılım hatası düzeltildi: akordiyon güncelleme panelindeki NotFoundError ve gezinme PNG'lerinin yanlış INVALID_ENTRY sonucu. Kilit ekranındaki sayfa yeniden yüklenmesinin kesin nedeni henüz belirlenmedi; süreç sonlandırmasını cihaz üzerinde yeniden üretmedik. r969 hız ayarı ve r970 tanılama/DOM düzeltmeleri bu tam pakettedir. Ayrıntılar RAPOR_r973.md içinde.

## Yükledikten sonra telefon kontrolü

1. GitHub Pages dağıtımının bitmesini bekle. Okumayı durdur, “Güncellemeyi kontrol et” ile güncelle ve yeniden aç. Uygulama ve SW sürümleri birlikte **r973** görünmeli.
2. Normal Berhetiyye ve 99 Esmâ’da kulakçık kapalıyken tüm alt kontrol bloğu gizlenmeli. Kulakçık açıldığında Önceki/Baştan başla/Sonraki ve Tefekkür/Bitir aynı blokta olmalı.
3. Tefekkür modunda da aynı aç/kapa davranışını ve Hedef/Kalan’ın taşların merkezinde sığmasını kontrol et. Bitir çark üzerinden de erişilebilir olmalı. Kulakçığı açıp Tefekkürden Çık kullanılabilir.
4. Berhetiyye’de Bitir yakut, Tefekküre geç/Çık ametist, Kontroller ve görünüm billur kaplı olmalı. Atlas ve Seyir ortada yan yana durmalı.
5. Tekil zikir ve 28/99 seyirde Başlat→Duraklat→+1→−1→Devam yolunu dene. Manuel seslendirme kapalıyken düzeltmede okuma başlamamalı; çark, hedef/kalan ve devam sayısı uyuşmalı. Aktif okumada ±1 kapalıdır. Sıfırda −1 kapalıdır; duraklatılmış hedef−1’de +1 kapalıdır, son tekrarı Devam ile tamamla.
6. Farklı çarklarda kulakçık ve çark üzerindeki düğmelerin tıklanabildiğini kontrol et. Telefonda yatay/dikey yönde metin taşmamalı.
7. Ses kaynağını Türkçe seçip aktif zikirde Türkçe okuma hızını değiştir: mevcut okuma kesilmemeli, sonraki tekrar yeni hızla okunmalı ve sayaç her tamamlanan okumada yalnız bir ilerlemeli. Aynı değere dokununca duraklama olmamalı. Genel ayardaki hız da aynı tercihi göstermeli. Kendi kaydını çalarken Türkçe hızı değiştirmek kaydın hızını etkilememeli. Duraklatılmış zikir kendiliğinden başlamamalı.
8. Sistem sağlığı → bütünlük testini çalıştır: 30 manifest dosyası MATCH olmalı; beş gezinme PNG'si INVALID_ENTRY olmamalı. Akordiyonu aç/kapa ve Güncellemeyi kontrol et; NotFoundError görünmemeli.
9. Kendi kayıt ve TTS ile kilitte 28/99 seyri dene. Yeniden kapanırsa yeniden açıp Sistem sağlığı → rapor dışa aktar; rapordaki browserLifecycle alanı yeni restart/discard bilgisini içerir. Eski r968 raporu yerine yeni r973 raporunu paylaş. Saklanmış ilerlemenin üzerinde Başlat/Sürdür ile devam et; kayıtları veya tarayıcı verilerini silme.
10. Manuel dokunuş seçeneklerini ayrı ayrı aç/kapa: çarkta sayım ve duraklatılmış ±1 kısa tık/titreşim vermeli; kapalı seçenek sessiz kalmalı. Zikir sesi sıfırsa tempo vuruşu duyulmamalı. Otomatik sayımda engellenen dokunuş sayıyı değiştirmemeli veya geri bildirim vermemeli. Uygulamayı yeniden açınca manuel tercih korunmalı. Titreşim fiziksel cihaz/tarayıcı desteğine bağlıdır.
11. Dokununca zikri seslendir anahtarını aç: kendi kayıt öncelikli modda kayıtlı bir zikirle dokun, okuyuş bitince sayı bir artmalı. Okuyuş sürerken ikinci dokunuş sayı veya ikinci ses üretmemeli. Kaydı olmayan zikri uygun Arapça/Türkçe sesle dene. −1 seslendirme yapmamalı. Anahtarı kapatınca elle sayım hemen ilerlemeli. Başarısız/iptal edilen okuyuş sayılmamalı.
12. Tok ahşap / taş ve klasik tıkı Dene ile karşılaştır. Kendi tık kaydını al, seç, manuel tempo vuruşuyla dene. Yeniden açınca tercih/kayıt kalmalı; kayıt iznini reddetme veya iptal etme eski kaydı bozmamalı. Berhetiyye üst barı ve Araçlar içindeki yeni kayıt/ayar kontrolleri de kaplı olmalı.
13. Tekil zikirde belirgin bir sayıda duraklat (ör. 25), normal yeniden açılış yap: aynı isim/sayı hazırlanmalı ve ses kendiliğinden başlamamalı. Açılış sırasında bilinçli başka isim seçersen eski kayıt sonradan seçimini geri almamalı. 28/99 seyirde panelin saklanmış adımıyla tekil çarkı karıştırmadan ilgili seyri seçip Sürdür ile kontrol et.
14. Ses temizliği bekleyen geçişte Başlat→Duraklat→Devam’ı hızlı dene; eski istek yeni okumayı engellememeli ve iki ses başlamamalı. Bitir’e bastığında bekleyen Devam sonradan başlamamalı. Sistem sağlığı → Zikir ilerleme kaydı hata içermemeli; hata varsa raporu paylaş ve kişisel kayıtlarını silme.
15. Önceki sürüm düzeltmelerini de kontrol et: haftanın herhangi bir virdini günü gelmeden çarkta aç; Formül 4’ü aç/başlat/atla/duraklat/bitir; kilitliyken özel Berhetiyye isimleri terkibe/virdlere eklenememeli, Mezcelin/Bezcelin istisnası kalmalı.

Tarayıcı verilerini veya kendi ses kayıtlarını silme. Bu pakette kişisel kayıtlarının kopyası bulunmaz. İlk kez hiç ziyaret edilmemiş büyük görseller çevrimdışıyken hazır olmayabilir; çevrimdışı sahne hazırlama aracını kullan.

Türkçe hız, sayaç, geometri, ses ve önbellek regresyonları geçti. Gerçek tarayıcı çizimi ve fiziksel Android kabul testi bu ortamda yapılmadı. Bu web/PWA kaynak paketidir; APK/AAB henüz üretilmedi.
