# r967 değişiklik ve doğrulama raporu

Kontroller tüm tekil zikir kategorileri için ortak çark arayüzünde toplandı. Önceki/Baştan başla/Sonraki ve Tefekkür/Bitir, ek ayarların dışında çarkın altında. Berhetiyye de aynı düzeni kullanır. Eski gezinme düğmeleri ek araçlar açıldığında ikinci kontrol grubu oluşturmaz.

Terkip kategorisi yeni arayüz ve mevcut doğrudan ses/sayaç sahibine bağlandı. Kategori/isim/terkip seçimi eski otomatik sayımı ve bekleyen başlatmayı iptal eder. Açılış ekranı tek sahibin zamanlayıcısıyla yönetilir; atla/iptal/değiştirme yolları eski devam işlevini tekrar çalıştırmaz. Ses promise'i bulunmayan tur artık 70 ms hızında yeniden saymak yerine seçilen tempoya uyar.

Haftalık yedi virdin her biri “Çarkta aç” ile gününden bağımsız yüklenir. Mevcut okuma durur; seçim kendiliğinden başlamaz. Hedef korunur. Hedef ikonunun içindeki simgeye dokunmak da çalışır.

Vird okumalarında eski poll zamanlayıcıları durdurulur; yeni seansı/başka adımı ilerletemez. Başlama başarısızlığında adım atlanmaz, Oku ile yeniden denenir. Yeniden sıralama/silme/kapama devam eden virdi durdurur; başlatma önceki sesin temizlenmesini bekler. Tertip/vird listesi, ekleme ve saklanmış akışların başlatma/oynatma yolları şifreyi kontrol eder. Kilitliyken yalnız Mezcelin ve Bezcelin istisnadır; tam 28 isimlik bölüm/seyir kilitli kalır.

Eski eksik görsel bağlantılarından 30'u mevcut paket görsellerine bağlandı. Kaybolmuş simge/dekoratif SVG kaynakları için sekiz hafif vektör tamamlandı. Bunlar eski kaynak görsellerin birebir kopyası olarak sunulmaz; mevcut dosyalar ve temayla uyumlu sade simgeler kullanılır.

## Kanıt

- integration/r967/evidence/flow_results.json: 14 üretim fonksiyonu akış testi PASS.
- DOGRULAMA_r967.json: 260 JS kaynak sözdizimi, HTML eşitliği, 30 çalışma dosyası hash/SRI PASS.
- integration/r967/evidence/navigation_results.json: 20 çark × 6 boyut = 120 geometri durumu PASS.
- integration/r967/evidence/audio_unit_results.json: mevcut ses yönlendirme/DSP/iptal testleri PASS; uzun stereo bellek sınırı doğrulandı.
- integration/r967/evidence/sw_unit_results.json: kurulum, çevrimdışı shell, hasarlı dosya reddi ve yeniden hash doğrulama PASS.
- integration/r967/evidence/asset_references.json: düzeltilen eski yollar ve vektörler.

## Sınır

Üretim fonksiyonları modellenmiş DOM, saat ve medya nesneleriyle çalıştırıldı. Gerçek tarayıcı çizimi ve fiziksel Android testi yapılmadı. Kullanıcının Formül 4 ekranında yaşadığı donmanın aynı cihazda tekrarı ve düzelme teyidi hâlâ gereken kabul testidir. Bulunan kod hataları düzeltilmiştir; cihazda duyulan sesi veya donmanın tamamen giderildiğini doğruladığımız iddia edilmez. APK/AAB ve canlı yayın üretilmedi.
