# SÜKÛN r914 — Görünüm ve sahne onarımı

Taban: kullanıcının sağladığı SUKUN_r913_BUILD_SCENE_UNITY_FULL.zip.

## Değişiklikler

- r913 son betiğinde gerçek satır sonu yerine yazılmış ters bölü + n karakterleri JavaScript sözdizimi hatasına neden oluyordu. İlgili blok düzeltildi; HTML arasındaki benzer metin artıkları temizlendi.
- Birbirini ezen eski önemli CSS kurallarından önce tanımlanan, yalnız onarılan bileşenleri kapsayan bir stil katmanı eklendi.
- Ortaları bozuk buton görselleri yerine pakette bulunan sağlam mücevher butonları kullanıldı. Düğme içindeki ek zeminler kaldırıldı, metin ve dokunma alanları düzenlendi.
- Berhetiyye çarkının merkezindeki görsel sembolün rakamı karıştırması, merkez metin yüzeyi ayrılarak giderildi. Çark görselinin özgün dosyası değiştirilmedi.
- Hedef/kalan kutularında ikon, başlık ve sayı çakışması kaldırıldı. Sayı ve başlıklar iki ayrı satıra alındı.
- Tekke kısayolu sabit örtü yerine belge akışına alındı; orijinal tıklama işleyicisi korundu. Üst sekmeler daraltıldı; gizli oynatıcıya dönüş düğmesine okunaklı kompakt zemin verildi.
- Okumalar/seyriler/araçlar kartları ve alt bilgi için kontrast artırıldı. Atlas başlığı küçük ekranlarda satır kırabilecek şekilde düzenlendi.
- Her tıklamada isim listesine sayfayı geri götüren genel tıklama dinleyicisi kaldırıldı. İsim rayının kaydırması yalnız yatay eksene sınırlandı.
- Sahne seçicinin çağırdığı eksik API tamamlandı. Altı kullanıcı seçimi yerel tercihe kaydediliyor; otomatik seçimde isim indeksi izleniyor. Son görsel katmanı tek bir değişkenden besleniyor; normal Esmâ ve ana ekran Berhetiyye sahnesi almıyor.
- r909 sayaç gözlemcisinde aynı metni yeniden yazıp kendi kendini tetikleyen döngüye karşı değişiklik kontrolü eklendi.
- Sağlanan kaynaklardan 8 sahne, normal zikir halkası ve 192/512 ikonlar eklendi. Eski kontrol görseli yollarının bir kısmı mevcut sağlam varlıklara yönlendirildi.
- HTML, manifest, SW, build ve güncelleme işaretleri r914'e eşitlendi. Eksik dosyaları indirmeye çalışan eski isteğe bağlı önbellek listesi paket içindeki gerçek dosyalardan oluşturuldu.

## Yapılan doğrulamalar

- 241 çalıştırılabilir satır içi JavaScript betiği ve SW sözdizimi kontrolünden geçti.
- index.html ve nero.html byte düzeyinde aynı; manifest ikonları ve önbellek dosyalarının yolları mevcut.
- Başsız Chromium, 390 × 844: Sade ve Klasik görünümde açılış ve Zikir ekranına geçiş; çalışma zamanı JavaScript hatası görülmedi.
- Zikir Ayarları gerçek tıklamayla açıldı/kapatıldı. +1: 0 → 1, −1: 1 → 0.
- İzole Berhetiyye bileşeninde 360/390/430 piksel: yatay taşma yok; düğmelerin en küçük yüksekliği 44 piksel.
- Sahne modülünün izole testinde altı farklı seçim, dosyalarının varlığı, geçersiz seçim koruması, normal kategoriye dönüş, Zikir dışındaki yüzey koruması ve otomatik isim değişimi doğrulandı. Kilitli bölümün erişim kuralları değiştirilmedi.

## Sınırlar ve kurulum

Bu bir onarım paketidir; eksiksiz eski görsel/kaynak arşivi değildir. r913 içinde özgün assets/sukun-nur-sanctuary-r757.png (Mevlevî ana sahnesi), bazı dekoratif SVG'ler ve eski tema varlıkları yoktu. Ana sahne yolu korundu: mevcut kurulumda dosya varsa aynen kullanılır; yoksa koyu renk geçişi görünür. Bu yüzden mevcut assets klasörünü silmeyin. Arşivi açıp mevcut site dosyalarının üzerine birleştirerek aktarın; eski assets içeriğini koruyun.

Kaynakta eski sürümlere ait pek çok modül ve dinleyici bulunuyor. Bu çalışma tüm ses motorunun yeniden yazımı veya tam regresyon sertifikası değildir. Gerçek Android kilit ekranı, kişisel ses kayıtları, arka plan ses/sayaç sürekliliği ve tam 28/99 seyir bitişi cihaz üzerinde test edilmedi. Canlı siteye yayın yapılmadı.

Eski sürüm raporları history klasörüne taşındı. Kullanıcı kayıtları, localStorage anahtarları ve IndexedDB verileri sıfırlanmaz.
