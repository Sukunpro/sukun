# SÜKÛN r997

r996 tam paketine Tekke yardım, nefes merkezi ve dokunma/kaydırma düzeltmeleri uygulandı. Canlı siteye yayın yapılmadı.

## Bulunan nedenler ve düzeltmeler

- Yardım perdesi z-index 70 iken yeni durum rozeti 92, üst bar 95, alt kontroller 90 değerindeydi. Bu nedenle açıklamalar bu katmanların altında kalıyordu. Yardım artık tüm Tekke sahnesini örten opak, tek pencere olarak açılır. Kapat düğmesi üstte kalır; uzun açıklamalar kendi alanında doğal kaydırılır. Set kartı, rozet, sahne ve transport yardım açıkken hem çizim hem dokunma/klavye erişimi bakımından devre dışıdır. Kapatmak mevcut ses akışını durdurmaz.
- Yardım açılırken eski kod yalnız Mihrap'ın open sınıfını kaldırıyordu; ayarModu sınıfı sahnede kalıp pointer-events:none uygulamaya devam edebiliyordu. Geçiş artık gerçek Mihrap kapatma yolu üzerinden yapılır. Yardım/Mihrap karşılıklı geçişlerinde tek pencere sahibi kalır. Önceden var olan inert ve aria-hidden değerleri saklanıp tam geri yüklenir. Tekke'den ana sayfaya dönüş de bu kilitleri temizler ve ana sayfa kaydırmasını serbest bırakır. Ses devam eder.
- Yardım üstüne erişilebilir Kapat eklendi; alttaki mevcut kapatma düğmesi korunur. Escape yalnız açık pencereyi kapatır, Tab odağı pencerede kalır, kapanışta çağıran denetime geri döner. Yardım Türkçe/İngilizce düğme açıklamasını destekler.
- SVG nefes halkası boyutu açıkça tanımlı değildi; küçülen Hû kutusundan bağımsız varsayılan SVG boyutları kullanılabiliyordu. SVG ve metin sarıcısı artık aynı kareyi tamamen kaplar ve aynı merkez etrafında ölçeklenir. Arapça Hû RTL şekillenmesini korur, satır kırılmaz, tek satırlı yazının boyutu kareyle orantılıdır. Mevcut Hû dalga filtresi ve nefes animasyonu korunur.
- Eski merkez, set kartına ek olarak sahnenin yüzde 100 yüksekliğini istiyordu. Sahne artık normal esnek akışta kartın alanını ayırır; Hû boyutu kullanılabilir genişlik/yükseklik, kart, açıklama ve sayaç yükseklikleriyle ölçülür. Pencere, araç çubuğu, döndürme ve içerik değişimlerinde yeniden sığdırılır. Uzun adım/metin için sahne kaydırılır; ses ve sayaç motoruna boyut ölçümü karışmaz. ResizeObserver olmayan cihazlar mevcut resize/render yolu ile desteklenir.
- Manuel nefes dokunuşu yalnız Hû alanından başlar. Düğme, form, set kartı veya diğer alanlardaki dokunuşlar nefesi tetiklemez. Dikey hareket eşiği, pointercancel, kaydırma, pencere odağı kaybı ve dışarıda bırakma bekleyen dokunuşu iptal eder; yanlış VER/sayaç artışı üretmez. Global touchmove engellemesi, sentetik tıklama veya yeni sürükleme motoru eklenmedi.

Kayıt önceliği, eksik adımda TTS, r996 ses başlatma/tekrar deneme ve sekmeler arası sahiplik, r995 güncelleme süre sınırı/iptal/yeniden deneme, minimum 0,6 sn / ilk kullanım 1 sn ve kullanıcının geçerli tempo seçimi korunur. Kayıt arşivi, IndexedDB şeması, tema görselleri ve onaylı çark resimleri değişmedi. Değişen assetler Tekke UX JS/CSS ve offline-scenes sürüm sorgusudur. Native Tekke yardım/Mihrap/çıkış ve manuel dokunuş yollarına gerekli düzeltmeler eklendi.

## Doğrulama

75/75 otomatik test grubu geçti. Önceki 73 grubun ses, set, sahiplik, güncelleme, erişim, tema ve diğer regresyon kapsamı korundu. İki yeni grup: gerçek üretim yardım/Mihrap/manuel nefes fonksiyonları ve kaynak şablondan DOM ile 26 senaryo; gerçek önceki/son CSS kaskadı ve SVG geometri sözleşmeleri ile 42 kontrol. Önceki panelin kapanmasına rağmen ayarModu kilidinin kalması ve yardımın rozet/transport altında kalması yeniden üretildi. Set/sessiz/zikir yardımı, tekrarlı render, karşılıklı pencere geçişi, mevcut inert/aria durumunun korunması, kapatma ve klavye odağı, ana sayfaya dönüş, daralan sahne ve kaydırma/iptal senaryoları kontrol edildi.

272 JS blok/dosyası parse edildi. 44 zorunlu runtime hash/SRI, index/nero eşliği, uygulama/SW/manifest kimliği ve 8 onaylı çark hash/alpha bilgisi geçti. Tam ZIP CRC, tekil yollar, eksiksiz asset listesi ve gerekli 253 uygulama dosyasının byte eşliği doğrulanır.

Testlerde uygulama kaynak kodu gerçektir; DOM, boyutlar, IndexedDB/sekme sahipliği ve medya çıkışı modellenmiştir. Bu rapor gerçek tarayıcı çiziminin veya telefon dokunmasının ölçümü değildir. Fiziksel Android/Xiaomi, kilit dönüşü, duyulan ses, gerçek font çizimi ve tarayıcı görüntüsü NOT_RUN durumundadır. Telefonda aşağıdaki kontrol listesi uygulanmalıdır. Önceki sürüm raporları arşivdir; güncel rapor bu dosyadır.
