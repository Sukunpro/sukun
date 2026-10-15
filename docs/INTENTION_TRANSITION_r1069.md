# SÜKÛN r1069 — Niyet ve esma geçişi

r1068 kayıtlı otomatik zikrin native döngüsü, hazırlanan sonraki esma sesini doğrudan kabul ediyor; zAutoKur da kayıtlı native oturum var diye niyet kapısından önce dönüyordu. Tam uygulama testinde ilk niyet kaydı bitse de sonraki isimlerde niyet atlandı. Kontrollü gerçek üretim sayaç testinde, devam eden niyet sırasında sonraki sesin örneklenmiş medya saati yeni esmaya sayı yazabiliyordu.

Yeni sınır sırası, önce tamamlanmış tekrarın sayısını bir kez işler, sonra yalnız çıkan tekil zikir döngüsünü ve ritmini emekliye ayırır. Hazır ses ve hazırlık işi korunur. Aynı niyet kapısı gerçek kayıt/konuşma tamamlanıncaya kadar beklenir; sonraki ses bundan sonra kabul edilir. Aynı ismin her devirde niyet tercihi de bu sırayı kullanır. Doğrudan hazırlanmış kaynak kabulü niyet beklerken/çalarken engellenir.

Niyet kaydının baş/son kırpma koordinatları sıfırlanır; normalizasyon, yankı ve diğer efektler korunur. Bu, kalite analizi önerisinin kaydın bir bölümünü atlamasını engeller. Diğer zikir kayıtlarının kırpma politikası değişmez.

Kişisel kayıt veritabanı, jenerik kaynak sırası, altı gömülü MP3, Yâsîn zamanlaması ve arka plan ambiyans/frekans motoru değiştirilmez. Duraklat/Bitir normal hazırlık iptalini korur; niyet geçişindeki hazırlık koruma yalnız iç sınır için seçilir.

Doğrulama sonuçları:

- Yeni üretim fonksiyonu entegrasyonu 29/29 geçti. Yayındaki değişmemiş r1068 karşılaştırması 16/29 ile 13 hatayı gösterdi. Tam niyet bitmeden yeni kaynağın kabulü/sayılması, görünür/gizli native geçiş, aynı isimde devir tercihi, kendi kapısını açan native başlangıç ve gecikmiş iptal sonuçları kapsanır.
- Mevcut ilgili ses/sayaç testleri 131/131 geçti: Pause/Resume 49, niyet kaynak politikası 17, tekil native duraklatma 30, medya saati otoritesi 17 ve ses seviyesi 18.
- Tam uygulama Chromium native entegrasyonu 11/11 geçti. Gerçek kalite işçisi, 3 saniyelik bilinen test WAV’ında yaklaşık 0,595 saniye baş ve 0,660 saniye son kırpması önerdi. r1068 gerçek medya elemanı başı atlayıp doğal ended olmadan trim-ended döndürüyordu. r1069 aynı kaydı sıfırdan doğal ended (3,000 saniye) olayına kadar çaldı; ilk ve sonraki niyetlerde pozitif seek yoktu. Normalizasyon katsayısı 1,42 korundu.
- Native uygulama testinde sonraki esma sesi/tekrar kredisi niyetin doğal bitişini bekledi, iki esma yalnız iki kredi aldı, TTS’ye düşülmedi, Bitir bekleyen niyeti emekliye ayırdı. Sunulan HTML/runtime/SRI baytları son kaynakla eşleşti; uygulama/istek hatası oluşmadı.
- Kapının kendi çıkan sesini durdurması eşzamanlı emekliye ayırma sayacıyla tanınır; sonraki Pause/Stop/yeniden başlatma ve sekme sahipliği değişimleri yine eski işi reddeder. İptal edilmiş aynı isimli eski kapı, daha yeni bir kapının bitişini ödünç alamaz.

Son raporlar `tests/r1069/evidence/` altında saklanır.

Test kapsamı gerçek Chromium HTMLMediaElement saati ve doğal ended olayları ile kontrollü konuşma/işletim sistemi/medya olay düzeneğini ayırır. Fiziksel Android kilidi veya kullanıcıya ait ses kaydının işitsel sonucu bu oturumda test edilmez.
