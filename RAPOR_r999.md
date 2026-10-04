# SÜKÛN r999

r998 tam paketinin İngilizce arayüz eksikleri tamamlandı. Eng'de Ebced artık Abjad olarak gösterilir. Türkçe'de Ebced kalır. Canlı siteye yayın yapılmadı.

## Çeviri kapsamı

1101 sözlük girdisi eklendi veya tamamlandı. Hedef/sayım seçenekleri (Free, Manual, Calculate, Custom Target), açık/kapalı durumları, akıcı/hızlı seçenekleri, kayıt/favori düğmeleri, güncelleme ve sürüm durumları, bildirim menüleri/işlemleri, seyir başlıkları ve ambiyans isimleri/açıklamaları Eng'de çevrilir. Sayı, seçili isim, gün ve cihaz sesiyle oluşturulan metinler kaynak şablonları üzerinden çevrilir; sayılar ve isimler korunur. Cihazın verdiği gerçek ses adı değiştirilmez; cinsiyet bilgisi ve açıklamalar çevrilir. Arapça ibareler ve zikir okunuşları korunur.

99 Esmâ kaynak kartının sekiz alanı, toplam 792 alan çevrildi: anlam, mahiyet, ayet meali, hadis aktarımı, Peygamberimizdeki tecelli, kâinattaki tecelli, tecelli olmasaydı ve gölge açıklaması. Çeviriler uygulamadaki kaynak metnin karşılığıdır; yeni bir kaynak doğrulaması veya dinî hüküm değildir. Arapça metin, isim kimlikleri, tevhid zikri ve özgün Türkçe kaynak JSON'u byte olarak korunur. Kaynak atıfları muhafaza edildi; atıflardaki bağlam/aktarım nitelemeleri çevrildi.

Bildirimler özgün metniyle depolanmaya devam eder; görüntüsü çevrilir. Dil değişince tarih gösterimi yeniden çizilir. Kendi yazdığın özel ambiyans adları, form değerleri ve kayıt kimlikleri çevrilmez. Kayıt etiketini CSS üreten iki tema ile seans oluşturucunun CSS açıklamaları için dil kapsamlı İngilizce kuralları eklendi.

## Kararlılık ve korunmuş işlevler

Tekrar çizilen arayüz metinleri çevrilmiş sonuçla karşılaştırılır ve özgün Türkçe kaynağı hatırlar. Eng → Türkçe → Eng geçişi son durum metnini doğru geri getirir. Ambiyans fark rozetleri çeviri gözlemcisiyle yarışıp sürekli mutasyon üretmez. Bildirim tarih önbelleği dili hesaba katar. Dil değiştirmek ses başlatmaz, sayaç artırmaz, seçimi, kayıtları veya tempoyu değiştirmez.

Önceki yardım/viewport/dokunma, Tekke, kayıt/TTS/set akışı, kilit ekranı eko seviyesi, niyet geçişi ve güncelleme düzeltmeleri korunur. IndexedDB şeması ve ses/tema varlıkları değiştirilmedi. Assets içindeki tek değişiklik offline-scenes sürüm sorgusunun r999 olmasıdır.

## Doğrulama

79/79 regresyon grubu geçti: önceki 78 grup ve yeni 23 senaryolu dil tamamlama grubu. Yeni grup gerçek üretim I18N, cihaz sesi seçenekleri, ambiyans rozeti ve bildirim kartı fonksiyonlarını deterministik DOM modelinde çalıştırır. 1101 sözlük girdisi, 792 kaynak alanı, kaynak JSON eşliği, dinamik sayılar/günler/sürümler, kullanıcı değerleri, dil dönüşleri ve tekrarlanan yazımlar denendi.

272 JavaScript blok/dosyası parse edildi; 44 runtime hash/SRI, uygulama/SW/manifest r999 eşliği ve 8 onaylı çark hash/alpha kontrolü geçti. ZIP CRC, tekil yollar ve 253 gerekli uygulama dosyasının byte eşliği paketlemede doğrulanır.

Gerçek tarayıcı çizimi, fiziksel Android/Xiaomi, duyulan ses ve ekran kilidi testi NOT_RUN. Uzun İngilizce metinlerin telefondaki çizimi ve native menüler yükleme sonrasında ayrıca kontrol edilmelidir. Testler gerçek cihazda sonuç alınmış gibi sunulmaz.

Güncel kaynak index.html/nero.html, DOGRULAMA_r999.json ve integration/r999 altındadır. Önceki raporlar tarihsel arşivdir. Yükleme için GITHUB_YUKLEME_r999.md kullanılır.
