# SÜKÛN

Zikir, Esmâü’l-Hüsnâ, Berhetiyye ve sûre takibi için web uygulaması.

[Uygulamayı aç](https://sukunpro.github.io/sukun/) · [Sürüm kimliği](version.txt) · [Sürüm notları](surumler.json)

## r1242 — kompakt kontroller ve sakin tefekkür

Berhetiyye'nin taşlı görünümü korunur. Kolay kontroller gizlenince 24px göz simgesi ve 44px dokunma alanı kalır. Başlat/Duraklat, Bitir ve Seyri baştan başlat düğmeleri içerik genişliğine küçülür.

Tefekkürde gerçek zikir başladıktan 10 saniye sonra Ayarlar ve görünüm ile toplam zikir/ses kaynağı/tempo çubuğu gizlenir. Zikir sürerken yaklaşık her 10 dakikada 5 saniye görünür. Gözle geri açıldığında veya kullanıcı ayarları düzenlerken açık kalır. Duraklatma, bitiş, seçim değişikliği ve tefekkürden çıkış süreyi temizleyip görünümü geri getirir; yeniden başlatma yeni süre başlatır. Normal zikir ekranında otomatik gizleme yoktur.

[Regresyon testleri](tests/r1242/) kontrollü saatle zamanlayıcı yaşam döngüsünü; native Chromium ile mobil/masaüstü, Türkçe/İngilizce, normal/tefekkür, göz, klavye, yüksek kontrast, gerçek oynatma ve yeniden yüklemeyi kapsar. Geçerli kabul, bu commit üzerinde çalışan Actions sonuçlarıdır. Fiziksel telefon veya duyulan ses testi değildir.

## r1241 — gezinme, okunurluk ve güvenli kayıt

Okumalar açıldığında başlık ve etkin menü artık okunan bölümü izler. İlerleme olmayan ilk açılış ile yarım kalan seyir ayrılır. Mevcut temalar ve cam görünümü korunur; metin arkasındaki yüzey koyulaştırılır, bulanıklık artırılmaz. Okuma sırası ve çark kontrolleri Türkçe ve İngilizce açıklanır.

Frekans setleri tek bir IndexedDB işlemi içinde okunup güncellenir. Farklı kayıtların değişiklikleri birleştirilir; aynı kayıt üzerindeki bayat düzenleme veya silme işlemi reddedilir ve taslak korunur. Eski localStorage kopyasına dokunulmaz. Güncel yedekler yeni asıl depoyu kullanır; depoya erişilemiyorsa eksik yedek üretilmez. Kişisel ses kayıtlarının deposu değiştirilmez.

Eski sürüm açık sekmelerini yenileyin. Eski sürüm ayrı kopyayı değiştirirse iki kopya da korunur ve çakışma çözülene kadar yazma kapanır. “Çakışan kopyaları indir” iki kopyayı karşılaştırma dosyası olarak alır; bu işlem hiçbir kaydı değiştirmez veya otomatik uzlaştırmaz. r1240 veya daha eski sürüme geri dönüldüğünde yalnız geçiş öncesi frekans setleri görünür; r1241’de eklenenler silinmez, güncel sürüme dönünce tekrar erişilir. Atomik depo desteklenmiyorsa okunabilir eski kayıtlar korunur ve yazma kapalıdır.

Ölçümde giriş sesinin preload ve fetch adreslerindeki sürüm farkı bulundu. Doğrulanmış aynı kaynak adresi yeniden kullanılır; sesin zamanlaması, sahipliği ve içerik hash kontrolü değişmez. Üç koşuluk headless ölçümler genel hızlanma veya telefon performansı garantisi değildir.

Güncel kanıt, bu commit için çalışan **Required current-release source-bound checks** ve **r1241 usability, concurrent saves and measured startup** Actions sonuçlarıdır. Tarihsel test dosyaları yeni yayının başarılı olduğunu göstermez. Yeni testler [tests/r1241](tests/r1241/), tekrarlanabilir başlangıç ölçümü [tests/performance](tests/performance/) altındadır. Ölçümler Linux Chromium/yerel HTTP içindir; gerçek telefon açılış süresi veya INP değildir.

[Fiziksel cihaz kabul matrisi](docs/r1241-audio-offline-acceptance.md): Android/iPhone ekran kilidi, telefon araması, Bluetooth ve duyulan ses testleri henüz tamamlanmış sayılmaz. Otomatik tarayıcı testlerinin ve test ortamı sınırlarının kapsamı burada açıkça ayrılır. Canlı sürümü yukarıdaki sürüm kimliğinden kontrol edin.

## r1120 — frekans araçları ve kişisel setler

Frekans bölümünde dalga tipi, sol/sağ kanal seviyesi, ek gürültü, filtreler ve oktav düğmeleri ortak ses motoruna bağlıdır. Harmonikler, 3B ses ve mevcut bant/Hz kısayolları Mini/Midi/Pro görünümlerinde erişilebilir. “Şu anki ayarlardan set oluştur” ile mikrofonsuz bir ayarı adlandırıp kaydedebilir; düzenleyebilir, yükleyebilir, çoğaltabilir veya onayla silebilirsin. Eski kişisel/mikrofon kayıtları ayrı tutulur.

Mevcut ses seviyesi varsayılan olarak korunur. “Daha belirgin” profili yalnız açık seçimle kullanılır; hedef kazanç en fazla 2×, yoğun katmanlarda daha düşüktür. Ana ses ve cihaz sesi de sonucu etkiler. Bu dijital ölçüm, akustik ses düzeyi veya işitme güvenliği garantisi değildir.

Süreli/değişken frekanslar canlı ses yolunu kullanır; ekran kilidinde süreklilik cihaz desteğine bağlıdır. Genel duraklatma, süre bitişi ve yeni ayarın eski yolculuğu/taramayı devralması ayrı test edilir. Eski hızlı flaş yerine ses frekansından bağımsız sabit ışık vardır; varsayılan kapalıdır ve kayıt yüklenince kendiliğinden açılmaz.

r1120 tarihsel notu: bu sürümde eşzamanlı iki sekme yazması atomik değildi. r1241 güncel sekmeler için bu yolu atomik IndexedDB işlemi ve kayıt bazlı revizyon denetimiyle değiştirir. Bozuk/yeni biçimli verinin korunması devam eder.

[Doğrulama kaydı](tests/r1120/verification.json), [test kapsamı](tests/r1120/README.md) ve [bağımsız kaynak incelemesi](tests/r1120/review.json) kesin kaynak/test hash’lerini ve kabul sınırlarını içerir. Fiziksel Android/PWA, Bluetooth, ekran kilidi ve duyulan ses testleri ayrıca açık kalır. Canlı sürüm için yukarıdaki sürüm kimliği bağlantısını kullan; tarihsel test belgeleri yayın durumunun kanıtı değildir.

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
