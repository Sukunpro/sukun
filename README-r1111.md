# SÜKÛN r1111 — CSS kaynak denetimi ve bildirim stilleri

G8, ortak stil kurallarını küçük adımlarla ayırarak devam ediyor. Bildirim
merkezi ve oynatıcı bildirim çekmecesinin 4.990 baytlık stil gövdesi,
`css/notification-layout-r1111.css` dosyasına aynı ID ve yükleme sırasıyla
taşındı. Bildirim olayları, filtreler, sürükleme ve ses sahipleri değişmez.

Önceki logo düzeltmesindeki göreli görsel yolu hatasını yayın öncesinde
yakalamak için `tools/css-assets.cjs` eklendi. Denetim salt okunurdur ve ağ
isteği yapmaz. Giriş HTML'inin bağladığı harici CSS dosyalarını ve bunların
yerel importlarını inceler; bulduğu somut yerel kaynakların hem dosya
sisteminde hem dağıtım envanterinde bulunmasını ister. CSS kaçışları,
sorgu/fragment bölümleri, import döngüleri ve gerçek dosya yolu sınırı
kontrol edilir.

Tek ve koşulsuz `:root` değerinden çözülebilen görsel değişkenleri, değerin
kullanıldığı CSS dosyasına göre çözülür. Böylece başka klasörden devralınan
bir görsel URL'sinin yanlış konuma gitmesi denetlenebilir. Koşullu, kapsamlı,
çakışan veya çalışma zamanında sağlanan değişkenler eksik dosya sayılmaz;
çözülemeyen başvurular olarak ayrıca raporlanır. Bu araç tam bir CSS cascade
veya tarayıcı çizim motoru değildir. Satır içi ve JavaScript'in ürettiği
stiller ile uzak kaynaklar bu ilk kapsamın dışındadır.

`tools/release-integrity.cjs` bu denetimi sürüm bütünlüğüne katar.
`tools/release_finalize.py`, yeni metadata dosyalarını yazmadan önce ve
yalnız ZIP hazırlarken aynı denetimi uygular. Somut eksik veya paket dışı
kaynakta işlem durur; bu kontrol için Node.js gereklidir. Hata halinde eski
metadata dosyalarının değişmediği ve yeni ZIP oluşmadığı küçük gerçek sürüm
fixture'larıyla sınanır.

G8'in önceki iki taşıması kategori akışı ve ortak yardım kurallarıdır. Görsel
alias dosyaları ve geçmiş sürümlerin geri dönüş varlıkları bu adımda silinmez.
Fiziksel Android, kilit ekranı, duyulur ses ve dar ekran native kabulü,
statik kaynak denetiminden ayrı değerlendirilir.
