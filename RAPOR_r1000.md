# SÜKÛN r1000

r999 üzerine, yeni özellikler dahil kapsamlı İngilizce taraması yapıldı. 3019 sözlük girdisi eklendi veya düzeltildi. Eng'de Ebced → Abjad, Serbest → Free, Elle → Manual olur; Türkçe kaynak metinleri korunur. Canlı siteye yayın yapılmadı.

## Kapsam

Kayıt/yedekleme ve hata/onay pencereleri, güncelleme durumları, seyirler, bildirimler, kaynak ve ambiyans bilgi kartları, Berhetiyye yorumları, eski Esmâ listesi anlamları, görünüm açıklamaları, erişilebilirlik etiketleri ve kilit ekranı başlıkları tamamlandı. Sayı ve seçili isme göre oluşan mesajlar tam şablonları üzerinden çevrilir.

Nefs bölümündeki 120 muhasebe sorusu, 28 bilgi sorusu, 16 tefekkür sorusu, alan ve mertebe açıklamaları, 79 rehber ve 124 kaynak kaydının kullanıcıya yönelik açıklamaları tarandı. Puanlama, cevap anahtarları, kaynak kimlikleri ve özgün veri/model dosyaları değiştirilmedi. Çeviriler mevcut metin ve sınırlamalarını aktarır; yeni bir kaynak doğrulaması yapılmadı.

İngilizcede aynı kelimeye dönüşen farklı Türkçe etiketler artık kendi özgün kaynaklarını taşır. Dil değişimi Nefs ekranını yeniden oluşturmaz: kişisel not, taslak, odak/seçim, açık bölüm ve kaydırma konumu korunur. Native seçenekler metin seçenekleri olarak kalır; kimlik ve seçili değer değiştirilmez.

Yerel alert/confirm/prompt mesajları mevcut sözlükten geçer; kullanıcı cevabı ve varsayılan giriş değeri değiştirilmez. Kullanıcının kaydettiği seans ve özel ses adları, bir sözlük kelimesiyle aynı olsa bile korunur. Arapça ibare, zikir adı/okunuşu, eser adı ve kaynak kimliği korunur; açıklayıcı bağlam çevrilir.

Tarih gösterimi, haftalık gün kısaltmaları ve erişilebilirlik etiketleri aktif dili izler. Yeniden yazılan metinler çevrilmiş son değerle karşılaştırılır; çeviri gözlemcisiyle sürekli mutasyon döngüsü oluşturmaz. Çeviri için ses başlatma, sayaç artırma, kayıt silme veya tercih değiştirme eklenmedi. Önceki Tekke, yardım, viewport, kayıt/TTS, set, niyet ve güncelleme düzeltmeleri korunur.

## Doğrulama

84/84 regresyon grubu geçti; önceki 79 grup korunmuştur. Yeni dil grubunda 3029 kaynak ve 272 dinamik örnek doğrulandı. Gerçek üretim I18N, renderer ve model fonksiyonları kullanıldı; öneri sözlüğü enjekte edilmedi. Nefs UI 17/17, gerçek Nefs model 12/12 (9 profil ve 202 görüntülenen metin), runtime 10/10 kontrolleri geçti. Native metadata koruması ayrı grupta kontrol edilir.

272 JavaScript blok/dosyası parse edildi; 44 runtime hash/SRI, uygulama/SW/manifest r1000 eşliği ve 8 onaylı çark hash/alpha kontrolü geçti. ZIP CRC, tekil yollar ve 253 gerekli uygulama dosyasının byte eşliği doğrulanır. Nefs veri/model dosyaları ve Esmâ kaynak JSON'u r999 ile byte olarak eşittir.

Gerçek tarayıcı çizimi, fiziksel Android/Xiaomi, duyulan ses ve ekran kilidi testi NOT_RUN. Model kontrolleri cihaz testi olarak sunulmaz. Telefonda çizim ve native pencereler yükleme sonrasında kontrol edilmelidir.

Güncel kaynak index.html/nero.html, DOGRULAMA_r1000.json ve integration/r1000 altındadır. Önceki raporlar tarihsel arşivdir.
