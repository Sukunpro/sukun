# SÜKÛN r976 — ayarlarda tıklama ve kaydırma

r975 tam paketi üzerine hazırlanmıştır. GitHub'a yayın yapılmadı. Bu paket web/PWA kaynaklarıdır; APK/AAB değildir.

## Doğrulanan nedenler ve düzeltme

Açıklama balonunun basılı tutma zamanlayıcısı kaydırma başlamasına rağmen çalışabiliyor, dokunmatik odak da balonu hemen açabiliyordu. Hareket, iç panel kaydırması, iptal, çoklu dokunma ve ekranın gizlenmesi bu bekleyen açıklamayı iptal eder. Kısa dokunuş gerçek düğme işlevini korur. Açıklamayı açan başarılı basılı tutmanın ardından gelen tek dokunma düğme eylemini çalıştırmaz.

Kaydırıcı, seçim ve yazı alanlarında dokunmatik açıklama ayrı küçük yardım düğmesinden açılır. Ayarı değiştirme hareketi yardım açmaz. Masaüstü/klavye açıklaması, seçili dil ve Escape ile kapatma korunur. Balon kaydırmayı yakalayan bir katman oluşturmaz.

Chromium native range alanı parmak değdiği anda input üretebilir; dikey kaydırma niyeti henüz anlaşılmamıştır. Tempo alanının mevcut koruması korunarak diğer native range alanlarına da niyet denetimi eklendi. Bekleyen ilk değer model/ses ayarına yazılmaz. Dikey kaydırma/iptal eski değeri korur. Kısa dokunuş bir kez uygulanır; belirgin yatay sürükleme canlı ayar yapar. Yatay ayarda uygulanmış değer iptal olunca geri alınmaz. Fare, klavye ve uygulamanın programatik ayar güncellemeleri korunur; global click veya touchmove engellemesi eklenmez.

İki frekans knob'u dokunmatikte dikey kaydırmayı serbest bırakır; yatay sürükleme ayar yapar. Artır/azalt düğmelerinde ilk dokunmada ayar yazılması kaldırıldı: kısa dokunuş click ile, sabit basılı tutma gecikmeli tekrar ile çalışır. Hareket, kaydırma, iptal ve odak kaybı tekrarı durdurur.

## Korunan davranışlar

r975'in Arapça/Türkçe TTS hız, perde ve ses tercihi değişiklikleri devam eden zikri kesmez; sonraki okuyuş güncel tercihi kullanır. Sayım/ses oturumu sahipliği, seyir, kayıt önceliği, manuel ses/geri bildirim, doğal çark gezinme parçaları ve onaylı online/offline health ekranı korunur. Dosya adlarında eski sürüm taşıyan runtime/asset yolları değiştirilmez.

## Doğrulama ve sınır

260 JavaScript kaynağı sözdizimi, 30 runtime hash, HTML SRI, index/nero eşitliği ve SW/build/manifest senkronu doğrulandı. 19 regresyon süiti başarıyla tamamlandı. Üretim kodundan çıkarılan işlevler kontrollü event/DOM/timer ortamında çalıştırıldı; r975 hataları ayrıca yeniden üretildi. Ayrıntılar integration/r976/evidence altındadır.

Fiziksel Android ve gerçek tarayıcı çizimi/dokunması bu ortamda test edilmedi. Telefonda özellikle ayarın üzerinden dikey kaydırma, yardım düğmesi, kısa dokunuş ve yatay sürüklemeyi doğrulayın. Bu sınırlama test sonuçlarında açıkça NOT_RUN olarak kayıtlıdır. Önceki raporlar ve mockuplar arşivdir; güncel rapor RAPOR_r976.md'dir.
