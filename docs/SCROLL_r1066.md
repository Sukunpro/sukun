# SÜKÛN r1066 — Kaydırma ve tıklama

Klasik/Feyz mobil görünümde sekme ve bölüm tıklamalarının hedefi ekrana getirmesi, doğal dokunma kaydırması ve tempo ayarının dokunma yaşam döngüsü düzeltildi.

## Hataların nedenleri

- Üst sekme şeridindeki seçili düğme için kullanılan `scrollIntoView`, şeridin yatay konumuyla birlikte sayfanın dikey konumunu da değiştirebiliyordu. Sekme paneli ve bölüm hedefi için gecikmiş gezinmeler ise viewport politikasında arka plan kaydırması sayılıp engellenebiliyordu.
- Okuma görünümü açılırken üst bölüm ve seçilen okuma ayrı gezinme istekleri oluşturuyordu. CSS `scroll-behavior:smooth` altında `behavior:'auto'` animasyonu da hedefin yerleşmesiyle yarışıyordu. Eski alt gezinmedeki 60 ms gecikme, araya giren yeni dokunmayı eski isteğin parçası sanabiliyordu.
- Zikir bölümlerinde `content-visibility:auto` ve 260 piksel yer tutucu ölçüsü kullanılıyordu. Gerçek içerik ölçüldüğünde üstteki alanlar küçülüyor, Araçlar başlığı gözlenen senaryoda yaklaşık 547 piksel yukarı kayıyordu.
- Tanılama ikinci kez açıldığında önceki `overflow` yerine kendi `hidden` değeri saklanıyordu. Kapanışta sayfa kilitli kalabiliyordu; ikinci kapanış da başka bir pencerenin kilidini değiştirebiliyordu.
- Tempo ayarındaki yarım kalmış dokunma; odak kaybı, kaydırma veya pointer yakalamasının kaybında temizlenmiyordu. İptal işlemi kabul edilmiş yatay değeri de eski değerine döndürebiliyordu.

## Düzeltmeler

- Üst sekme şeridi seçili düğmeyi kendi yatay kaydırmasıyla gösterir. Gerçek kullanıcı sekme tıklaması ve klavye seçimi, seçilen paneli mevcut viewport politikası üzerinden ekrana getirir.
- Bölüm ve okuma açılışları hedefe ait tek gezinme isteği kullanır. Gezinme `instant` davranışıyla yapılır; hedef kapandığında veya sonraki kullanıcı girdisi geldiğinde eski istek iptal edilir. Etkin dokunma ve doğal kaydırma sırasında yer değiştirme ertelenir. Eski alt gezinmenin kullanıcı bileti 60 ms zamanlayıcısından önce alınır.
- Tefekkür dışındaki `#tab-zkr` altında `.zMegaGroup`, `.r170Hub`, `.card:not(.zCtl)` ve `.sess` gerçek yerleşimleriyle ölçülür. `content-visibility:visible` ve `contain-intrinsic-size:none` yer tutucu kaynaklı sıçramayı önler. Mevcut `hidden`, gizli içerik ve disclosure durumları korunur.
- Tanılama kendi kaydırma kilidini bir kez alır ve bırakır. `overflow`, `overflow-x`, `overflow-y` değerleri ve CSS öncelikleri korunur. Tekrarlı kapanış stil yazmaz; başka bir sahibin değiştirdiği bildirim onun değeriyle kalır.
- Tempo temasının iptal, odak kaybı, kaydırma ve `lostpointercapture` temizliği tamamlandı. Dikey pan ayarı değiştirmez; kabul edilmiş yatay değer korunur. Geç gelen eski native input engellenir. Yeni dokunma, klavye ve açık programatik düzenleme normal çalışır; iptal işlemi ikinci bir kayıt veya ses yeniden başlatması üretmez.

Kişisel kayıt anahtarları, ses sahipleri ve zikir sayım otoritesi korunur. Testler izole Chromium profillerinde native dokunma olaylarıyla yürütülür; fiziksel Android donanım veya hoparlör doğrulaması yapılmadı.

## Güncelleme paketi

