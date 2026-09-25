# SÜKÛN r915 — Berhetiyye buton ve sayaç onarımı

r914 onarımının üzerine hazırlanmıştır; r914 değişiklikleri korunur.

## Yapılan düzeltmeler

- Kullanıcının gönderdiği kırmızı, yeşil ve altın görseller dosya içerikleri değiştirilmeden pakete alındı. Kırmızı Bitir, yeşil Bu ismi baştan, altın Tüm seyri baştan için kullanılır. Paketteki mor taşlı buton Duraklat için kullanılır.
- Ortak 28 isim kumandası ve eski 28 isim seyir kartının butonları düzeltildi. Dekor, metinden ayrı katmanda; siyah zemin SVG filtresiyle görüntüleme sırasında kaldırılır. Özgün alfa saydamlığı korunur. Görsellerin yanlış kesilmesi ve metnin altında dikdörtgen kalması giderildi.
- 99 Esmâ kontrolleri kendi sade renkli yüzeyini kullanır; Berhetiyye süslemesi buraya sızmaz. Eski seyir başlıklarında başlık ile durum metni ayrı yerleşir.
- Berhetiyye çarkı gönderilmiş saydam kaynaktan yüklenir; siyah kare ve kare parlaması kaldırıldı. Sayı ve isim dönen dekorun üzerinde sabit kalır.
- Berhetiyye çarkındaki isim, hedef ve sayı artık kendi seyir motorunun indeks ve tekrar verisinden okunur. Ana seçim Rahmân kaldığında Berhetiyye çarkının da Rahmân yazması giderildi. Aktif seyir aynı ismi seçmişse canlı sayaç; aksi durumda seyir kaydı gösterilir. Tekrar modu hedef hesaplamasında korunur.
- 28 isim önizlemesi tek başına normal zikir sayacını gizlemez. Mevcut kilitli bölüm erişim denetimi korunur; kumanda da bu denetimi uygular.
- Normal zikir ve Tefekkür sayıları merkezlendi. Hareket kapalıyken halka görünür kalır. Eksik eski SVG dekorlarının kırık resim çerçeveleri devreden çıkarıldı.
- Aynı sayaç metnine yazan eski modüller ayrıldı; gereksiz genel DOM gözlemi yerine ilgili sayaç alanları izlenir.
- Sürüm, manifest, build işaretleri ve servis çalışanı önbelleği r915 olarak güncellendi. Kullanıcı kayıtları silinmez.

## Doğrulama

- 242 JavaScript blok adayının sözdizimi ve servis çalışanı sözdizimi kontrol edildi.
- Chromium 390 × 844, gerçek uygulama: Zikir ekranı açıldı; +1 ile 0→1, −1 ile 1→0; Zikir Ayarları açıldı; Tefekkür'e geçildi. Çalışma zamanı JavaScript hatası gözlenmedi. Hareket kapalıyken halka görünür, sayaç merkezde. Yatay taşma yok.
- Berhetiyye bileşeni tüm uygulama stilleriyle izole edilerek 360, 390 ve 430 pikselde kontrol edildi. Yatay taşma yok; butonların yüksekliği en az 58 piksel. Başlat/duraklat/sürdür görünürlük kuralları ve kırmızı/yeşil/altın/mor dekorlar incelendi.
- Seyir görünümünün altı veri durumu kontrol edildi: farklı ana isim, kendi kayıt sayısı/hedefi, aktif aynı seçim, duraklatma ve kilitli erişim dahil. Gönderilen üç butonun paket kopyaları kaynaklarla byte düzeyinde aynı.
- index.html ve nero.html aynı; önbelleğe alınacak yerel dosyalar mevcut; ZIP bütünlüğü doğrulandı.

## Kurulum ve sınırlar

Arşivi mevcut sitenin dosyalarının üzerine BİRLEŞTİREREK aktarın. assets klasörünü silmeyin. Önceki pakette özgün Mevlevî ana sahnesi ve bazı eski varlıklar yoktu; bu onarım bunların tamamını içeren bağımsız arşiv değildir. Mevcut ana sahne yolu korunur; dosya yoksa koyu renk geçişi görünür.

Canlı siteye yayın yapılmadı. Berhetiyye görsel testi izole bileşende yapıldı; gerçek kilit açma akışı aşılmadı. Tam 28/99 seyir bitişi, kişisel kayıtlar, gerçek Android kilit ekranı ve arka plan ses sürekliliği cihazda test edilmedi.
