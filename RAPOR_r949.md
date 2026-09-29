# SÜKÛN r949 — ses yaşam döngüsü ve çizim kararlılığı

r948 üzerine hazırlanmış birleştirme güncellemesi. Canlı siteye yüklenmedi. r948 nefs rehberi, soru bankası, puanlama modeli ve arayüzü bayt düzeyinde korundu.

## Kullanıcıya yansıyan değişiklikler

- Kendi kaydınız çalarken ekran görünürlüğü değiştiğinde farklı bir tempo motoruna geçilmez; tek ses kaynağı aynı hız ve döngüyle sürer.
- Başlatma tarayıcı tarafından reddedildiğinde arka planda art arda play çağrısı yapılmaz. Gerçek oynatıcı durmuşsa üst oturum bunu çalıyor diye sunmaz.
- Sistem durdurması ile kullanıcının Duraklat/Bitir tercihi ayrıldı. Duraklatılmış seyir görünür ekrana dönünce kendiliğinden başlamaz; Devam komutu aynı isimden ilerler.
- 28 ve 99 isim seyirlerinde ara/okuma hızı değişikliği kelime sonunda uygulanır. Geçişte sayaç iki kere artırılmaz.
- Tefekkürde Berhetiyye çarkı büyüdü; alttaki kontroller gizlenince ek alanı kullanır. Dikey/yatay üç ekran ölçüsü doğrulandı.
- Sahne seçici yalnızca küçük önizlemeleri yükler. Yönetilen tam sahne sayısı sınırlıdır; gizli ekranda dekoratif hareket durur.
- Sağlık raporu gerçek native oynatıcı durumunu, boot/discard/freeze bilgisini ve sahne/canvas/ses düğümü tahminlerini ayrı gösterir.

## Kontrol listesine yanıt

