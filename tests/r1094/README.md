# r1094 kaynak matrisi ve eksik kayıt kapsamı

G4, kanonik ZIKIR kataloğunun kayıt envanterini kapsar. Standart katalog 284 okuma / 381 geçerli biçimdir; 99 Esmâ ve 28 Berhetiyye isminin toplam 224 geçerli biçimi bunun içindedir. İki Esmâ’da desteklenmeyen tevhid biçimi eksik kayıt yükümlülüğü oluşturmaz. Favoriler kanonik kaynağı çoğaltmaz. Bağımsız dua okuyucuları, niyet ve tekke kayıtları mevcut yöneticide kalır; bu matris bütün uygulamanın tek kayıt envanteri olarak sunulmaz.

Kişisel eksik filtresi yalnız başarılı ve güncel depo gözleminde bulunmayan tam biçimi içerir. Başka biçim ve biçimsiz eski kayıtlar ayrı bilgi olarak gösterilir; bunlar tam biçimin kapsam sayısını artırmaz. Erişilemeyen veya geçersiz kayıt, bilinen kayıtla çelişen boş sonuç ve zaman aşımı eksik olarak raporlanmaz. Jenerik envanter, kullanım kapalıyken de saklanan gerçek parçaları boyut/tür/SHA ile inceleyebilir. Bu sonuç codec, duyulan kalite veya gerçek mobil çevrimdışı TTS kabulü değildir.

Denetim yazma, indirme, oynatma, mikrofon veya ses sahipliği talebi başlatmaz. Matris kişisel dosyalarda Blob varlığı/tür/boyutunu gözler; ses çözmez. Esmâ etiketleri için global seçili biçim geçici olarak dahi değiştirilmez. Erişim, katalog veya gözlenen kayıt değişimi geç kalan sonucu geçersiz kılar. Kilitli kategoriler görünür sayılara eklenmez. Kamuya açık bir okumanın kilitli ortak kayıt anahtarı varsa, satır kaynak denetlenemedi olarak kalır; kayıt hedefi açılmaz.

Eksik hedeften Kayıt Stüdyosu’na geçiş salt hedef hazırlığıdır. Mevcut analiz/düzenleme/kayıt sürerken yeni hedef alınmaz. Hedef açmak mikrofonu açmaz; kullanıcı ayrıca kayıt düğmesine basar. Kayıt için mevcut sahiplik/izin/yazma akışı korunur; yeni hedefte arada ortaya çıkan kayıt mikrofon öncesinde tekrar denetlenir.

## Test ayrımı

- `source-matrix.cjs`: üretim backend ve bağımsız doğrulama sınırlarıyla kontrollü kaynak sözleşmeleri.
- `matrix-races.cjs`: gerçek üretim modülünde gecikme, erişim ve kayıt değişimi gibi saldırgan zamanlama girdileri.
- `studio-owner-admission.cjs`: gerçek sahiplik modülü, üretim `busy`/`paused` bağlaması ve stüdyo rezervasyonu; yalnız aynı geçerli hazırlık isteğinin kendi engeline takılmadan kabul edilmesi, diğer ses/kayıt engelleri ve iptaller.
- `matrix-browser.js`: üretim HTML’i, gerçek Chromium/IndexedDB ve özgün arşiv parçalarıyla tam uygulama kabulü. Hata veya cihaz girdisi enjekte edilirse raporda açıkça belirtilir.
- UI için küçük HTML/taklit backend koşuları kullanılırsa tam uygulama toplamına eklenmez; kendi modül byte/hash kanıtlarıyla ayrıca sayılır.

```sh
node tests/r1094/source-matrix.cjs .
node tests/r1094/matrix-races.cjs .
node tests/r1094/matrix-browser.js . /absolute/qa/r1094/matrix/native.json
```

Nihai sonuçlar, bütünleşmiş HTML/SRI/worker/envanter sonlandırıldıktan sonra dondurulmuş kaynaklarla alınır. Süreç çıkışı, test ve kaynak hash’leri, sunulan dosya byte kanıtları birlikte tutulur. [Doğrulama kaydı](verification.json) yalnız tamamlanan kabul koşularını sayar; önceki veya başarısız adaylar kabul toplamına dahil edilmez.

Fiziksel Android, ekran kilidi, mikrofon kalitesi, Bluetooth/arama ve gerçek cihaz kotası ayrıca kabul gerektirir.
