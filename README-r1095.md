# r1095 — Çevrimdışı görseller ve Kaynaklar

G5, uygulamanın güncel kanonik sahne ve çarkları için **Telefon** ve **Tüm
görseller** paketlerini seçilebilir hale getirir. Telefon paketi uygulamanın
kullandığı dosyaları gerçek çözünürlükleriyle korur; yeni bir sıkıştırma veya
kalite düşürme işlemi yapmaz. Tüm görseller bunlara büyük özgün sahne yedeklerini
ekler. Paket seçimi mevcut sahneyi, çarkı veya görsel kalitesini değiştirmez.
Seçicideki kısa **Tümü / All** etiketi, yalnız bu görünümde erişilebilir sahne /
çark görselleri ile özgün yedeklerini ifade eder; sesler ve uygulama dosyaları
ayrı hazırlanır.

Bu belge kapsam ve kabul sınırlarını açıklar. Tamamlanan nihai koşuların
kanıtı [tests/r1095/verification.json](tests/r1095/verification.json) dosyasıdır;
burada yazan planlanan toplamlar tek başına geçmiş kabul sonucu değildir.

## Kapsam ve gerçek boyutlar

`assets/runtime/image-pack-manifest-r1095.json`, her özgün dosyanın URL, bayt,
SHA-256, paket ve erişim bilgisini taşır. Aşağıdaki değerler manifestteki gerçek
dosyalardan hesaplanır; ZIP boyutu, tarayıcının tahmini kotası veya her seferinde
indirilecek yeni bayt miktarı değildir.

| Erişim | Paket | Toplam dosya | Toplam bayt | Yalnız isteğe bağlı görsel önbelleği |
| --- | --- | ---: | ---: | --- |
| Tam erişim | Telefon | 130 | 54.207.708 | 125 dosya / 48.274.676 bayt |
| Tam erişim | Tüm görseller | 164 | 157.661.812 | 159 dosya / 151.728.780 bayt |
| Kilitli görünür kapsam | Telefon | 48 | 31.202.135 | 43 dosya / 25.269.103 bayt |
| Kilitli görünür kapsam | Tüm görseller | 48 | 31.202.135 | 43 dosya / 25.269.103 bayt |

Her toplam, gerekli uygulama önbelleğinde bulunan **5 gezinme görselini /
5.933.032 baytı** içerir. Bunlar isteğe bağlı görsel önbelleğine ikinci kez
yazılmaz. Tam erişimde Tüm görseller, Telefon kapsamına 34 özgün yedek /
103.454.104 bayt ekler. Kilitli görünümde özel aileler ve sayıları kullanıcı
arayüzüne açılmaz; iki paket aynı kamusal kapsamı paylaşır. Bu teknik tablodaki
tam erişim değerleri, kilitli kullanıcıya tam paket sayısı gösterme izni değildir.

Eski veya artık seçilmeyen bütün tarihsel görseller bu kataloğa eklenmez.
Kapsam güncel sahne / çark referansları ve bunların gerekli özgün yedekleridir.

## Kullanım ve doğrulanmış durum

1. Telefon veya Tüm görseller seçilir; açılış kendiliğinden tarama ya da paket
   indirmesi başlatmaz.
2. Açık kontrol işlemi, o an erişilebilir paketin gerçek toplamını ve saklanan,
   eksik, bozuk ve denetlenemeyen dosyalarını ayrı inceler.
3. İndirme yalnız güncel kontrolün aynı paket / erişim / istemciye bağlı planını
   kullanır. Yalnız eksik veya bozuk dosyalar indirilir.
4. İptal, kesinti veya yeniden açılış sonrasında kontrol tekrarlanır. Gerçek
   önbellekte doğrulanan dosyalar yeniden indirilmeden devam edilir.

Hazır durumu, dosyaların gerçek uzunluğu ve SHA-256 doğrulamasına bağlıdır.
Okunamayan dosya sıfır, eksik veya hazır sayılmaz. Gerekli uygulama dosyalarında
sorun varsa paket tamam gibi gösterilmez; güncelleme gerekir. Erişim, worker
veya sayfa değişimi eski kontrolü geçersiz kılar. İptal onayı, bekleyen yazma ve
geri alma işlemleri bitince verilir.

Paketler mevcut ortak görsel önbelleğini ve boyut / adet / kota korumalarını
kullanır. Kota, ağ veya yazma hatası eksik sonuç bırakabilir. Görsel paketi
işlemleri kişisel kayıtları, jenerik ses arşivini, ses sahipliğini, sayaçları,
seansları veya görsel tercihlerini değiştirmez. Gerekli uygulama dosyaları ve
ses arşivi ayrı hazırlanır; bu görsel paketi bir kişisel yedek veya tam geri
yükleme değildir.

