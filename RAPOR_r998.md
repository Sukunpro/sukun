# SÜKÛN r998

r997 tam paketine açıklama erişimi/İngilizce, kilit ekranı kayıt seviyesi ve niyet geçişi düzeltmeleri uygulandı. Canlı siteye yayın yapılmadı.

## Açıklamalar ve Eng

Ekran görüntüsündeki süre yardımı dönüştürülmüş/bulanık kartın içinde kaldığından sonraki kartın altında çiziliyordu. Ortak yardım artık body altında sabit viewport katmanıdır. Konumu visualViewport ve ekran sınırlarıyla sınırlanır. Opak zemini, × kapatması ve kendi kaydırması vardır. İçeride kaydırmak açıklamayı kapatmaz; dışarı dokunma, dış sayfayı kaydırma, Escape, ekran değişimi ve arka plana geçiş kapatır. Uzun basma bırakılınca açıklama hemen kaybolmaz. Sabit dokunuşun bırakma tıklaması ayarı yanlışlıkla çalıştırmaz; sürükleme/iptal normal kaydırmayı korur. Form yardım düğmeleri alan değerlerini değiştirmez. Escape açık balonu kapatır; alttaki pencereye taşmaz.

69 güncel statik yardım metni Türkçe/İngilizce renderer üzerinden denendi. 121 açıklama, niyet, ayar ve arayüz çevirisi sözlüğe eklendi/tamamlandı. Dinamik tema/ayrıntı açıklamaları, isimli karşılama ve birleşik vakit başlıkları Eng'de çevrilir. Türkçeye dönüş özgün kaynak metinleri korur. Arapça ibareler, okunuşlar ve kullanıcının adı/kendi içerikleri korunur. Eski tefekkür uzun basma açıklaması da kapatılabilir, sınırlı viewport katmanına alındı; gezinme kısa ipuçları ekranın üstünden taşmaz. Önceki Tekke rehberi/Mihrap odak ve dokunma kilidi düzeltmeleri korunur.

## Kilitte kayıt ve eko

Önceki playRecording, backgroundNative ve document.hidden birlikteyken kayıt kalite analizini atlıyordu. Böylece görünür oynatımda bulunan normalizasyon kazancı kilitte 1'e dönüyor, sessiz kayıt ve yankısı daha düşük duyulabilecek bir medya seviyesi alıyordu. Aynı sınırlı/önbellekli analiz artık görünür ve gizli hazırlamada kullanılır. Kaynak Blob, seçilmiş ses/yankı, eko katsayıları ve tempo tercihi değiştirilmez. Zikir yolculuğunda hazırlanan native FX kaynağı iki ekran durumunda da kullanılır. Testte önceki kazanç kaybı yeniden üretildi; gerçek üretim fonksiyonlarının medya modelinde görünür ve gizli ses seviyesi aynı 0.3976, seçilen wet 0.7 kaldı. Bu bir duyulan ses ölçümü değildir.

## Niyet

“Her zikrin başında göster” ve “Her zikrin başında seslendir” birbirinden bağımsızdır. İkisi kapalıysa niyet başlamaz. Yalnız göster açıkken görüntü vardır; yalnız seslendir açıkken banner olmadan ses çalar. “Her devirde” aynı adın yeni döngüsüne ayrıca uygulanır; başka zikre geçiş yeni niyet sınırıdır.

İlk gerçek zikir sesinden önce niyet tamamlanır: kayıtlı kendi niyet sesi → varsa Arapça cihaz sesi → Türkçe okunuş TTS. Kayıt bulunamazsa veya okunamazsa sonraki kaynak denenir. Niyet tekrar sayılmaz, ritim/sayaç kaynağına bağlanmaz; mevcut okuma bitmeden başka ses başlatmaz. Seçim değişimi/Stop ve seslendirmeyi kapatma eski girişimi iptal eder. Geç gelen kayıt/TTS bitişi eski niyeti tamamlandı sayamaz veya sayaç artırmaz. Aynı sınırdaki çağrılar tek niyeti bekler. Tamamlanmış niyet Duraklat/Devam et ile yeniden seslendirilmez. Ses başlamazsa süre sınırı çözülür ve hata bildirimiyle normal zikir akışı devam edebilir; sonsuz bekleme veya tekrar deneme döngüsü oluşmaz. Terkip alt parçalarında her kelimede tekrar niyet okunmaz.

## Doğrulama ve sınırları

78/78 regresyon grubu geçti; önceki 75 grup korunur. Yeni gruplar: 21 niyet senaryosu, 23 yardım/dil/viewport senaryosu ve 8 kilit kayıt seviyesi senaryosu. Önceki Tekke 26 giriş/odak ve 42 geometri kontrolü, ses/set/kayıt/tempo, güncelleme/çevrimdışı ve tema testleri geçer. 272 JS blok/dosyası parse edildi; 44 runtime hash/SRI, uygulama/SW/manifest r998 eşliği ve 8 onaylı çarkın hash/alpha bilgisi geçti. ZIP CRC, tekil yollar, tam asset listesi ve 253 gerekli uygulama dosyasının byte eşliği doğrulanır.

Test kaynakları gerçek uygulamadan çıkarılmıştır; DOM/viewport, saatler, medya/TTS ve sekmeler modellenmiştir. Gerçek tarayıcı çizimi, duyulan ses, fiziksel Android/Xiaomi ve ekran kilidi/geri dönüşü NOT_RUN. Telefonda aşağıdaki kontrol listesi uygulanmalıdır. Her telefon için kesintisiz arka plan sesi garantisi verilmez; burada seçilmiş seviyenin kod tarafından düşürülmesi giderildi.

IndexedDB şeması, kayıt arşivi, tema görselleri, minimum 0,6 sn / ilk kullanım 1 sn ve kullanıcının geçerli tempo tercihi korunur. Assetler arasındaki tek değişiklik offline-scenes sürüm sorgusudur. Güncel kaynak index.html/nero.html ve r998 raporlarıdır; önceki raporlar arşivdir.
