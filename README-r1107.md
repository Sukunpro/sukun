# SÜKÛN r1107 — Hazır Setler akordiyonu ve ses depoları

Hazır Setler başlığı, filtreleri, iç kategorileri ve kişisel setleri tek bir
yerel details/summary akordiyonunda toplar. Açık/kapalı tercihi ayrı bir arayüz
anahtarıyla hatırlanır. İç kategori ve filtre seçimleri korunur; açma/kapama ses
komutu göndermez. Açık kategori gövdesi, kapalı üst bölümde ölçülen küçük bir
yükseklikte sıkışmaz. Yardım düğmesi klavyeyle erişilebilir ve başlığı kapatmaz.

Geliştirme planındaki G6 için Sistem kontrolü bölümüne Ses depoları kartı
eklendi. Yalnız Depoları denetle düğmesiyle kişisel zikir/okuma kayıtları,
kendi ambiyansları, erişilebilir jenerik arşiv ve kurtarma kopyaları incelenir.
Gerçek Blob.size toplamları kullanılır. Kurtarma noktaları içindeki aynı sesin
tekrarları ayrı kopya olarak sayılır; ayar ve dizin yükü ses boyutuna katılmaz.
Tarayıcı alan tahmini ayrıca ve yaklaşık olarak gösterilir.

Denetim salt okunurdur: ses içeriğini okumaz, çözmez veya hash taramaz; kayıt
yazmaz, arşivi açmaz ve yedek oluşturmaz. Kaynaklar sırayla kendi salt okunur
işlemlerinde gözlenir; bu, ortak bir işlem anında alınmış yedek değildir.
Okunamayan, bulunamayan veya sınırı aşan depo sıfır gibi gösterilmez. Yenileme,
kapanma ve erişim değişiminde iptal ve eski sonuç korumaları geçerlidir.

G6 tamamlandı. Planın sıradaki maddesi G7: Kandil için kalıcı Kapalı / 1 dk /
5 dk tercihleri ve ilk kullanım turunu bölmeme.
