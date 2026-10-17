# SÜKÛN

Zikir, Esmâü’l-Hüsnâ, Berhetiyye ve sûre takibi için web uygulaması.

[Uygulamayı aç](https://sukunpro.github.io/sukun/) · [Sürüm kimliği](version.txt) · [Sürüm notları](surumler.json)

## r1094 — ses kaynakları ve eksik kayıtlar

Kayıt Stüdyosu içindeki kaynak matrisi, zikir kataloğundaki her okuma ve desteklenen biçim için kişisel kayıt, jenerik arşiv ve cihaz sesi durumunu ayrı gösterir. Standart katalog 284 kanonik okuma ve 381 geçerli biçim içerir; bunların içinde 127 isim ve 224 geçerli isim biçimi vardır. Kullanıcının eklediği terkipler kapsamı değiştirebilir. Favoriler aynı kaynağı ikinci kez saymaz; bağımsız dua okuyucuları bu matrisin kapsamına dahil değildir.

Kişisel kayıt dosyası adedi, kapsanan okuma/isim ve kapsanan biçim adedi farklı ölçülerdir. Başka biçimdeki kayıt, eksik olan tam biçimi kapatmaz. Jenerik kullanım kapalıyken saklanan dosyanın varlığı ayrıca denetlenir. Okunamayan, çelişkili veya bozuk kayıt eksik sayılmaz. Denetim dosya varlığını ve jenerik bütünlüğünü inceler; kişisel sesin çözülebilirliğini, duyulan kaliteyi veya cihaz TTS’inin çevrimdışı çalışmasını garanti etmez.

Denetim açık düğmeyle çalışır. Eksik kişisel kayıt için stüdyoda ilgili hedef hazırlanabilir; mikrofon ayrıca kullanıcı komutuyla açılır. Arşiv kullanımı, çalan zikir, sayaçlar ve ses tercihleri denetim sırasında değiştirilmez. Kilitli kaynaklar başlık, anahtar ve sayılardan önce mevcut erişim kurallarıyla süzülür.

G4 kapsamı sabit r1094 kaynaklarında 166 kaynak test grubu, 1.403 bütünlük kontrolü ve 99 tam uygulama kontrolüyle doğrulandı. Küçük HTML fikstüründeki 19 kontrollü arayüz testi ayrıca sayılır. [r1094 doğrulama kaydı](tests/r1094/verification.json) ve [kapsam belgesi](tests/r1094/README.md), tamamlanan koşuları ve kabul sınırlarını içerir. Fiziksel Android ve gerçek mikrofon/ses kalitesi bu yerel testlerle doğrulanmış sayılmaz.

## r1093 — jenerik arşiv indirmesine devam

Jenerik ses arşivinden kategori seçilebilir. İndirme sırasında kayıt ve bayt ilerlemesi gösterilir; doğrulanmış parçalar ayrı bir geçici alanda tutulur. Yarım kalan hazırlıkta Sürdür seçildiğinde kayıtlar tekrar SHA-256 ile denetlenir, eksik veya bozulmuş parçalar yeniden indirilir.

Arşivi uygulamadan önce **Birleştir** veya **Yerine değiştir** seçilir. Birleştirmede aynı anahtarlı kayıtlar için mevcut kaydı tutma veya yeni kaydı kullanma tercihi vardır. Önizleme eklenecek, korunacak, değiştirilecek ve kaldırılacak görünür kayıtları gösterir. Son işlem, önizlemede okunan arşiv kimliği ve revizyonu hâlâ güncelse atomik olarak uygulanır; başka sekmenin daha yeni değişikliği sessizce ezilmez.

Hazırlama veya iptal, etkin arşivi ve kişisel ses kayıtlarını değiştirmez. Arşivi uygulamak jenerik sesi kendiliğinden etkinleştirmez; mevcut ses tercihi korunur. Kilitliyken özel kategoriler ve kayıtlar gösterilmez. Birleştirme mevcut gizli kayıtları korur; inceleme sayıları görünür kayıtlarla sınırlıdır.

İndirme hazırlığı **yedek veya geri yükleme noktası değildir**. Ayrı geçici IndexedDB alanı, doğrulanmış parçaları sürdürmek için kullanılır. Destekleyen güncel servis çalışanı, yalnız kesin arşiv adreslerine işaretli istekleri ağdan alır; bunları CacheStorage’a kopyalamaz ve ağ hatasında eski önbellek içeriğiyle tamamlamaz.

G3 kapsamı dondurulmuş r1093 kaynaklarıyla doğrulandı. [r1093 doğrulama kaydı](tests/r1093/verification.json), tamamlanan testleri, kaynak hash’lerini ve kabul sınırlarını içerir. [Test kapsamı ve çalıştırma](tests/r1093/README.md), kontrollü kaynak testlerini ve gerçek Chromium/servis çalışanı kanıtlarını ayırır. Fiziksel Android, ekran kilidi, duyulan ses ve gerçek cihaz kota davranışı bu yerel testlerle doğrulanmış sayılmaz.

## Önceki teknik not

r1069 niyet/esma geçişi açıklaması tarihsel başvuru olarak korunur: [Niyet geçişi](docs/INTENTION_TRANSITION_r1069.md) ve [r1069 testleri](tests/r1069/). Güncel sürüm veya canlı yayın sonucu bu tarihsel nottan çıkarılmamalıdır; canlı adresin `version.txt` yanıtı ve ilgili yayın doğrulaması kontrol edilir.