## Yazılım kabulünün ayrımı

| Kanıt | Kapsam | Bilerek seçilmiş beklenen toplam |
| --- | --- | ---: |
| Önceki tam uygulama koşuları | Seans ön kontrolü, kaynak politikası, çevrimdışı ön kontrol, Klasik/Feyz, G3 arşiv ve G4 matris devamlılığı | 99 |
| `image-pack-browser.js` | Eksiksiz üretim uygulaması, gerçekten kurulu worker, özgün görseller, HTTP ve bağımsız CacheStorage doğrulaması | 18 |
| `sources-browser.js` | Eksiksiz Klasik/Feyz uygulamada mevcut Kaynaklar paneli; olağan kurulum ve etiketlenmiş eksik / geç DOM kurtarması | 8 |
| `image-pack-ui-browser.js` | Küçük HTML içinde özgün UI modülleri / üst stiller; kontrollü facade ve indirme cevapları | 27 — ayrı kontrollü DOM |

İlk üç satır tamamlandığında tam uygulama toplamı **99 + 18 + 8 = 125** olur.
Kontrollü DOM satırındaki 27 kontrol bu 125 sayısına eklenmez. Regresyon grupları,
odaklı worker / facade vakaları, bütünlük kontrolleri ve dağıtım dışa aktarma
sonuçları da kendi birimleriyle ayrı raporlanır. Önceki sürüm raporları veya
dondurma öncesi tanılama koşuları r1095 kabulü olarak kullanılmaz. Kaynaklar
düzeltmesi dahil son üretim dondurmasından sonra bütün koşular yeniden alınır.

Yeni tam uygulama koşusu; gerçek paket baytları, kurulu worker, kilitli kapsam,
eski / başka istemciye ait planlar, eksik ve bozuk dosyadan devam, gerçek HTTP
kesilmesi, iptal, kota / okunamayan önbellek sınırları, çekirdek bozulması,
özel erişim değişimi, istemcinin ayrılması ve gerçek çevrimdışı sahne / çark
çözümlemesini kapsar. Ağ hataları yalnız tam URL, aşama ve gerçek istek kimliği
ile eşleşen açık hata girdilerinde beklenir; bilinmeyen hata kabulü engeller.

Worker'a ait `ERR_ABORTED` gözlemleri ayrıca korunur: yalnız benzersiz native
sunucu cevabının bayt ve özeti, sabitlenmiş metadata / yerel dosya ve güncel
önbellekten bağımsız okunan SHA-256 ile uzunluk birlikte eşleşirse dosyanın
hazırlığına kanıt sayılır. Bu ayrım isteğin başarıyla tamamlandığı veya iptalin
nedeninin belirlendiği anlamına gelmez; sınıflandırılamayan hatalar kabulü engeller.

Ayrılan istemcinin elde tutulan geç cevabı için ayrı kontrol, özgün native
worker okuyucusunun EOF / tam bayt / SHA-256 sonucunu ve iptal edilmemiş
sinyalini doğrular. Aynı istek, benzersiz cevap / sunucu kimliği, tamamlanmış
özgün cevap, biten worker işi ve bağımsız önbelleğe alınmama kanıtı birlikte
gerekir. Böyle dar bir `ERR_ABORTED` gözlemi olursa yalnız özgün cevabın
tüketildiği ve önbelleğe yazılmadığı kanıtlanır; aktarım başarısı veya iptal
nedeni ileri sürülmez. Nihai kabul koşusunda bu özel istek normal tamamlandı;
şartlı iptal dalının o koşuda çalıştığı iddia edilmez.

Arşiv worker devamlılık koşusu, sayfaya ait bir `ERR_ABORTED` gözlemini ancak
dört özgün Temel kaydının adlandırılmış kesinti / devam aşamalarında ayrı
bayt tüketimi kanıtı olarak sınıflandırabilir: aynı native istek ve benzersiz
HTTP cevap kimliği, bitmiş özgün sunucu cevabı, native okuyucunun EOF / tam
bayt / SHA-256 sonucu, iptal edilmemiş sinyal, eşleşen bitmiş worker isteği ve
güncel IndexedDB kaydının bağımsız özeti birlikte gerekir. Tek gözlenmiş
`audio-preparation-r981.js` yolu için ek koşul, aynı etkin ana çerçevede native
derlenmiş kaynak özeti ve güncel çekirdek önbellek baytlarıdır. Kanıtsız sayfa
iptalleri kabulü engeller; bu şartlı ayrım CDP aktarım başarısı veya iptal nedeni
iddiası değildir.

