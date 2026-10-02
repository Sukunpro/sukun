# SÜKÛN r984 — Berhetiyye kapsamı ve alt menü düzeltmesi

r983 üzerine hazırlanmış tam kaynak paketidir. Canlı yayın yapılmadı.

- r983'te Esmâ ekranına taşan yeni taş kaplamalar kaldırıldı. Güncelleme turuncusu, Esmâ zümrüdü, Berhetiyye sarısı ve kalın Tekil zikir yalnız görünür Berhetiyye ekranındadır.
- Ortak panel kaplamaları eski tema sınıfına tek başına güvenmez; görünür r920Practice ekranının data-mode=berhet durumunu ve açık Zikir sekmesini birlikte denetler.
- Okumalar / Seyirler / Araçlar menüsünün gerçek .sukun-bottom-nav öğeleri giydirildi. Seçili düğme zümrüt, diğer düğmeler safir kaplamalıdır; yerleşim ve tıklama işleyicileri değişmez.
- r983 kapsam regresyonunu reddeden ve gerçek alt menü kaynağını denetleyen bir kaynak testi eklendi. Ses, sayaç ve etkileşim JavaScript dosyaları değiştirilmedi.

## Doğrulama

47/47 mevcut regresyon süiti geçti. Build, SW, manifest, SRI, 38 runtime hash, çevrimdışı worker bağlantıları ve onaylı çark görselleri doğrulandı. ZIP içindeki tüm uygulama dosyaları kaynakla birebir karşılaştırıldı.

Gerçek mobil tarayıcıda görsel render ve fiziksel Xiaomi/kilit/ses testleri bu ortamda yapılmadı. Bu sürüm kozmetik değişikliktir; yeni bir ses veya çökme düzeltmesi içermez. Önceki r982 Studio/ilerleme günlüğü düzenlemeleri ve 0,6 sn alt sınır / 1 sn ilk kullanım tempo kuralı korunur.

Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
