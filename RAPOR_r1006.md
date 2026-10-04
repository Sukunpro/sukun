# SÜKÛN r1006

r1005 derin denetiminde yeniden üretilen 13 açık bulgu için düzeltmeler eklendi. Bu paket yayınlanmadı; gerçek kullanıcı kayıtlarıyla işlem yapılmadı. Bütün 245 asset korunur.

## Doğrulama

- 85 regresyon grubu PASS; 3 tarihî grup NOT_RUN. r999/r1001/r1003 özgün örnekleri bulunmadı; güncel dosyalar eski sürüm yerine kullanılmadı.
- 14 önceki kabul grubu ve 109 yeni/bağımsız senaryo PASS. Kapsam: 23 depolama, 49 sayaç/ses, 11 niyet, 8 çevrimdışı, 5 arayüz, 9 bağımsız depolama, 4 bağımsız native sayaç modeli.
- 272 JavaScript betik/dosyası sözdizimi, 44 runtime hash/SRI, index/nero eşliği ve build/SW/manifest eşliği PASS. Önceki 206 runtime dışı asset birebir korunur; runtime dosyaları işlevsel düzeltmelerle güncellendi.
- ZIP içinden çıkarılan aynı uygulama dosyalarında yeniden kontrol: **PASS**. Kanıt tests_r1006/zip_recheck.json içindedir; yalnız rapor/test kanıtı güncellenerek son arşiv oluşturulur, 255 yayın dosyasının baytları sabit tutulur.
- Testler gerçek üretim işlevlerini çalıştırır; DOM, ses, IndexedDB, ağ ve saat adaptörleri sentetiktir. Native tarayıcı görüntüsü/IndexedDB kota davranışı, fiziksel Android/iOS ekran kilidi, duyulan eko/8D ve işletim sistemi süreç kapatma davranışı NOT_RUN. Tarayıcı executable bu ortamda bulunamadı.

## Davranış ve sınırlar

Sesli otomatik sayaç başarılı ses bitişinde ilerler. Manuel dokunma ve sesli zikrin susarak çarkın devam ettiği Birlikte modu kendi mevcut anlık sayım sözleşmesini kullanır. Birlikte modu ayrı zikir sesi başlatmaz.

Tam yedek sayı/boyut sınırını aşarsa indirme başlamadan açıkça reddedilir. Ayarlar ayrı indirilebilir; sesler kendi boyut sınırları içinde parçalara ayrılır. Tek başına bu sınırı aşan kayıt yine reddedilir. Bütün parçaları saklamak gerekir; eski arşivlere modern set bütünlüğü garantisi verilmez.

Ses geri yükleme **parça başına atomiktir**; birden fazla dosya yüklenmişse daha önce tamamlanan parçalar sonraki parça hatasında silinmez. Eksik yeni set yüklenirken başka set/eski ses içe aktarması engellenir. Takip sıfırlama düğmesi yalnız set takip bilgisini temizler, kayıtları silmez. Depolama takibi kalıcılaştırılamazsa tam başarı mesajı gösterilmez.

ZIP boyutu veya statik dosya ayıklaması telefon RAM kullanımının kanıtı değildir. Bu sürüm fiziksel RAM tasarrufu iddiası taşımaz; çevrimdışı indirme testinde iki turda 242 takılan istek iptal edilip eşzamanlı açık istek sayısı en fazla 2 kaldı.

## Düzeltmeler

| Bulgu | Öncelik | Değişiklik |
| --- | --- | --- |
| ST-NEW-01 | P1 | Bütün girdiler yazmadan önce sıkı base64, MIME ve pozitif çözümlenmiş bayt kontrolünden geçer; boş/padding-only içerik kaydı değiştirmez. |
| ST-NEW-02 | P2 | Bir ses parçası tek atomik REC_DB transaction ile yazılır; kota, abort veya sahiplik kaybında parça bütünü geri alınır. Hata başarı olarak bildirilmez. |
| ST-NEW-03 | P2 | Sürüm 2 ses yedekleri set kimliği, parça/hash manifesti ve kalıcı eksik parça takibi taşır; tamamlanma önceki parçaların mevcut baytlarını yeniden doğrular. Eski setler doğrulanmamış olarak belirtilir. |
| ST-06-RESIDUAL | P1 | Tam dışa aktarma ortak sayı ve boyut sınırlarını base64/indirmeden önce denetler. Büyük tam arşiv güvenle reddedilir; ayarlar-only ve parçalı ses seçenekleri sunulur. Tam arşiv yeni bir multipart biçimine çevrilmedi. |
| SW-NEW-01 | P2 | Başlık ve gövde ortak süre sınırında tüketilir; AbortController ve reader iptali slotu serbest bırakır. Geç yanıt önbelleğe yazılamaz. |
| SW-NEW-02 | P3 | Zorunlu PNG adresleri optional art dalından önce hash doğrulamasına gider; CSS component sürümü canonical release dosyasına eşlenir. |
| A-NEW-01 | P1 | Sesli otomatik tekrar tamamlanma tokenı doğrulanmadan Z/count/total veya kalıcı journal değiştirilmez; çift/eski/iptal/sahipliksiz callback kredi alamaz. |
| A-NEW-02 | P2 | Günlük/isim/haftalık vird muhasebesi yalnız kesinleşen krediye bağlandı; yarım son tekrar tamamlandı işareti üretmez. |
| A-NEW-03 | P2 | Görünür ve native 28/99 yolları ortak günlük/isim/vird muhasebesini tamamlama ve isim geçişinden önce çağırır; duplicate native olaylar kredi tekrarlamaz. |
| A-NEW-04 | P2 | Niyet resolverı her devir tercihini kendi girişinde denetler; tercih kapalıyken ikinci devirde yeniden okumaz, yeni isimde niyet okunur. |
| UI-03 | P2 | Temel shell/araçlar ve dinamik ARIA şablonları İngilizce sözlüğe eklendi; özel isimler ve kullanıcının yazdığı içerik korunur. |
| UI-NEW-01 | P2 | Yardım, kayıt ve arama ortak modal otoritesi kullanır; yalnız üst pencere etkindir. Arama sonuç seçimi alt pencereleri kapatıp gerçek hedefe geçer. |
| UI-NEW-02 | P3 | Tekrarlanan Ctrl/Meta+K gerçek açıcıyı değiştirmez; X/Escape/dış alan üst pencereyi kapatıp odağı geri verir; Tab tek otoriteye bağlıdır. |

## Test uyarlamaları

Eski testler yeni ortak yedek doğrulayıcılarını ve atomik kayıt deposunu yükleyecek şekilde güncellendi. Terkip dönüşündeki bekleyen sesin sayılması beklentisi tamamlanmış sese taşındı. Yeni yedek kontrolleri ve açık sahiplik kontrolü dışında tarihî okuma içeriği korunur. Yalnız değişen sözleşme beklentileri güncellendi; ayrıntılar tests_r1006/baseline_adaptations.json içindedir.

## Paketi kontrol etme

```bash
python3 integration/r1005/run_regressions.py
python3 tests_r1005/run_acceptance.py
python3 tests_r1006/run_targeted.py
```

Yayın dosyaları GITHUB_DOSYA_LISTESI_r1006.txt içinde listelenir. Test klasörleri yayın için gerekli değildir. SHA256SUMS_r1006.txt bütün paket dosyalarını kapsar.
