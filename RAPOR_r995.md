# SÜKÛN r995

r994 tam paketine güncellemede sonsuz doğrulama beklemesini engelleyen düzeltmeler uygulandı. Canlı siteye yayın yapılmadı. Kullanıcının ekranı Uygulama r993 / SW r993 ve devre dışı güncelleme düğmesini gösteriyor; o telefondaki kesin bekleme nedeni ve konsol hatası bu ortamda ölçülmedi.

## Bulgular

Önceki güncelleme yöneticisi doğrulama durumuna girdikten sonra oturum kaydını ve veri hazırlığı geçişini süre sınırı olmadan bekliyordu. Bu adımlar aktivasyonun try/catch kapsamının dışındaydı. Veri hazırlığındaki IndexedDB taraması bitmezse sayfa sonsuza kadar doğrulama durumunda kalabiliyordu. r994 üretim kodunda bitmeyen veri hazırlığı vaadiyle aynı durum deterministik testte yeniden üretildi. Bu, ekran görüntüsündeki cihazda kesin teşhis anlamına gelmez.

SW STATUS mesajında önbellek/hash işlemi hata verirse her hata yolu yanıt göndermiyordu. CACHE_REFRESH doğrulama sonucunu göndermeden önce bildirim yayınının bitmesini bekliyordu. SKIP_WAITING başarı mesajı skipWaiting sonucu beklenmeden gönderiliyordu. Bu yollar sağlamlaştırıldı.

## Değişiklikler

- Kontrol, indirme, doğrulama, kayıt hazırlığı ve etkinleştirme ayrı görünür aşamalardır. Yeni SW dosya hazırlığında tamamlanan dosya sayısını bildirir. Eski SW bu bildirimi göndermezse faz açıklaması gösterilir.
- STATUS için sayfada 15 sn, SW tarafında 12 sn sınırı vardır. SW tüm dosya hazırlığında 60 sn üst sınır; sayfa CACHE_REFRESH yanıtında 65 sn sınır kullanır. Doğrulama ekranı 75 sn üst sınırla kilitli kalamaz. Başarısız bir indirme yeniden denenebilir; eksik sürüm etkinleştirilmez.
- Oturum kaydı 8 sn, kayıt hazırlığı 12 sn içinde tamamlanmalı. Reddedilen kayıt işlemi, bellek tanılama hatası veya veri hazırlığı fatal hatası sessizce geçilmez. Hata halinde etkinleştirme yapılmaz. Uygulamanın kayıtları/IndexedDB/localStorage verileri silinmez.
- IndexedDB envanter taramasında 10 sn sınırı, transaction onabort/cursor hata ve senkron hata işleyicileri eklendi. Bağlantı kapanır; yalnız readonly işlem iptal edilir. Geç gelen açılış/upgrade yanıtları yeni tarama veya şema oluşturma başlatamaz. Mevcut ilk açılış şeması korunur. Envanter taraması tamamlanamazsa uyarı kaydedilir; kişisel kayıtların kendisi değiştirilmez.
- Her aktivasyon denemesinin kimliği vardır. Beklemeyi iptal etme veya süre aşımı sonrası geç gelen yanıtlar aktivasyon yapamaz. Eşzamanlı tıklamalar tek aktivasyon ve tek yenileme kullanır.
- Telefon kilidinde JavaScript zamanlayıcıları durmuş olsa bile dönüşte gerçek saat kontrol edilir. Süresi geçmiş bekleme hata durumuna geçer. İlerleme bildirimleri bu süreyi sürekli uzatmaz.
- Güncelleme düğmesi hata sonrası Yeniden dene olur. Beklemeyi iptal et, kontrol/indirme/doğrulama/kayıt hazırlığında erişilebilirdir; SW etkinleştirildikten sonra geri alma vaadinde bulunmaz. İptal yalnız kullanıcı arayüzünün bekleme ve uygulama isteğini durdurur; tarayıcının devam eden SW kurulumu ayrıca iptal edilmez. Dosyalar hazır olursa kullanıcı daha sonra yeniden geçebilir.
- STATUS/CACHE_REFRESH hata yanıtları sınırlı sürede gönderilir. CACHE_REFRESH doğrulama yanıtını durum bildiriminin önüne alır. SKIP_WAITING başarı yanıtı gerçek çağrı başarılı olduktan sonra gönderilir; eksik dosyalarla etkinleştirilmez. Başarısız kurulumun hata bildirimi de süre sınırına sahiptir.
- Zikir/ses/Tekke oturumu oynuyor veya duraklatılmışsa otomatik yenileme yapılmaz. Kullanıcının onayladığı güncelleme oturumun bitişini bekler. Kayıt hazırlığından sonra bu durum tekrar kontrol edilir.
- İptal kontrolü Berhetiyye görünümünde aynı altın çerçeve ve turuncu topazı kullanır; gizliyken önemli display kuralıyla kapalı kalır. Yeni mesajlar Türkçe/İngilizce çeviri yolunu kullanır.

r994 Tekke görünür ekran yüksekliği, Mihrap ve alt oynatma kontrolleri korunur. Ses/kayıt işleme motorlarının asset dosyaları, çarklar ve tefekkür seti ilerleme kodları byte olarak değişmedi. Inline veri hazırlığının yalnız IndexedDB envanter taraması sağlamlaştırıldı. Tek değişen asset dosyaları berhet-controls-r933.css (iptal kontrolünün malzemesi) ve offline-scenes-r962.js (r995 query kimliği). Min tempo 0,6 sn, ilk kullanım 1 sn; kullanıcının geçerli tempo seçimi değişmez. Kendi kayıt önceliği ve eksik adımda TTS korunur.

## Doğrulama

72/72 otomatik kontrol grubu geçti. Yeni 17 yönetici senaryosu önceki bekleme hatasının tekrarı, süre aşımı, kayıt hatası, geç yanıt/iptal, kilit dönüşü, oturumun başlaması, tekrarlı tıklama ve yeniden denemeyi sınar. Yeni 9 gerçek sw.js mesaj/kurulum senaryosu önbellek beklemesi, hash hatası, hazırlık süre sınırı, geç yazmanın engellenmesi, bildirim sırası ve gerçek aktivasyon hatasını sınar. Yeni 10 IndexedDB senaryosu normal anahtar sayımı, eksik iptal işleyicisi, zaman aşımı, geç açılış/upgrade, blocked, cursor/senkron hata ve versionchange temizliğini sınar. Yeni 10 DOM/stil senaryosu faz açıklamaları, ilerleme, hata ayrıntıları, retry/cancel işleyicileri, çeviri, idempotent yerleşim, 44px hedef ve tema kapsamını sınar.

272 JS blok/dosyası parse edildi. 44 zorunlu runtime SHA-256 ve HTML SRI, r995 uygulama/SW/manifest kimliği, geçmiş 8 çark hash/alpha bilgisi doğrulandı. ZIP CRC, tekil yollar ve gereken uygulama dosyalarının byte eşliği doğrulanır.

Bu testler kontrollü saat, DOM, medya/TTS, mikrofon, mesaj ve önbellek modelleridir. Fiziksel Android/Xiaomi, gerçek kilit ekranı ve canlı tarayıcı rendering bu ortamda doğrulanmadı. DOGRULAMA_r995.json bunları NOT_RUN gösterir. Telefonda yeni sürüm yüklendikten sonra çevrimiçi/çevrimdışı güncelleme, kilit dönüşü, retry/cancel ve kayıt korunması ayrıca sınanmalı. Önceki sürüm raporları arşivdir; bu dosya güncel rapordur.
