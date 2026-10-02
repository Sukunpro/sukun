# SÜKÛN r986 — Bölüm erişimi, açıklama düğmeleri ve toplam zikir

r985 üzerine hazırlanmış tam kaynak paketidir. Canlı yayın yapılmadı.

- Okumalar, Seyirler ve Araçlar artık çarkın altında, Kontroller ve görünüm kapalıyken de erişilebilir. Üç mevcut düğme taşındı; ikinci bir menü ya da tıklama sahibi üretilmedi.
- Önceki erişim düzeltmesinin atladığı kapalı r616ZikirTools üst akordiyonu saptandı. Bölüm bağlantısı hedefe kadar bütün kapalı üst akordiyonları açar, mevcut ek bölüm görünürlüğünü etkinleştirir ve hedefe kaydırır. Gecikmiş eski footer yerleşimi menüyü geri taşıyamaz.
- Açıklama düğmeleri ana sesin küçük simgesinden ve mutlak konumlu Süre etiketinden çıkarıldı. Düğmeler native kontrollerin yanında ayrı hücrelere yerleşir. Süre etiketi ikinci satırdadır; yardım düğmesine genel mavi taş kaplaması uygulanmaz.
- Toplam zikir gizlenen eski karttan çarkın yanına taşındı. Mevlevi/Esmâ görünümünde koyu ve okunaklı, Berhetiyye görünümünde altın çerçevelidir. Aynı totalCnt öğesi ve mevcut sayı güncelleme sahibi korunur; sayı sıfırlanmaz veya ikinci sayaç üretilmez.
- Toplam başlığı ve bölüm navigasyonu İngilizce sözlüğüne eklendi. Önceki Berhetiyye aile renkleri, onaylı çark görselleri ve 0,6 sn alt sınır / 1 sn ilk kullanım tempo kuralı korunur.

## Doğrulama

50/50 regresyon süiti geçti. Yeni erişim denetimi gerçek uygulama işleyicilerini kapalı üst akordiyon, gizli kontrol paneli ve gerçek sayaç öğesi kimliği modeliyle çalıştırır. Eski r985 davranışı aynı kapalı üst kapsayıcı modelinde hatayı yeniden üretir. Altı aile/bölüm kombinasyonu, kasıtlı gizlilik sınırları, geç sekme değiştirme ve yeniden yerleşim sınandı.

Açıklama denetimi 38/38 davranış senaryosunu geçti; eski kompakt ses/süre yerleşimi yeniden üretildi. Yeni CSS denetimi 22/22 kaskad ve yerleşim kuralını doğruladı. Bunlar deterministik DOM/CSS modelleridir; gerçek tarayıcı render değildir.

Build, SW, manifest, 38 runtime hash, SRI, çevrimdışı worker bağlantıları ve onaylı çark görselleri doğrulandı. ZIP bütünlüğü ve tüm uygulama dosyalarının kaynakla birebir eşitliği kontrol edildi.

Bu ortamda yeni sürümü tarayıcıda görsel olarak açmak mümkün olmadı; fiziksel Android/Xiaomi ses, kilit ve dokunma testleri yapılmadı. Bu sürüm menü erişimi ve görünüm düzeltmesidir; yeni bir ses/çökme sağlamlaştırması içermez. Ses, sayım ve dokunma motorları byte düzeyinde korunur. Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
