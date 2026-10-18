# SÜKÛN r1108 — Kandil tercihi ve görünüm bağlamı

G7, önceki sürümde tamamlanan G6 ses deposu kartını izler. Tema ve genel
ayarlardaki Pil & Ekran alanına tek bir Kandil görünümü tercihi eklendi:
Kapalı, 1 dakika veya 5 dakika. Mevcut varsayılan 1 dakika korunur. Tercih bu
tarayıcıya aittir; saklama başarısızsa yalnız bu açılışta geçerli olduğu yazılır.

Kandil tek zamanlayıcı ve mevcut tek sahibiyle çalışır. Etkin ses/okuma,
zikir, tefekkür, açık pencere ve kullanım turu korumaları korunur veya
tamamlanır. Hızlı tur açma/kapama için nesil koruması, eski beklemeler için
iptal koruması vardır. Ses motoru, sayaç, kayıt veya ekran kilidi değiştirilmez.
Kandil, telefonun işletim sistemi ekran kilidi değildir.

Görünümün açık adı ve gerçek bir dönüş düğmesi vardır. İlk dönüş dokunuşu
veya tuş dizisi arkadaki kontrolü çalıştırmaz; tuş tekrarları ve tuş bırakma
da aynı dönüş hareketine dahildir. Uygunsa önceki odak kaydırmadan geri gelir.

Görünüm gözlemi açılış, ön plan, gerçek dönüş ve elle istenen denetimi ayırır.
Görünür DOM üzerinde açılışta geciken çizim karesi, doğrulanmış çizim sayılmaz;
aynı zamanda gerçek dönüş hatası diye uyarı veya yeniden kurma üretmez.
Gerçek görünmez arayüz ve dönüş kurtarma korumaları sürer. Sistem kontrolü,
bu bağlamı ve doğrulanmamış çizim durumunu Türkçe/İngilizce doğru açıklar.

G7 tamamlandı. Sıradaki G8, görsel referans/alias haritasıyla başlayıp küçük,
geri alınabilir ortak modül taşımalarıyla devam edecek. Fiziksel Android kilit,
mikrofon ve duyulan ses kabulü tarayıcı fixture sonuçlarından ayrı tutulur.