Kota ve okunamayan önbellek vakaları, gerçekten kurulu worker içindeki native
Cache yönteminin tek adlandırılmış URL için geçici hata girdileridir; worker
protokolü, sıralaması, diğer depolama işlemleri ve dosya doğrulaması gerçektir.
Kontrollü UI koşusu ise facade cevaplarını, ilerlemeyi ve politika değişimini
bilerek üretir; gerçek indirme veya önbellek doğrulamasının yerine geçmez.
Yöntemler ve sınırlar [native kabul belgesinde](tests/r1095/IMAGE_PACK_NATIVE_QA_README.md)
ve [kontrollü UI belgesinde](tests/r1095/UI_QA_README.md) ayrıntılıdır.

## Ek düzeltme: Kaynaklar açılır bölümü

Esmâ / Berhetiyye Kaynaklar bölümünün **0 görünüp açılmaması** için mevcut panelin
kurulması ve eksik kaldığında kullanıcı açmadan önce tamamlanması düzeltildi.
Gösterilen **1**, tek Kaynaklar panelidir; içinde daha önce bulunan **dört kaynak
açıklaması** açılır. Dört mevcut metin korunur; yeni dinî bilgi veya kaynak
doğruluğu iddiası eklenmez. Tekrarlanan kurulum aynı paneli, düğümleri ve açık /
kapalı durumunu korur; açma işlemi ses, mikrofon, kayıt, seans veya sayaç işlemi
başlatmaz.

`sources-browser.js` için seçilen 8 tam uygulama grubu; temiz geçici profilde
olağan kurulumu, Esmâ / Berhetiyye ve TR / EN görünümünü, gerçek işaretçi ile
Enter / Space kullanımını, dört açıklamanın görünmesini, yan etki yokluğunu ve
320 / 390 px ile ölçülen %200 metin görünümünü kapsar. Eksik panel / sıfır rozet,
geç DOM bölümü ve ilgisiz eski başlatıcı hatası açıkça etiketlenmiş test girdileridir.
Kullanıcının cihazındaki özgün tetikleyici doğrulanmamıştır; bu girdiler aynı
cihaz nedeninin yeniden üretildiği iddiası değildir. Kaynaklar koşusunda ortak
tarayıcı düzeneği service worker'ı kapatır ve cihaz sesi metadatasını kontrol eder;
gerçek worker kabulü ayrı görsel paket koşusuna aittir. Fiziksel cihaz ve gerçek
kullanıcı profili kabulü ayrıca açık kalır.

Son kaynak, suite ve ortak tarayıcı düzeneği hash'leri koşu öncesi / sonrası
korunur. Yalnız bitmiş süreç ve kaynakla eşleşen sonuçlar sayılır. Chromium
koşuları geçici headless Linux profillerindedir. Fiziksel Android, OS erişilebilirlik
ölçeklemesi / yerel seçim penceresi, ekran kilidi, gerçek mikrofon, Bluetooth,
ses kalitesi, codec veya cihaz TTS'inin çevrimdışı konuşması ayrıca kabul ister.
Ölçülen %200 metin büyütmesi OS erişilebilirlik ayarının kanıtı değildir.

## Kalan geliştirme başlıkları

- **G6 — Sağlık ve yedek kapsamı kartı:** Kendi seslerim, Jenerik arşiv ve
  Kurtarma kopyalarının ayrı gerçek adet / bayt ve yedeğe dahil olma bilgisi;
  tahmini tarayıcı kotasını açıkça ayırma.
- **G7 — Kandil tercihleri:** Kalıcı Kapalı / 1 dk / 5 dk, ilk kullanım turunu
  bölmeme ve görünüm dönüşü uyarılarını açıkça ayırma.
- **G8 — Görsel referans haritası ve ortak çekirdek:** Eski görsel adlarının
  gerçek dosya eşlemesi ve küçük, geri alınabilir ortak CSS / JS taşımaları.

G5 ancak yazılım kabulü ve doğrulanmış yayınla kapalı sayılır. O durumda eşit
ana başlık sayımı **12/15 = %80**, geliştirme planı **5/8 = %62,5** olur;
G6, G7 ve G8 açık kalır. Bu oranlar kalan emek veya fiziksel cihaz kabulü
yüzdesi değildir.
