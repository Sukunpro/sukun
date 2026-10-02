# SÜKÛN r982 — yükleme ve telefonda kontrol

ZIP’i aç. Aşağıdaki 8 kök dosyayı sukunpro/sukun depo köküne, assets/ altındaki 238 dosyayı kendi yollarıyla aynı assets/ klasörüne yükle. Aynı adlı dosyaları değiştir; kök ve assets aynı commit içinde olmalı. Paket dışındaki dosyaları silme. ZIP’i tek başına depoya yüklemek uygulamayı güncellemez.

- index.html
- nero.html
- sw.js
- manifest.webmanifest
- sukun-build-r982.json
- sukun-latest.json
- icon-192.png
- icon-512.png

GITHUB_DOSYA_LISTESI_r982.txt kesin hedef yollarını verir. Runtime dosya adlarındaki eski sürüm numaralarını değiştirme; önceki çarklar kendi assets/ yollarında kalır. Yeni worker dahil listedeki assets dosyaları birlikte yüklenmelidir. integration/ ve raporların yayına yüklenmesi gerekmez. Kişisel kayıtları veya tarayıcı verilerini silme.

## Telefonda kontrol

1. Kök dosyalarla assets klasörünü birlikte güncelle. Uygulama ve SW r982 görünmeli.
2. Mevcut tempo tercihi korunmalı. Yeni kullanıcı 1 sn ile başlamalı; en düşük seçenek 0,6 sn olmalı.
3. Studio’da kendi kısa kaydını analiz et, normalize et ve sessizliği kırp. İşlenmiş sesi dinle; sessiz kayıtta asıl sesin korunduğunu kontrol et.
4. Studio analiz/düzenlemesi sırasında başka kaydı seç veya sayfadan ayrıl. Geç sonuç önceki ya da yeni kaydı yanlış değiştirmemeli.
5. Akıllı sırada ses hazırlığı sürerken Bitir veya sıra değiştir. Geç hazırlık sesi yeniden başlatmamalı.
6. Tekil zikir, 28/99 seyir ve sabit tekrarlı akıllı oturumu ayrı duraklatıp sayfayı yeniden aç. Konum durmuş halde alınmalı; tamamlanmış tekrarlar korunmalı, tempo değişmemeli.
7. Sayaçta -1 düzeltip duraklat/Bitir ve sekme devralmayı dene. Eski büyük toplam geri gelmemeli.
8. Yedek geri yükleme ve veri sıfırlamayı boştaki sekmede dene. Önceki günlük silinen/import edilen veriyi sonradan geri getirmemeli.
9. Çevrimdışı hazırlanmış uygulamada aynı akışları dene. Eski Xiaomi’de kendi sesin/eko/8D, uzun kilit ve ekran dönüşünü ayrıca dinleyerek kontrol et; bu cihaz sonuçları burada ölçülmedi.

Ek geliştirme önerileri varsa RAPOR_r982.md içinde onay bekleyen kapsam olarak belirtilmiştir. Bu çalışma canlı yayına uygulanmadı; tam kaynak paketi verilmiştir.