Güncelleme paketi r1063, r1064 ve r1065 tabanlarıyla uyumludur. Bu sürümlerden güncel sürüme kadar değişen veya eklenen dosyaların birleşimi, gerekli 80 runtime dosyasının tamamı ve altı gömülü Arapça MP3 bulunur. Böylece yalnızca son sürüm farkına dayanan eski r1063 yama açığı giderilir. Eski `assets` dosyaları silinmez. Kişisel kayıtlar tarayıcı veritabanında kalır; r1063→r1066 gerçek service worker güncellemesi ve iki tarayıcı yeniden başlatmasında sentetik kayıtların tam baytları ve SHA-256 değerleri korundu.

## Testler

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| Gezinme politikası: kullanıcı niyeti, geçersiz kalan hedef ve bekleyen dokunma | 10/10 | [navigation-policy.json](../tests/r1066/evidence/navigation-policy.json) |
| Tanılama kilidi ve tempo yaşam döngüsü; CSS öncelikleri, başka sahibin kilidi ve yanlış pointer | 20/20 | [diagnostics-tempo.json](../tests/r1066/evidence/diagnostics-tempo.json) |
| Tam Klasik/Feyz uygulama; 320×640 ve 390×844 native dokunma/pan, sayaç, okuma, Araçlar, Tefekkür ve Details | 22/22 | [mobile-navigation-final.json](../tests/r1066/evidence/mobile-navigation-final.json) |
| Gerçek uygulamada tekrarlı tanılama aç/kapat, dikey/yatay tempo teması, blur ve ikinci dokunma | 11/11 | [diagnostics-tempo-browser-final.json](../tests/r1066/evidence/diagnostics-tempo-browser-final.json) |
| Kayıt içe aktarımı, hatalı girdi, Finish, sayfa yenileme, r1063→r1066 SW güncellemesi ve iki tarayıcı yeniden başlatması | 24/24 | [persistence-final.json](../tests/r1066/evidence/persistence-final.json) |
| Tam uygulamada Arapça asıl/metin-meal ayrımı, kaynak tercihi, yerel Pause/Resume/Stop, ses hatası ve kayıt bankası izolasyonu | 52/52 | [readings-regression-final.json](../tests/r1066/evidence/readings-regression-final.json) |
| Önceki sürümlerin üretim kaynaklarını kullanan regresyon grupları | 109/109 grup | [regressions-final.json](../tests/r1066/evidence/regressions-final.json) |
| Tam üretim dışa aktarıcısı; tüm yayın baytları ve envanter SHA-256 kontrolü | PASS; 696 dosya | [full-release-export-final.json](../tests/r1066/evidence/full-release-export-final.json) |
| Yayın dosyalarının kimliği, SHA-256/boyutları, HTML SRI ve JavaScript sözdizimi | 1253/1253 | [release-integrity-final.json](../tests/r1066/evidence/release-integrity-final.json) |

Grup sayısı ile grupların içindeki kontrol sayısı ayrı tutulur; örtüşen testler tek bir toplam sayıya eklenmez. 20/20 tanılama/tempo sonucu, geniş regresyon koşusundan sonra eklenen iki sahiplik/pointer kontrolünü de içerir.

Mobil gezinme raporundaki iki profil ve tanılama/tempo tarayıcı raporu, test edilen `nero.html` için aynı SHA-256 değerini doğrular: `2e0762f0d403921c668bc519d0ae7f0167c5a7355b741457769e038952255fce`. Tanılama/tempo tarayıcı koşusunda hiçbir konuşma veya native içerik oynatma başlatılmadı. Kalıcılık koşusu sentetik WAV kullanır ve her aşamada kayıt anahtarını, native Blob baytlarını ve SHA-256 değerini karşılaştırır. Okuma koşusu tam uygulamayı kullanır; cihaz konuşma sesleri, utterance bitişi ve hata olayları kontrollü uçlardır. Arapça/meal metni ile seçili dilin ayrımı ve gerçek native kayıt kaynağının korunması doğrulanır; fiziksel cihaz TTS kalitesi veya işitilebilir ses ölçülmez.

Raporlar [tests/r1066/evidence/README.md](../tests/r1066/evidence/README.md) altında açıklanır. Başarısız veya eski harness raporları bu kanıt setine alınmadı.
