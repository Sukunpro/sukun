# SÜKÛN r975 — kesintisiz ses ayarları ve sade sistem kontrolü

r974 tam paketi üzerine hazırlanmıştır. Onaylanan health tasarımı bu sürümde gerçek uygulamaya entegre edildi. GitHub'a yayın yapılmadı.

## Ses ayarı düzeltmeleri

Arapça hız/perde, Türkçe/Arapça cihaz sesi seçimi ve cinsiyet tercihi artık devam eden zikri duraklatmaz. Mevcut okuyuş kendi ayarıyla tamamlanır; tamamlanma sonucu bir kez sayılır. Yeni ayar sonraki okuyuşta kullanılır. Kendi kayıtlarınızın oynatma hızı veya hazırlanmış ses dosyası bu TTS ayarlarıyla yeniden kurulmaz.

Kilit ekranında yeni oluşturulan TTS kuyruğu güncel Arapça hız/perde ve seçili cihaz sesiyle hazırlanır. Önceden kuyruklanmış okuyuşlar kesilmez; yeni tercih sonraki kuyruğa uygulanır. Dar hız/perde sınırları kaldırıldı; geçerli ayarlar görünür ve gizli ekran arasında aynı kalır. Arapça hızın geçerli 0.45 değeri yeniden açılışta korunur.

Ana ses düzeyi değişiminde TTS okuyuşunu iptal edip gecikmeli tekrar başlatan yol kaldırıldı. Böylece bu ayardan sonra Duraklat/Bitir yapılınca eski okuyuş yeniden başlayamaz. TTS düzeyi sonraki okuyuşta kullanılır; kayıt ve Web Audio kendi canlı ses denetimini korur.

Okuyuş kaynağını değiştirme, Arapça kaynak aç/kapat ve ayrı bir sesi deneme işlemleri güvenli duraklatma yolunu korur. Kullanıcıya iki sesin üst üste gelmesini ve sayım eşleşmesinin bozulmasını önlemek için duraklatıldığı açıklanır. Hız/perde ayarıyla kaynak değişimi ayrı işler.

## Sistem kontrolü — uygulanmış arayüz

Araçlar içindeki Sistem kontrolü ekranı sade sonuç ve sonraki adımla açılır. Hızlı kontrol sesi başlatmaz, duraklatmaz, mikrofon açmaz veya sayıyı değiştirmez. Ayrıntılı dosya doğrulaması kullanıcı düğmesine bağlıdır. Sonuçlar beş açılır grupta gösterilir; cihazda duyulan ses ve kilit ekranı ayrıca kullanıcı denemesi gerektirir.

Yerel açıklama internet gerektirmez ve AI olarak sunulmaz. AI yorumu isteğe bağlıdır; internet ve ayarlanmış mevcut AI sağlayıcısı gerekir. Gönderilecek sınırlı teknik özet önce gösterilir, kullanıcı göndermeyi seçer. Kayıtlı sesler, zikir metni, kişisel kayıtlar ve API anahtarları bu özete dahil edilmez. AI'nin yorumu yeni test sonucu gibi sunulmaz; isteği iptal etme, bekleme sınırı ve eski sonucun yeni rapora yazılmasını engelleme vardır.

Adımlı cihaz denemelerinde kullanıcının beyanı otomatik ölçümlerden ayrı tutulur. Sorun işaretleme ve okunabilir TXT/teknik JSON rapor indirme vardır. Teknik geçmiş ve gelişmiş araçlar ayrı akordiyonda kalır.

İlerleme kaydı denetimi sade gruplara eklendi. Yeni/bilinmeyen denetim kodları görünmez kalmaz. Eşleşmediği doğrulanan dosya ile indirilemediği için doğrulanamayan dosya ayrılır; bağlantı veya süre aşımı tek başına bozuk dosya sonucu üretmez. Geçmiş donma/çökme ipuçları kesin kök neden olarak sunulmaz.

## İngilizce ve açıklama balonları

Yeni manuel dokunuş/ses/tık ayarları, hata mesajları, ses tercihleri ve sistem kontrolü için eksik İngilizce metinler tamamlandı. Açıklama balonları seçili dili kullanır. Dinamik metin ve erişilebilirlik etiketleri yeniden kullanıldığında dil değiştirmek eski etiketi geri getirmez. Kendi dilini üreten health ekranı genel çeviriciden ayrı tutulur ve dil değişiminde yeniden çizilir. Arapça zikir/dua metinleri değiştirilmez.

## Doğrulama

- 260 JavaScript kaynağının sözdizimi ve 30 runtime hash doğrulandı; HTML SRI ve index/nero byte eşitliği geçti.
- Üretim işlevlerini kullanan ses ayarı, sayım, manuel ses/geri bildirim, tık kaydı, oturum geri yükleme, terkip/vird, gezinme, SW ve asset regresyonları geçti. Kanıtlar integration/r975/evidence içindedir.
- Health ve dil/balon kontrolleri gerçek üretim kodunu kontrollü test ortamında çalıştırır; örnekleri gerçek telefon dinleme testi diye işaretlemez.
- 222 assets ve 8 kök uygulama dosyası pakette; ZIP CRC ve her gerekli dosyanın kaynakla byte eşitliği paketlenirken doğrulanır.

Fiziksel Android ve gerçek tarayıcı görsel çizim testi bu ortamda yapılmadı. Telefonda duyulan ses, titreşim ve kilit ekranı davranışını yeni adımlı cihaz denemeleriyle doğrulayın. Ani kapanmanın kesin kök nedeni belirlenmiş değildir. Paket web/PWA kaynaklarıdır; APK/AAB değildir. Eski rapor ve mockuplar arşivdir; bu sürümün güncel açıklaması RAPOR_r975.md'dir.
