# SÜKÛN r985 — Berhetiyye kapsamı ve alt menü düzeltmesi

r984 üzerine hazırlanmış tam kaynak paketidir. Canlı yayın yapılmadı.

- Renk ve kaplama kuralları yalnız görünür Berhetiyye ekranında geçerlidir. 99 Esmâ zümrüt yeşili, basılı/seçili vurgusu yakut kırmızısı; 28 Berhetiyye portakal turuncusu, basılı/seçili vurgusu ametist morudur. Altın çerçeveler mevcut taş görselleriyle uyumludur. Esmâ ekranının doğal görünümü korunur.
- Genel mavi kaplama kuralının özel düğme renklerini bastırmasına neden olan CSS öncelik çakışması giderildi. Seçim rengi mevcut aria-pressed durumunu izler; ayrı bir seçim durumu üretilmez.
- Güncelleme turuncusu ve kalın Tekil zikir korunur. Bilgi kartları, menzil/uyarı alanları, kaynak etiketleri ve Atlas arama/açıklama alanları okunabilir iç yüzey ve kenar süslemesiyle tamamlandı.
- Okumalar / Seyirler / Araçlar alt menüsünün eski arayüz tarafından gizlenmesi giderildi. Menü normal sayfa akışındadır; gizli durum, odak ve Tefekkür görünümü korunur.
- Alt menü tıklaması önce yeni arayüzün gizli ek bölümlerini açar, ardından mevcut bölüm açma ve kaydırma işleyicisi çalışır. Ses, sayaç, tempo, dokunma/kaydırma motorları değişmez.

## Doğrulama

49/49 regresyon süiti geçti. Yeni kontroller üretimdeki CSS önceliklerini modelleyerek eski renk ve gizlenme hatalarını yeniden üretir; üç alt menü tıklamasının ek bölümleri açıp doğru hedefe kaydırdığını gerçek işleyicilerle Node VM içinde denetler. Bu kontroller tarayıcıda görsel render değildir.

Build, SW, manifest, SRI, 38 runtime hash, çevrimdışı worker bağlantıları ve onaylı çark görselleri doğrulandı. ZIP içindeki tüm uygulama dosyaları kaynakla birebir karşılaştırıldı.

Gerçek tarayıcıda görsel render ve fiziksel Xiaomi/kilit/ses testleri bu ortamda yapılmadı. Bu sürüm sunum ve menü erişimi düzeltmesidir; yeni bir ses veya çökme düzeltmesi içermez. Önceki Studio/ilerleme günlüğü düzenlemeleri ve 0,6 sn alt sınır / 1 sn ilk kullanım tempo kuralı korunur.

Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
