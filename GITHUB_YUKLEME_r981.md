# SÜKÛN r981 — yükleme ve telefonda kontrol

ZIP’i aç. Aşağıdaki 8 kök dosyayı sukunpro/sukun depo köküne, assets/ altındaki 236 dosyayı kendi yollarıyla aynı assets/ klasörüne yükle. Aynı adlı dosyaları değiştir; kök ve assets aynı commit içinde olmalı. Paket dışındaki dosyaları silme. ZIP’i tek başına depoya yüklemek uygulamayı güncellemez.

- index.html
- nero.html
- sw.js
- manifest.webmanifest
- sukun-build-r981.json
- sukun-latest.json
- icon-192.png
- icon-512.png

GITHUB_DOSYA_LISTESI_r981.txt kesin hedef yollarını verir. Runtime dosya adlarındaki eski sürüm numaralarını değiştirme; önceki çarklar kendi assets/ yollarında kalır. Yeni worker dahil listedeki assets dosyaları birlikte yüklenmelidir. integration/ ve raporların yayına yüklenmesi gerekmez. Kişisel kayıtları veya tarayıcı verilerini silme.

## Telefonda kontrol

1. Güncellemeyi kontrol et ile yeni sürüme geç; Uygulama ve SW birlikte r981 görünmeli.
2. Mevcut tempo seçiminin korunmasını doğrula. İlk kullanım 1 saniye, en düşük seçenek 0,6 saniye olmalı.
3. Kısa kendi kaydınla 1 sn ve 0,6 sn seçimini ayrı dene. Sonra daha uzun kaydı dene; ses bitmeden yeni okuma başlamamalı ve seçilen tempo kendiliğinden değişmemeli.
4. Ses hazırlarken Bitir veya isim değiştir. Geç sonuç eski sesi yeniden başlatmamalı. Eko/8D açık ve kapalı denemeyi ayrı dinle.
5. İki SÜKÛN sekmesi aç. İlkinde zikri başlat; ikincide Başlat ve manuel sayımı dene. İki ses veya iki sayaç oluşmamalı. İlkini duraklatınca sahiplik korunmalı; Bitir sonrası ikinci sekmede açık kullanıcı eylemiyle başlanabilmeli.
6. Manuel zikir, isteğe bağlı kayıt/TTS, mikrofon kaydı, 28/99 seyir ve terkip akışlarını ayrı dene. Kayıt izni beklerken Bitir/isim değişimini de dene.
7. Health Check'te 12 saniyelik cihaz gözlemini mevcut zikir sırasında çalıştır. Test ayarları ve sayımı değiştirmemeli. Sekmeyi gizlersen ya da kaynak/isim değişirse iptal bilgisini göstermeli.
8. İnternet kapalıyken daha önce hazırlanmış uygulamayı açıp kayıt ve Health Check akışını dene. Uzun kilit/aç dönüşünü eski Xiaomi ve mevcut telefonunda ayrı kontrol et; bu fiziksel sonuçlar burada ölçülmedi.

Ek geliştirme önerileri varsa RAPOR_r981.md içinde onay bekleyen kapsam olarak belirtilmiştir. Bu çalışma canlı yayına uygulanmadı; tam kaynak paketi verilmiştir.
