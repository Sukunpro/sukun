# r1012 yükleme ve kayıt kontrolü

ZIP'i çıkar. GITHUB_DOSYA_LISTESI_r1012.txt içindeki dosyaları mevcut GitHub Pages klasörüne aynı yollarla birlikte yükle. HTML dosyalarıyla birlikte assets/runtime klasörünü, sw.js ve sürüm/manifest dosyalarını da güncelle. Bu pakette sekme erişim betiği ve sistem raporu betiği değişti; yalnız HTML yüklemek yeterli değildir.

Uygulamadaki Güncelle kontrolünü kullan. Alt satırda **Uygulama r1012 · SW r1012** görünmeli. Adreste v=1012 yazması tek başına yeni sürümün kurulduğunu göstermez. Chrome site verilerini veya ses kayıtlarını temizleme.

1. Diğer SÜKÛN sekmelerini/pencerelerini kapat; uygulamayı güncelle.
2. **Araçlar → Kayıtlarım & Yedekleme** bölümünü aç. Liste açıldığında depoyu yeniden okur. Mevcut seslerden birini Dinle ile kontrol et. Depo okunamazsa bu artık silinme veya 0 kayıt olarak gösterilmez.
3. Otomatik akış için **Ses kaynağı → Kendi kayıt** seçili olsun. Yeni kayıt almak için mikrofon iznine izin ver; kısa bir kayıt alıp bitir ve dinle. İzin, bitiş ve depo hataları ayrı açıklanır.
4. Sorun devam ederse **Sistem raporunu indir** ile oluşan JSON'u konuşmaya ekle. Ses dosyaları, kayıt anahtarları ve ham hata mesajları bu tanı alanında bulunmaz; erişim yöntemi ve hata aşaması bulunur.

Telefondaki mevcut kayıtlar bu ortamdan değiştirilmedi veya silinmedi. Kullanıcının son düzeltmesine göre telefondaki kayıtlar duruyor. Uygulamadan erişilemiyorsa önce bu erişim/liste kontrolünü kullan; her güncellemede yeniden kayıt almak veya yedek yüklemek gerekmez.

Eksik kayıt varsa r1011'de eklenen **Eski yedekten eksik sesleri tamamla** seçeneği korunur. Önce güncel, ardından eski gerçek ses JSON'unu seç; cihazda bulunan aynı anahtarı bu seçenek değiştirmez. Kilitli bölümün kayıtları için bölümü önce aç.

tests_r1012 ve raporlar inceleme içindir. Fiziksel Android mikrofonu/ses çıkışı ve gerçek dokunmatik kaydırma ataleti burada ölçülmedi.
