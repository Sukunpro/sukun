# SÜKÛN r1007 — kayıtlı ses başlangıcı düzeltmesi

Kullanıcının bildirdiği akış Android / Chrome: DİNLE ile kendi kaydı çalıyor, Zikri başlat ile çalmıyor. “Her tekrarı sesli oku” ayarının durumu bilinmiyor.

Canlı r1006 HTML’i teslim edilen dosyayla birebir aynı. 44 gerekli dosya iki sürüm sorgusu biçimiyle kontrol edildi; 88 yanıtın hash’i ve 39 HTML bütünlük etiketi doğru. Eksik veya karışmış bir r1006 dağıtımı saptanmadı.

## Düzeltilen kaynak hataları

| Akış | Doğrulanan hata | r1007 davranışı |
| --- | --- | --- |
| Başlat → kayıt hazırlığı | Yanıtsız veri okuması veya hazırlık sonsuza kadar bekleyebiliyordu. | Okuma 10 saniye, bütün hazırlık 45 saniye sınırına sahip; hazırlık durumu görünür ve Durdur ile iptal edilebilir. |
| Başlat → yerel ses | Yanıtsız `audio.play()` veya oynatma sırasında gelen hata başlangıcı açık bırakıyordu. | Yerel oynatma başlangıcı 8 saniye ile sınırlı; hata bekleyen işlemi sonlandırır. |
| Durdur → yeniden Başlat | Eski hazırlık/oynatma işi yeni girişim tarafından devralınabiliyordu. | Girişim ve sahiplik kontrolleri eski yanıtın yeni kaynağı durdurmasını, değiştirmesini veya saymasını önler. Niyet beklemesindeki eski devam da reddedilir. |
| Efekt/tempo hazırlanamayan kayıt | Kullanılabilir özgün kayıt otomatik başlangıçta reddediliyordu. | Ekran açıkken özgün kayıt, gerçek okuyuş bitişine bağlı seri ses yolunda oynatılır. `fxReady` sahte biçimde açılmaz. Kilit ekranında hazırlanamayınca açık uyarı verilir. |
| Tek kayıt / niyet sesi | Yanıtsız oynatma ve ilerlemeyen medya bitişi beklemeyi açık bırakabiliyordu. | Başlangıç ve ilerleme denetlenir; uzun ve sağlıklı kayıtlar toplam süre sınırı olmadan çalabilir. Hata, bekleme ve durdurma tamamlanmış okuyuş sayılmaz. |
| Yeni mikrofon kaydı | Yanıtsız izin veya kapanmayan ses hazırlığı ikinci dokunuşu yutuyordu. | Hazırlık görünür; ikinci KAYIT dokunuşu iptal eder, sonraki dokunuş yeni deneme yapar. Geç gelen mikrofon akışı kapatılır. Bu, kullanıcının bildirdiği oynatma şikâyetinden ayrı bir düzeltmedir. |
| Teknik rapor | Ekran yenileme evreleri raporda yoktu; bazı uygulama betikleri atfedilemiyordu. | Faz zamanları, render süresi ve toplam/tutulan betik sayıları indirilen raporda yer alır; bilinmeyen değerler null kalır. |

## Doğrulama

- 131 davranış senaryosu ve 149 sürüm/bütünlük kontrolü geçti; 272 JavaScript kaynağı sözdizimi kontrolünden geçti.
- Gerçek Başlat → hazırlık → kaynak seçimi → ses → sayaç zinciri çalıştırıldı. Doğal bitiş toplam/günlük/isim sayısını bir kez artırıyor; yinelenen bitiş, takılma, bekleyen oynatma ve Durdur ek sayı yazmıyor.
- HTML takma adları aynı; manifest, servis worker, sürüm JSON’ları ve tüm gerekli dosya hash/SRI değerleri r1007 ile uyumlu.
- Mevcut 245 asset korunmuştur. 206 runtime dışı asset byte olarak değişmemiştir.
- Testler gerçek üretim fonksiyonlarını kontrollü DOM, medya, IndexedDB, zamanlayıcı ve performans girdileriyle çalıştırır. Fiziksel Android cihazında duyulabilir ses, mikrofon, işletim sistemi ekran kilidi ve kaydırma doğrulaması yapılmış sayılmaz.

## Açık kalan kaydırma ve takılma konusu

Canlı ayrı Chrome tarayıcısında uzun ekran sunum gecikmeleri ve 120 saniyede 19 uzun işlem (en uzun 138 ms) gözlendi. Denenen sayfa kaydırması ve tefekkürden dönüşte kalıcı scroll kilidi yeniden üretilemedi. Bu tarayıcıdaki gecikmelerin kullanıcının Android cihazındaki neden olduğu sonucuna varılmadı; kaydırma sorunu düzeltilmiş olarak işaretlenmedi.

Kullanıcıya ait kayıtlar bu ayrı tarayıcıda bulunmuyor. DİNLE çalışıp Başlat çalışmamasını açıklayabilecek kaynak hataları testlerle kanıtlandı ve düzeltildi; kullanıcının telefonundaki tek kesin kök neden henüz doğrulanmadı.

Sorun cihazda sürerse, sorunun hemen ardından Ayarlar ve araçlar → Sistem kontrolü → Hızlı kontrol et → Geçmiş ve ileri inceleme → Teknik raporu incele → Teknik rapor indir yolu ile rapor alınmalı. Bu rapor ses kayıtlarını ve yazılan metinleri içermez. Site verilerini veya kayıtları silmek gerekmez.

Bu paket yayına otomatik yüklenmedi. Dağıtım adımları GITHUB_YUKLEME_r1007.md dosyasındadır. QA tekrar komutu: `python tests_r1007/run_checks.py`.