| İstek | Durum | Kapsam |
|---|---|---|
| 1. PREPARING/PLAYING oturum dalgalanması | IMPLEMENTED | Yerleşmiş ses oturumu her kelimede PREPARING durumuna dönmez; ilk hazırlık ve gerçek kesinti ayrı tutulur. |
| 2. Oturum ile ses çevriminin ayrılması | IMPLEMENTED | SukunVoiceCycle ayrı olay akışı; sayaç ve gerçek oturum değişiklikleri yayımlanmaya devam eder. |
| 3. Sıcak çizim yolunda okuma/yazma fazları | IMPLEMENTED_SCOPED | CIZ tüm ölçüm fazlarını yazımlardan önce çalıştırır. Uygulamadaki her tarihsel callback yeniden yazılmadı; kalan forced-layout örnekleri sıfır değildir. |
| 4. Her karede offsetParent/getComputedStyle kaldırılması | IMPLEMENTED_SCOPED | Ortak çizim zamanlayıcısında kaldırıldı; görünürlük IntersectionObserver, boyutlar değişiklikte ResizeObserver ile izlenir. |
| 5. Görsel animasyonların ortak CIZ motoru | IMPLEMENTED_SCOPED | PART, MUHR, FRM, CYM, HV, SPEC ve atmosfer döngüleri ortak çizime bağlandı. CSS animasyonları ve tek seferlik UI rAF işleri ayrı kalır. |
| 6. Bağımsız sürekli görsel rAF döngülerinin emekliliği | IMPLEMENTED_SCOPED | Taşınan görsel döngüler kendi sürekli rAF işini üretmez; tüm 134 statik rAF ifadesinin kaldırıldığı iddia edilmez. |
| 7. Previous/current/next sahne bütçesi | IMPLEMENTED | Yönetilen motorun yüklenmiş ve bekleyen tam sahneleri birlikte en fazla üç; arka planda bir aktif sahne. |
| 8. Picker küçük önizlemeleri | IMPLEMENTED | 34 sahnenin 200×350 piksel küçük WebP önizlemeleri, sayfa başına dört kart. Tümü tarayıcıda decode edildi; toplam 621180 bayt. |
| 9. Görünmez tam sahne referanslarının bırakılması | IMPLEMENTED_SCOPED | Eski img src ve CSS geçiş görseli bırakılır. Tarayıcının GPU/decoded cache alanını anında boşalttığı garanti edilmez. |
| 10. Gizliyken dekoratif hareketlerin durması | IMPLEMENTED_SCOPED | CIZ görünmezlik/freeze ile iptal edilir; gizli durum testinde bekleyen CIZ karesi ve çalışan CSS animasyonu sıfır. Gerçek OS freeze testi ayrı. |
| 11. Tek native ses sahibi | IMPLEMENTED_SCOPED | Tek kayıt ile 28/99 isim native kayıt yolları ortak lease/play kapısını kullanır; TTS ve ambiyans motorları bunun kapsamı değildir. |
| 12. AbortError sonrası tekrar döngüsünün engellenmesi | IMPLEMENTED | Reddedilen aynı kaynak lease’i hidden durumda bloklu kalır. Yeni kaynak veya görünür dönüş bir toparlanma hakkı verir; kullanıcı Pause/Stop tercihi otomatik toparlanmayı engeller. |
| 13. wasDiscarded, boot-id, beklenmeyen yeniden yükleme | IMPLEMENTED | Tarayıcının discard bilgisi, oturum kimliği, freeze/resume ve kapanmamış aktif checkpoint ayrı kanıtlar. OOM veya kesin crash teşhisi üretilmez. |
| 14. Sahne/canvas/AudioNode ölçümleri | IMPLEMENTED_SCOPED | Yönetilen sahnelerin RGBA tahmini, DOM canvas yüzeyi ve zayıf referanslı AudioNode sarmalayıcı sayımı; toplam GPU/native bellek ya da gerçek bağlantı sayısı değildir. |
| 15. 30–60 dakika soak | PASS_EARLIER_CANDIDATE | Erken r949 adayında 30 dakika gerçek süreli tek kayıt soak geçti. Sonraki seyir/duraklat düzeltmeleri son pakette hedefli regresyonlarla doğrulandı; son paketin aynı hash ile 30 dakika testi ve fiziksel Android deneyi yapılmadı. |
| 16. Açık ve kilitli ekran temposunun aynı olması | IMPLEMENTED_DEVICE_TEST_PENDING | Kendi kayıtlarında görünür/gizli durum aynı native kaynak, playbackRate, döngü ve lease ile devam eder. 28/99 seyirde ayar değişimi kelime sonunda uygulanır. Fiziksel hoparlör/kilit zamanlaması doğrulanmadı. |
| 17. Tefekkür çarkının büyümesi | PASS | Berhetiyye Tefekkür çarkı 390 piksel ekranda 312 piksel, alt kontroller gizliyken 362 piksel. 320 ve 844 piksel görünüm sınırları da kontrol edildi. |

## Doğrulama ve sınırlar

Son uygulama paketi: **4 statik yayımlama kontrolü + 9 gerçek Chromium kurulum/güncelleme/çevrimdışı kontrolü geçti.** 24 runtime dosyasının SHA-256/SRI eşleşmesi doğrulandı. r948’den güncelleme bir kez yeniliyor; tema, localStorage, kayıt ve ambiyans IndexedDB verileri korunuyor. Eksik veya hash’i bozuk aday güncelleme kabul edilmiyor; önceki sürüm çevrimdışı çalışmayı sürdürüyor.

Son ses kontrolleri: tek kayıtta Duraklat/Devam/Bitir; 28 ve 99 isim seyirlerinde kaynak/hız/döngü/lease devamlılığı, isim geçişi, sayım, Duraklat/Devam/Bitir; yapay AbortError sonrası aynı hidden lease üzerinde tekrar engeli, görünür dönüşte bir toparlanma, kullanıcının Pause ve Stop tercihine uyma. Ortak sahiplik için yedi, CIZ için altı, yaşam döngüsü için altı birim senaryosu geçti.

34 küçük sahne dosyası gerçekten decode edildi; yalnız HTTP 200 kontrolü yapılmadı. Hızlı 34 sahne seçiminde yüklenmiş+bekleyen sahneler üçü aşmadı. Gizli durumda bir sahne, sıfır bekleyen CIZ karesi ve sıfır çalışan CSS animasyonu gözlendi.

