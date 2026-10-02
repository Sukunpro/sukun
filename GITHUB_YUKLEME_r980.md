# SÜKÛN r980 — yükleme ve telefonda kontrol

ZIP’i aç. Aşağıdaki 8 kök dosyayı sukunpro/sukun depo köküne, assets/ altındaki 231 dosyayı kendi yollarıyla aynı assets/ klasörüne yükle. Aynı adlı dosyaları değiştir; kök ve assets aynı commit içinde olmalı. Paket dışındaki dosyaları silme. ZIP’i tek başına depoya yüklemek uygulamayı güncellemez.

- index.html
- nero.html
- sw.js
- manifest.webmanifest
- sukun-build-r980.json
- sukun-latest.json
- icon-192.png
- icon-512.png

GITHUB_DOSYA_LISTESI_r980.txt kesin hedef yollarını verir. Runtime dosya adlarındaki eski sürüm numaralarını değiştirme; yeni çarklar assets/wheels-r977/ içinde kalır. integration/ ve raporların yayına yüklenmesi gerekmez. Kişisel kayıtları veya tarayıcı verilerini silme.

## Telefonda kontrol

1. Güncellemeyi kontrol et ile yeni sürüme geç; Uygulama ve SW birlikte r980 görünmeli.
2. Mevcut tempo seçiminin korunmasını doğrula. Kullanıcı seçimi olmayan ilk kullanım 1 saniye, en düşük seçenek 0,6 saniye olmalı.
3. Kendi kaydınla 0,6 saniye seç. Kayıt daha uzunsa sesin tümünün bitmesini, üst üste okumama ve sayacın doğru ilerlemesini dinleyerek kontrol et.
4. Normal görünümde, Tefekkürde, başka sekmede ve kilit/aç dönüşünde aynı ayarı dene. Görsel tasarruf seçildiğinde tempo kontrol değeri değişmemeli.
5. Önce efektler kapalı kısa deneme, sonra eko ve 8D ile ayrı deneme yap. Fiziksel eski Xiaomi'de ses sonucunu bu ortamda ölçmedik.
6. Duraklat/devam, Bitir, önceki/sonraki ve terkip formüllerini dene. Bitir veya duraklat sonrası ekran dönüşü ses başlatmamalı.
7. Hazırlanmış çevrimdışı varlıklarla interneti kapatıp aynı akışı dene. Sorun olursa sağlık raporunu dışa aktar; kayıtları silmek gerekmez.

Ek geliştirme önerileri RAPOR_r980.md içinde onay bekleyen kapsam olarak belirtilmiştir. Bu çalışma canlı yayına uygulanmadı; tam kaynak paketi verilmiştir.
