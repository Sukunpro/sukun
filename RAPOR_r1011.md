# SÜKÛN r1011

r1010 üzerinden eksik kendi seslerini mevcut kayıtları ezmeden geri yükleme ve kaydırma/dokunma çakışmalarına yönelik düzeltme.

## Kayıt geri yükleme

Araçlar → Kayıtlarım & Yedekleme → **Eski yedekten eksik sesleri tamamla** kontrolü eklendi. r1003/r1004 ses yedeği (`uygulama`, `kayitlar`), tam uygulama yedeğinin ses bölümü (`app`, `idb.sukunRec`) ve manifesti doğrulanan parçalı ses yedekleri desteklenir. Her seçilen dosya yazmadan önce kontrol edilir. Aynı anahtardaki mevcut kayıt, boş veya geçersiz olsa bile bu ekleme işlemiyle değiştirilmez.

Eksik sesler tek IndexedDB yazma işleminde eklenir. İşlem tamamlanmadan hata veya iptal olursa bu işlemin eklemeleri geri alınır. Başka sekmede mevcut olan kayıtlar korunur; ses önbelleği ve kaynak sürümü yalnız tamamlanan eklemeler için yenilenir. Sonraki arayüz adımı başarısız olursa eklenen kayıt sayısı açıkça bildirilir. Ayarlar ve sayaçlar bu seçenekle geri yüklenmez.

Birden fazla yedekte aynı anahtarda farklı ses varsa ve cihazda karşılığı yoksa belirsiz sürüm seçilmez: önce güncel yedeği tek başına, sonra eski yedeği yükleme yönlendirmesi gösterilir. Kilitli bölümlerin gizli sesleri mevcut erişim kuralına göre aktarılır. Büyük eski ses yedekleri toplam 300 MB sınırı içinde desteklenir; yeni parçalı yedeklerde 64 MB parça sınırı korunur.

Kayıt denetiminde 64 MB yedek sınırını aşmak veya MIME bilgisinin boş olması tek başına bozuk kayıt sayılmaz. Onarım, eski tarama listesini doğrudan silmez: yeniden tarar ve silme işlemi içinde güncel değeri kontrol eder. Sonradan yenilenen geçerli ses korunur. Tüm verileri silen düğmenin adı **Tüm uygulama verilerini sil — ses kayıtları dahil** olarak düzeltildi; iki onay adımı korunur.

## Kaydırma ve dokunma

Feyz/Klasik dahil ortak etkileşim yollarında, parmağın hareket edip başlangıç noktasına dönmesi gerçek dokunuş sayılmaz. Tefekkür geçişi native click ile bir kez çalışır; kaydırma, iptal, uzun basma ve çok parmak hareketi sonrasındaki geç tıklama geçiş yapmaz. Manuel çark hareketi hedef dışına çıktığında, sayfa/iç panel kaydığında veya dokunuş iptal edildiğinde sayı eklemez. Klavye kontrolleri ve oynatıcının özel sürükleme tutacağı korunur.

Seyir açılışı, Tefekkür çıkışını gösterme ve oynatıcı içeriğini üstüne getirme işlemleri aynı gezinme niyetini bekleyen işler boyunca taşır. Yeni kullanıcı girdisi veya kaydırma olursa eski konum düzeltmesi çalışmaz. Programlı ekran kaydırması, parmakla devam eden kaydırmanın önüne geçmez. Birden fazla parmağın aynı olayda bırakılması ve odak/ekran kaybı giriş kilidini bırakır.

## Doğrulama

- 417 davranış senaryosu geçti; r1010'un önceki 313 senaryosu korundu.
- 149 sürüm, dosya, SHA-256, SRI ve varlık kontrolü geçti.
- 272 etkin ve yerel JavaScript gövdesi derlendi; 44 çalışma zamanı dosyası doğrulandı.
- 255 yayın dosyası aynı yollarla listelendi.

Testler gerçek uygulama işlevlerini kontrollü DOM, IndexedDB, ses, olay ve saat uçlarıyla çalıştırır. Bağımsız incelemede atomik geri yükleme, eski kayıt anahtarının otomatik kendi ses kaynağına dönüşmesi ve gecikmiş kaydırmanın yeni kullanıcı girdisiyle iptali ayrıca doğrulandı.

Yerel tarayıcı yürütülebilir dosyası mevcut değildi; tarayıcı indirme girişimi ağdan geçerli paket getirmedi. Bu nedenle yeni sürümün fiziksel Android ses çıkışı, mikrofon izni, ekran kilidi, gerçek dokunmatik kaydırma ataleti veya işlenmiş CSS görünümü ölçülmedi. Feyz/Klasik yaşam döngüsü testleri kontrollü DOM kapsamındadır.

## Kişisel ses yedeklerinin durumu

Erişilen r1003 ve r1004 tam paketlerinde kişisel ses JSON yedeği bulunmadı. r1003 içindeki tek gömülü ses 0,2 saniyelik sessiz oynatıcı kaynağıdır. Kayıt kaybının kullanıcının telefonundaki kök nedeni doğrulanamadı. Normal açılış/güncellemede ses veritabanını otomatik silen bir yol bulunmadı; tüm veri temizleme ve onaylanan kayıt onarımı yolları incelendi.

Bu ortamdan telefondaki sesler geri yüklenmedi. Kullanıcının daha önce yeniden yüklediği eski JSON ve varsa yeni JSON gerekir. Özel sesler yayın paketine gömülmedi. Kullanım adımları **GITHUB_YUKLEME_r1011.md** içindedir.
