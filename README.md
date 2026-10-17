# SÜKÛN

Zikir, Esmâü’l-Hüsnâ, Berhetiyye ve sûre takibi için web uygulaması.

[Uygulamayı aç](https://sukunpro.github.io/sukun/) · [Sürüm kimliği](version.txt) · [Sürüm notları](surumler.json)

## r1093 — jenerik arşiv indirmesine devam

Jenerik ses arşivinden kategori seçilebilir. İndirme sırasında kayıt ve bayt ilerlemesi gösterilir; doğrulanmış parçalar ayrı bir geçici alanda tutulur. Yarım kalan hazırlıkta Sürdür seçildiğinde kayıtlar tekrar SHA-256 ile denetlenir, eksik veya bozulmuş parçalar yeniden indirilir.

Arşivi uygulamadan önce **Birleştir** veya **Yerine değiştir** seçilir. Birleştirmede aynı anahtarlı kayıtlar için mevcut kaydı tutma veya yeni kaydı kullanma tercihi vardır. Önizleme eklenecek, korunacak, değiştirilecek ve kaldırılacak görünür kayıtları gösterir. Son işlem, önizlemede okunan arşiv kimliği ve revizyonu hâlâ güncelse atomik olarak uygulanır; başka sekmenin daha yeni değişikliği sessizce ezilmez.

Hazırlama veya iptal, etkin arşivi ve kişisel ses kayıtlarını değiştirmez. Arşivi uygulamak jenerik sesi kendiliğinden etkinleştirmez; mevcut ses tercihi korunur. Kilitliyken özel kategoriler ve kayıtlar gösterilmez. Birleştirme mevcut gizli kayıtları korur; inceleme sayıları görünür kayıtlarla sınırlıdır.

İndirme hazırlığı **yedek veya geri yükleme noktası değildir**. Ayrı geçici IndexedDB alanı, doğrulanmış parçaları sürdürmek için kullanılır. Destekleyen güncel servis çalışanı, yalnız kesin arşiv adreslerine işaretli istekleri ağdan alır; bunları CacheStorage’a kopyalamaz ve ağ hatasında eski önbellek içeriğiyle tamamlamaz.

G3 kapsamı dondurulmuş r1093 kaynaklarıyla doğrulandı. [r1093 doğrulama kaydı](tests/r1093/verification.json), tamamlanan testleri, kaynak hash’lerini ve kabul sınırlarını içerir. [Test kapsamı ve çalıştırma](tests/r1093/README.md), kontrollü kaynak testlerini ve gerçek Chromium/servis çalışanı kanıtlarını ayırır. Fiziksel Android, ekran kilidi, duyulan ses ve gerçek cihaz kota davranışı bu yerel testlerle doğrulanmış sayılmaz.

## Önceki teknik not

r1069 niyet/esma geçişi açıklaması tarihsel başvuru olarak korunur: [Niyet geçişi](docs/INTENTION_TRANSITION_r1069.md) ve [r1069 testleri](tests/r1069/). Güncel sürüm veya canlı yayın sonucu bu tarihsel nottan çıkarılmamalıdır; canlı adresin `version.txt` yanıtı ve ilgili yayın doğrulaması kontrol edilir.
