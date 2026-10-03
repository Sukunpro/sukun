# SÜKÛN r994

r993 tam uygulaması üzerine Tekke ekran sığdırma, Mihrap erişimi ve Berhetiyye güncelleme görünümü düzeltmeleri uygulandı. Canlı siteye yayın yapılmadı.

## Yerleşim

Eski tam ekran kuralında 100dvh yüksekliğe rağmen min-height:100vh bulunuyordu. Mobil tarayıcı çubukları açıkken daha büyük minimum yükseklik, alt oynatma panelini görünür alanın dışına taşıyabiliyordu. Tekke artık görünür viewport yüksekliğini kullanır; eski minimum kaldırıldı. Destekleyen tarayıcıda visualViewport, diğerlerinde innerHeight alınır. Boyut ve yön değişiminde yalnız yerleşim güncellenir; ses, tempo veya set ilerlemesi değiştirilmez. Değer değişmediyse tekrar stil yazılmaz.

Üst çubuk, durum satırı, kaydırılabilir sahne ve alt oynatma kontrolleri ayrı grid satırlarıdır. Duraklat/Devam et, Bitir ve Ses düğmeleri sahnenin üstüne yerleştirilmiş mutlak bir katman değildir. Uzun içerik sahne içinde kaydırılır. Çok kısa yatay ekranlarda yardımcı açıklamalar daraltılır, temel düğmeler en az 44px kalır; gerekirse kontrol alanı da kaydırılır. Nefes halkası ve Hû ekran yüksekliğine göre ölçeklenir. Sayaç ve açıklama metni korunur.

SÜKÛN'a dönüş düğmesinin eski sabit konumu kaldırıldı; düğme üst çubuktadır. Mihrap adıyla görünür bir üst kontrol vardır. İlk girişte ayar düğmesi Başlat'ın altından üst çubuğa taşındı. İlk girişte alttaki sahnenin Hû, sayaç ve açıklama yazıları görünmez; seçimi okumayı zorlaştıran arka yazı çakışması kaldırıldı. Amaç kartları daha kısa. Aktif sette ayrıntı kartı sahnenin normal akışına taşındı; eski, ekran yüksekliğinden 410px çıkaran sınırlama burada uygulanmaz. Girişte ikinci bir set kartı hâlâ gösterilmez.

Mihrap panelinin üst başlığı ve kapatma düğmesi kaydırma sırasında erişilebilir. Sekmeler ve Tamam düğmesi korunur. Panelin kapalı/açık kayma davranışı değişmez. Orijinal kayıt/ses kontrol düğümleri ve bağlı işleyiciler korunur. Mihrap açma, kart daraltma ve ekran döndürme sesi kendiliğinden başlatıp durdurmaz.

## Berhetiyye güncelleme görünümü

Güncelleme paneli ve bildirim çerçevesi mevcut Berhetiyye altın işlemeli panel ailesini kullanır. Eylem düğmesi turuncu topaz görselini doldurmalı dokuz parçalı çerçeve olarak kullanır; yalnız düz turuncu iç yüzey değildir. Yazı açık renkli ve gölgelidir. Bildirimde uzun metin/düğmeler satıra geçebilir; kapatma alanı en az 44px. Stil yalnız aktif Berhetiyye teması ve görünür Berhetiyye uygulama düğümü durumunda uygulanır; Esmâ, Mevlevi ve Feyz görünümüne taşmaz. Görsel varlıklar değiştirilmedi; çarklar ve ses motorları byte olarak korunur.

0,6 sn minimum, 1 sn ilk kullanım temposu; kullanıcının geçerli seçimi, kendi kayıt önceliği, kurtarma, kayıt rehberi, adım geçişi, çevrimdışı hazırlık, kişisel düzenler ve notlar korunur.

## Doğrulama

68/68 otomatik kontrol grubu geçti. Yeni 9 üretim DOM/viewport senaryosu: görünür yükseklik, eski cihaz fallback'i, yön değişimi, üst Mihrap, orijinal düğümlerin taşınması, tek kontrol ve ses komutu göndermeyen yeniden boyutlandırma. Yeni 26 CSS kaskadı kontrolü: eski 100vh minimum/sabit dönüş kuralının tekrarlanması ve yeni kuralın kazanması; kaydırılabilir sahne, alt kontrol satırı, girişte arka metin görünmezliği, panel animasyonu/erişimi ve tema dışına taşmayan topaz görünüm.

272 JavaScript blok/dosyası parse edildi. 44 zorunlu runtime varlığının SHA-256 ve SRI eşliği, r994 uygulama/SW/manifest kimliği, çevrimdışı dosya listesi ve geçmiş çark görsellerinin hashleri doğrulandı. Tam paketin CRC, tekil yollar ve gereken uygulama dosyalarının byte eşliği doğrulanır.

Bu kontroller deterministik DOM, CSS kaskadı, medya, TTS, mikrofon, saat ve önbellek modelleridir. Yerel dosyanın cloud tarayıcıda açılması URL güvenlik politikasıyla engellendi; gerçek tarayıcı çizimi ve fiziksel Android/Xiaomi, duyulan ses, kilit ekranı bu ortamda doğrulanmadı. DOGRULAMA_r994.json bu kontrolleri NOT_RUN olarak gösterir. Telefonda dar/kısa ekran, yatay ekran, Chrome çubuğu açık/kapalı, Türkçe/İngilizce, set ve zikir, Mihrap kaydırma testi gerekir. Tarihsel raporlar arşivdir; güncel rapor bu dosyadır.
