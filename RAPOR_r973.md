# SÜKÛN r973 — açılışta ilerleme koruma ve Duraklat/Devam yarışı

r972 tam paketi üzerine hazırlanmıştır. r972'nin isteğe bağlı manuel zikir sesi, titreşim, tempo vuruşu, tok tık/kendi tık kaydı ve Berhetiyye kaplamaları korunur. Ayrıntıları RAPOR_r972.md arşivinde vardır.

## Doğrulanan sorunlar

1. Eski oturumun geri yüklenmesi açılışta 260 ms gecikiyordu. Sayfa açılışı/ses kaynağı olaylarının tetiklediği kayıt 120 ms sonra çalışıp eski sayımı başlangıçtaki 0 ile ezebiliyordu. r972 üretim kodu ve modellenmiş saatle bu sıra yeniden üretildi. Bu test fiziksel Android kapanmasının nedenini kanıtlamaz.
2. Bekleyen Başlat işlemi sırasında Duraklat→Devam, henüz temizlenmemiş aynı başlatma sözünü döndürüyordu. Duraklat eski isteği geçersiz kıldığı için yeni Devam da o eski sözle reddedilebiliyordu. r972 üretim komut sınırında yeniden üretildi.
3. Sürekli gelen sayaç/ses kaynağı olayları 120 ms kayıt zamanlayıcısını yeniden kurarak yazmayı sürekli erteleyebiliyordu. Artık ilk bekleyen kayıt korunur; olaylar onu ötelemez.

## Sonuç

- İlk kayıt, geri yükleme kararı verilene kadar engellenir. Açılış öncesindeki kayıt en başta okunur; başlangıç olayları onu ezemez.
- Kullanıcı bu arada yeni seçim/sayım/taşıma işlemi yaparsa gecikmiş eski oturum onu geri alamaz. Asenkron tefekkür açılışı sırasında gelen yeni komut eski devam işaretini de iptal eder.
- Geri yükleme otomatik ses başlatmaz. Kullanıcı normal Başlat/Devam kontrolüyle mevcut ses sahibinden sürdürür. Süresi geçmiş kayıt ve yeni Baştan kararı mevcut kurallarla korunur.
- Duraklat bekleyen Başlat isteğini bırakır. Yeni Devam yeni istek alır; yine aynı yerel ses temizliği bariyerinin bitmesini bekler. Eski Başlat sağlayıcıya ulaşmaz; yeni Devam yalnız bir kez ulaşır. Bitir bu yeni bekleyişi de iptal eder.
- İlerleme yazımı hatası artık sessizce saklanmaz: Sistem sağlığı → Zikir ilerleme kaydı (SESSION_MEMORY) hatayı gösterir. Tanı yalnız sürüm/kapı/bekleyen yazım/yazım sayısı/zaman/hata türüdür; kayıt sesi ve zikir metni eklenmez.

Sayaç artırma, ses çalma ve seyir motorları değiştirilmedi; yeni bir otomatik sayım veya ses sahibi kurulmadı. Bu sürüm tüm tarihsel kontrol sarmalamalarını kaldıran geniş bir yeniden yazım değildir. Öncelik somut iki yarışı gidermektir.

## İsteğe bağlı manuel zikir sesi

Kontroller ve görünüm → Zikir ayarları → Manuel dokunuş → Dokununca zikri seslendir.
Varsayılan kapalıdır. Açıkken kabul edilen +1/çark dokunuşu tek okuyuş başlatır; başarıyla tamamlanınca sayaç bir artar. Okuyuş sırasında ikinci ses ve sayım kabul edilmez. −1 yalnız düzeltmedir. Otomatik/kendi kayıt öncelikli Ses kaynağı modunda kendi zikir kaydın, yoksa uygun Arapça veya Türkçe cihaz sesi kullanılır. Özellikle seçtiğin ses modu korunur. Otomatik akış/seyir çalışırken elle sayım çift sayımı ve ses-sayaç bozulmasını önlemek için engellenir, duraklatma gerekçesi açıklanır.

## Doğrulama

- 18 açılış/komut/kayıt testi geçti. İki r972 yarışının eski fixture üzerinde üretimi, boş/eski depo, yeni kullanıcı işlemi, asenkron tefekkür dönüşü, sürekli olaylar, kota hatası/yeniden yazım, yinelenen Başlat, Duraklat/Devam/Bitir temizliği ve sağlık raporu kapsandı.
- 18 manuel zikir sesi, 15 tok tık/mikrofon, 20 manuel geri bildirim, 25 sayaç, 9 DOM/bütünlük/restart, 16 Türkçe hız ve 14 akış/terkip/vird/kilit regresyonu geçti.
- 260 JavaScript kaynak sözdizimi; 30 runtime hash/SRI; index.html ve nero.html byte eşitliği geçti.
- 20 çarkta 120 geometri senaryosu; 11 ses regresyonu ve stereo bellek sınırı geçti.
- SW kurulum/çevrimdışı shell/runtime/sürüm/hash reddi/onarım kontrolü geçti.
- 184 sabit asset bağlantısı ve 184 raster görsel doğrulandı; 222 assets tam pakette.
- ZIP CRC ve 230 gerekli uygulama dosyasının kaynakla byte eşitliği paketlenirken denetlenir.

Kanıtlar integration/r973/evidence/ ve DOGRULAMA_r973.json içindedir. Testler üretim işlevlerini modellenmiş DOM/saat/depo/speech/media/mikrofon host üzerinde yürütür. Gerçek Android ses, titreşim, mikrofon, kilit ve süreç sonlandırma testi yapılmadı. Ani kapanmanın kesin kök nedeni belirlenmiş değildir; tamamen çözüldü iddiası yapılmaz. Bu kaynak/PWA paketidir; APK/AAB değildir.
