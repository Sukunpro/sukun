# SÜKÛN r987 — Klasik/Feyz gerçek okuma ve araç erişimi

r986 üzerine hazırlanmış tam kaynak paketidir. Canlı yayın yapılmadı.

## Doğrulanan neden ve düzeltme

Klasik/Feyz canlı ekranında zMegaHost → r494NavCluster → r494MainNavSlot yolu gözlendi. r162 grupları oluştururken resetBtn öğesini ekleme çıpası olarak kullanıyordu; r494 bu düğmeyi DOMContentLoaded öncesinde kendi gezinme alanına taşıyor. Modern sunum eski gezinme alanını CSS ile gizlediği için Tövbe, Hizbü’l-Vikâye ve bütün gruplar içeride kalıyordu. r986 yalnız üst akordiyonları açıyordu; bu CSS ile gizlenen ara kapsayıcıyı çözmüyordu.

- Gruplar artık resetBtn konumuna bağlı olmadan sabit .card.zCtl içine kurulur. Sade/Odak düzeninde mevcut Araçlar akordiyonunun gövdesi kullanılır. Aynı içerik öğeleri taşınır; okuma metinleri, kayıt düğmeleri ve dinleyicileri yeniden oluşturulmaz.
- Bölüm açma ve yeniden yerleşim mevcut yerleşim API’siyle kapsayıcıyı onarır. Geç kalan eski yerleşim nedeniyle gizli gezinmeye girmiş bir kapsayıcı aynı öğe kimliğiyle geri alınır.
- Üst gezinme ve footer bağlantıları aynı bölüm açma yolunu kullanır; başarısız modern yönlendirme eski gizli alana sessizce kaydırmaz. Kapalı üst akordiyonlar açılır.
- Kompakt görünümde Tövbe, Delâil ve kendi sesin kartlarının başlıkları da erişilebilirdir. Kasıtlı gizli tam metin, dosya seçici ve özel erişim politikası korunur.
- Klasik/Feyz tercihi değiştirilmez. Ses, kayıt ve sayım motorlarında yeni değişiklik yoktur. Önceki çarklar, toplam zikir, açıklama düğmeleri, Berhetiyye renkleri ve 0,6 sn alt sınır / 1 sn ilk kullanım kuralı korunur.

## Doğrulama ve sınırlar

52/52 regresyon süiti geçti. Yeni davranış denetimi gerçek HTML’den alınan 720 öğeli Zikir ağacını kullanır: grup oluşturma, Sade/Odak taşıma, bölüm açma ve zNavGo üretim kodu çalıştırılır. r986’nın Klasik/Feyz hatası aynı gizli r494 yolunda yeniden üretildi.

25 yeni davranış senaryosu; 40 içerik/görünürlük kontrolü geçti. Klasik, Sade, Odak × Esmâ, Berhetiyye × Mini, Midi, Pro kombinasyonlarında gerçek Tövbe, Hizbü’l-Vikâye, istiğfar, salavat, Delâil, Âyetü’l-Kürsî ve araç kontrol öğelerinin üst kapsayıcıları incelendi. 12 gerçek içerik kartı r986 ile byte düzeyinde aynı; özel erişim kodu da değişmedi. Gezinti herhangi bir ses komutu vermedi.

Build, SW, manifest, 38 runtime hash, SRI, çevrimdışı worker bağlantıları ve 8 onaylı çark görseli doğrulandı. ZIP bütünlüğü ve tüm uygulama dosyalarının kaynakla birebir eşitliği kontrol edildi.

Yeni sürüm için tarayıcı render ve fiziksel Android/Xiaomi dokunma/ses denemesi yapılmadı. DOM ve CSS denetimleri deterministik modellerdir, fiziksel cihaz kanıtı değildir. Önceki raporlar arşivdir; güncel rapor bu dosyadır.
