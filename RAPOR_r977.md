# SÜKÛN r977 — yeni çarklar

r976 tam paketi üzerine hazırlanmıştır. Bu paket web/PWA kaynaklarını içerir; APK/AAB değildir. GitHub'a yayın yapılmadı.

## Eklenen tasarımlar

| Türkçe | English | Dosya |
|---|---|---|
| Ceviz Nakşı | Walnut Carving | assets/wheels-r977/ceviz-naksi.webp |
| Zeytin Tesbihi | Olivewood Prayer Beads | assets/wheels-r977/zeytin-tesbihi.webp |
| Abanoz Sükûnu | Ebony Serenity | assets/wheels-r977/abanoz-sukunu.webp |
| Sandal Halkası | Sandalwood Ring | assets/wheels-r977/sandal-halkasi.webp |
| Altın Nakış | Golden Filigree | assets/wheels-r977/altin-nakis.webp |
| Elmas Tacı | Diamond Crown | assets/wheels-r977/elmas-taci.webp |
| Gümüş Telkâri | Silver Filigree | assets/wheels-r977/gumus-telkari.webp |
| Sultan Taşları | Sultan's Jewels | assets/wheels-r977/sultan-taslari.webp |

Sekiz tasarım hem Esmâ hem Berhetiyye çark seçimine eklendi. Esmâ'da 14, Berhetiyye'de 22 seçenek bulunur. Eski seçenekler ve her bölümün ayrı kayıtlı tercihi korunur. Altın Nakış ve Sultan Taşları, onaylı taşlı ve zenginleştirilmiş revizeleri kullanır.

Çarklar gerçek şeffaf WebP görselleridir. Simgeler görsele basılmadı; mevcut uygulama düğmeleri her tasarımın altı yüzeyine yerleştirildi. Önceki–Sonraki için yeni çarklara dış plaka/çerçeve eklenmez. Var olan tek rotor, karşı dönüş, kaydırma denetimi ve eylem işleyicileri kullanılır. Altın yüzeylerde koyu, koyu ahşap ve taşlarda açık simge rengi kullanılır. Sultan'ın altın gezinme yüzeyleri ayrı koyu simgelidir.

Çark seçimi ses, sayaç, tempo veya seyri durdurmaz. Hızlı seçimde eski görsel sonucu yeni tercihi ezemez; yeni görsel açılamazsa klasik çarka geçilir, ikisi de açılamazsa durum açıkça bildirilir ve sade kontrol konumları kullanılır.

Kontroller ve görünüm → İsim, çark ve görünüm bölümünden çark seçilir; Çarkları görerek seç ile küçük galeri açılır. Çark içi Önceki–Sonraki seçeneği mevcut ayardan açılır. Çarkları ve arka planları çevrimdışı kaydet düğmesi sekiz yeni görseli de indirir; başarılı sonuç SW önbellek makbuzu ile doğrulanır. İlk çevrimdışı kullanım için bu hazırlığı internet açıkken tamamlayın.

r976'nın manuel kayıt/TTS sesi, isteğe bağlı titreşim/tempo, tok veya kişisel tesbih sesi, Arapça/Türkçe ses ayarlarını akışı kesmeden değiştirme, vird/terkip, iki dil ve onaylı Sistem kontrolü özellikleri bu tam pakette korunur.

## Doğrulama

20 regresyon süiti başarıyla tamamlandı. Yeni katalogda iki bölüm, 16 seçim/yükleme geçişi, kalıcı tercihler, simge kontrastı, yükleme yarışı, klasik/sade yedek, kontrol geometrisi ve iki dil kontrol edildi. SW testi sekiz yeni görseli internetten alıp çevrimdışı tekrar yükledi ve her dosyanın SHA-256 değerini doğruladı.

260 JavaScript kaynağı ayrıştırıldı. 30 runtime hash, 8 yeni görsel hash, HTML SRI, build/SW/manifest kimliği ve index/nero eşitliği doğrulandı. Şeffaflık kanalının format dönüşümünde korunduğu ve kontrol merkezlerinin görselin opak yüzeylerinde olduğu doğrulandı. Mevcut 222 asset dosyasından 218'i byte düzeyinde aynı; dört sunum/çevrimdışı runtime dosyası değişti ve sekiz görsel eklendi.

Testler üretim koduyla kontrollü DOM, ağ, olay ve zamanlayıcı ortamında çalıştırıldı. Gerçek tarayıcı çizimi, fiziksel Android, ses kalitesi, ekran kilidi ve bellek yükü bu ortamda test edilmedi; bunlar NOT_RUN'dır. Telefonda çark dönüyorken simgeleri, kısa dokunma ve kaydırmayı, manuel/otomatik sesi ve çevrimdışı kullanımı doğrulayın.

Güncel rapor bu dosyadır. Önceki rapor ve testler geliştirme arşivi olarak korunmuştur; geçmiş sürüm numaraları eski dosya yollarında bilinçli olarak kalır.
