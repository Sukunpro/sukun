# SÜKÛN r988

r987 tam paketinin üzerine hazırlanmıştır. Canlı siteye yayın yapılmadı.

- Performans profili kullanıcıya aittir. Uzun görev, kilit ekranı, azaltılmış hareket ayarındaki değişim veya tefekkür girişi otomatik olarak Pil modunu seçmez. Seçilmiş Pil modu korunur; gizli ekranın görsel işleri mevcut görünürlük kapılarında durur.
- Çarka dokunduktan sonra düğmede kalan pointer odağı dönüşü kilitlemez. Klavye odağı, çoklu dokunma, iptal, azaltılmış hareket ve açıkça seçilmiş tasarruf kuralları korunur.
- Tefekkürün koordinat alanı ilk yerleşimde tam görünüm genişliğidir. Normal okuma kaydırması bir kez saklanıp çıkışta geri gelir; gecikmiş eski giriş/çıkış işlemleri yeni yerleşimi değiştiremez.
- Tek native Tefekkürden çık düğmesi ana tefekkür alanının sağ üstüne taşındı. Kontroller kapalıyken de görünür. 48 px dokunma alanı, mor kristal yüzey ve yalnız SVG çıkış simgesi kullanır; erişilebilir adı korunur. Bu düğme sesi başlatmaz veya durdurmaz.
- Çarktan Sonraki/Önceki eski sesi temizleyip yeni seçimi sürdürür. Gezinme nedeni bütün autoStop sarmalayıcılarından taşınır; oturum sonu değerlendirme/kapat uyarısı yalnız gerçek bitişte kalır. Hızlı ardışık geçişte yalnız son seçim başlar. Daha yeni Duraklat/Bitir/seçim ve başarısız stop bariyeri eski yeniden başlatmayı engeller.
- Bilinen kendi kaydıyla tekil otomatik zikir ilk kelimeden itibaren hazırlanmış native dosyaya gider. Niyet adımı tamamlanmadan başlatılmaz. Eko, uzamsal etki, seçilmiş tesbih tıkı ve tekrar aralığı dosyada taşınır; görünürlük değişimi kaynak veya ses seviyesini değiştirmez. Tık anahtarı kapalıysa eklenmez; Tok, Klasik ve Kendi kaydım tercihleri korunur. Kilit dönüşünde geçmiş tıklar üretilmez.
- Tekke Kâbe dahil bütün adımları kayıtlı yönlendirmeler seri çözülerek tek 16 kHz stereo WAV dosyasına hazırlanır. Adımlar ve mevcut sessiz tefekkür araları bu dosyanın içinde ilerler. timeupdate yalnız ekrandaki metni günceller; sıradaki sesi başlatmaz. Duraklat/Devam et aynı dosya ve konumu kullanır. Bitir/yeniden başlat eski hazırlığı ve kayıt beklemelerini iptal eder. Native dosya hazırlama bellek sınırında sayılır.
- Eksik adım kaydı bulunan Tekke setlerinde mevcut kendi kayıt > cihaz sesi yedeği korunur. Bunların cihaz sesi ve JavaScript beklemeleri için kilit devamlılığı garanti edilmez; ekranda tam kayıt gereksinimi gösterilir. Bütçe/format hatası asıl kayıtları değiştirmez.
- Klasik/Feyz tercihi, özel erişim politikası, kişisel kayıt verileri, onaylı çark görselleri ve tempo tercihi korunur.

## Doğrulama

53/53 kontrol grubu geçti. Yeni akış için 19 üretim-kodu senaryosu; performans için 25 senaryo; native tık PCM seçimi, mono/stereo efekt-WAV byte eşliği, tek dosya adım sırası, sessiz aralar, blocked play, duraklat/devam, decode sırasında iptal ve ended temizliği kontrol edildi. Önceki içerik, sayaç, kayıt önceliği, sekmeler arası sahiplik ve çevrimdışı testler de geçti. Eski hata örnekleri gerçek önceki ZIP dosyalarından paket içi fixture olarak alınmıştır.

269 JavaScript blok/dosyası parse edildi. 39 runtime hash/SRI, build/manifest/SW eşliği, çevrimdışı worker bağlantıları ve 8 onaylı çark görseli doğrulandı. ZIP CRC ve bütün uygulama dosyalarının kaynakla byte eşliği paketlemede ayrıca kontrol edilir.

Kontroller üretim kodunun deterministik DOM/medya modelleri ve PCM dosya denetimleridir. Yeni sürümün gerçek tarayıcı çizimi, fiziksel Android/Xiaomi dokunması, duyulan ses/eko ve cihaz kilit ekranı denemesi yapılmadı. Bu sınırlamalar DOGRULAMA_r988.json içinde NOT_RUN olarak belirtilmiştir. Paket içindeki daha eski raporlar tarihsel arşivdir; güncel rapor bu dosyadır.
