# SÜKÛN r979 — yükleme ve telefonda kontrol

ZIP’i aç. Aşağıdaki 8 kök dosyayı sukunpro/sukun depo köküne, assets/ altındaki 231 dosyayı kendi yollarıyla aynı assets/ klasörüne yükle. Aynı adlı dosyaları değiştir; kök ve assets aynı commit içinde olmalı. Paket dışındaki dosyaları silme. ZIP’i tek başına depoya yüklemek uygulamayı güncellemez.

- index.html
- nero.html
- sw.js
- manifest.webmanifest
- sukun-build-r979.json
- sukun-latest.json
- icon-192.png
- icon-512.png

GITHUB_DOSYA_LISTESI_r979.txt kesin hedef yollarını verir. Runtime adlarında eski sürüm geçen yolları değiştirme; yeni çarklar assets/wheels-r977/ içinde kalır. integration/ ve geliştirme raporlarını yayına yüklemek gerekmez. Kişisel kayıtları veya tarayıcı verilerini silme.

## Telefonda kontrol

1. Güncellemeyi kontrol et ile yeni sürüme geç; Uygulama ve SW birlikte r979 görünmeli.
2. Kayıtlı ses ile zikir başlat. Normal görünümde ve Tefekkürde kısa kilit/aç dene. Sayı korunmalı, görünüm geri gelmeli.
3. Telefonda aynı durumla uzun kilit/aç dene. Sesin gerçekten duyulmasını ve sayımı ayrıca kontrol et. Bu fiziksel test bu ortamda yapılmadı.
4. Dönüşten hemen sonra kaydır ve düğmelere dokun. Kullanıcı hareketi başladıysa görünüm otomatik başka konuma taşınmamalı. Ayar okurken normal scroll konumu korunmalı.
5. Pause/Bitir verip kilitle; dönüş yalnız görünümü toparlamalı, kullanıcı başlatmadan ses başlamamalı. Manuel +1/−1 ve formül okumalarını da dene.
6. Ekran yeniden boş kalırsa yenilemeden önce, mümkünse “Görünümü yeniden göster” ile dene. Sağlık raporunu dışa aktar. Yeni rapor görünürlük gözlemlerini içerir; kayıtları silmek gerekmez.
7. Çevrimdışı temel modüller ve görseller hazırlanmışken interneti kapatıp dönüşü dene. Sağlık raporunda sürüm/önbellek sonucu ile SW_OPERATION uyarısı ayrı değerlendirilir.

Bu çalışma canlı yayına uygulanmadı; tam kaynak paketi verilmiştir.