**30 dakika soak son paketle birebir aynı kod değildir.** Erken r949 adayında 1.812.789 ms gerçek süreli tek kayıt denemesi, 60 örnek, son örnekte 1.339 tekrar, Stop sonrası 1.340, bir native play girişimi ve sıfır JavaScript hatası kaydedildi. İlk 10 dakika görünür, sonraki 10 dakika sentetik gizli, son 10 dakika görünürdü. Sonraki seyir hata toparlama ve açık Pause/Resume değişiklikleri hedefli regresyonlarla doğrulandı; 30 dakika soak son hash üzerinde yeniden çalıştırılmadı.

Geliştirme sırasındaki yaklaşık 25 saniyelik aynı 17 tekrar örneğinde global PREPARING olayı 18’den 2’ye, toplam oturum olayı 41’den 24’e indi. Bu, olay sayısındaki farktır; telefonun yüzde kaç hızlandığını gösteren donanım ölçümü değildir. Sayaç ilerlemesi için gereken PLAYING olayları korunur.

Son HTML SHA-256: `fab53bbef2ad7b90bc2633018b37cde833fe4d8aaf6a9399f47779f8bd2cf11e`

Soak adayı HTML SHA-256: `28aecc98675f7f5afc17b22006fd5505aba9759711eaa9e9fd9baba012dabf73`

- Fiziksel Android kilidi, hoparlörden işitilen gerçek aralık ve işletim sistemi süreç sonlandırması bu ortamda ölçülmedi.
- Tarayıcı testi başsız Chromium, GPU kapalı ve sentetik visibility olayları kullanır. Android CPU/GPU performansı veya OS freeze davranışıyla eşdeğer değildir.
- Sürekli native kayıt döngüsü ekran görünürlüğünde yeniden başlatılmaz; işletim sistemi uygulamayı askıya alırsa sonraki isme JavaScript geçişi yine gecikebilir. Bunu engelleyen garanti yoktur.
- TTS yalnızca tarayıcı konuşma motorudur; ekran kilidinde kesintisiz TTS güvencesi verilmez. Bu sürümün sürekli oynatma doğrulaması kendi kayıt yolundadır.
- Kendi kayıt için etkin çevrim, seçilen tempo ile kayıt süresi/okuma hızı + 40 ms değerinin büyüğüdür. Kayıt kesilerek seçilen sürenin içine sıkıştırılmaz.
- 28/99 seyir okuma hızı 1 ve 1,5; ara değişimi 2 saniye olarak sınandı. UI’daki tüm hız/efekt kombinasyonları kapsanmadı; bazı eski yollardaki 2× hız sınırı bu sürümde değiştirilmedi.
- Sahne bütçesi yalnızca yönetilen sahne motorunu kapsar; diğer çark, ikon, CSS ve tarayıcı önbellek dokuları bu sayıya dahil değildir.
- Kalan tarihsel yerleşim callbacklerinde forced-layout görüldü; bütün donmaların giderildiği veya hiç bellek sızıntısı olmadığı sonucu çıkarılamaz.
- Canlı siteye dağıtım yapılmadı. Bu bir mevcut kuruluma birleştirme paketidir; temiz siteye eksiksiz kurulum paketi değildir.

## Dosyalar ve sonraki kontrol

`DOGRULAMA_r949.json` kaynak hashlerini ve her bulgunun kapsamını, `SHA256SUMS_r949.txt` paket dosyalarının bütünlüğünü içerir. Test kaynakları, ham sonuçlar ve iki gerçek Tefekkür ekran görüntüsü ayrı `SUKUN_r949_TEST_KAYNAKLARI.zip` içindedir. Önceki r9xx raporları geçmiş sürümlere aittir; bu sürümün sonucu değildir.

Kurulumdan sonra `TELEFON_TESTI_r949.txt` içindeki kısa tek kayıt ve 28/99 geçiş deneyi yeterli ilk doğrulamadır. Bir kesinti olursa Sağlık kontrolünde “Sorun şimdi oldu” ve “Raporu indir” ile o anın kaydı alınmalıdır. Freeze, discard ve OOM birbirinin yerine kullanılmamalıdır.
