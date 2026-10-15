# SÜKÛN r1068 — Yâsîn âyet seçimi

Otomatik Arapça ses seçimi geçerli 83 âyetin metin seçicisini devre dışı bırakıyordu. Yerel menü açık kaldığında seçimin doğrudan scrollIntoView çağrısı da geçici kullanıcı niyeti süresi dolduğu için engellenebiliyordu.

Seçici artık geçerli metin varsa her ses kaynağında kullanılabilir. Seçilen değer kullanıcıya aittir; sesin ilerleyen âyeti çerçeve ve Okunan âyete git denetimiyle ayrı izlenir. Yerel menünün change ardından ürettiği aynı denetime ait click olayı bir sonraki çizime kadar tamamlanır; bu arada başlayan yeni dokunuş, tuş veya kaydırma isteği seçimi iptal eder. Ardından seçilen âyet ortak açık navigasyon yoluyla gösterilir. Gizlenen sayfa, kaybolan odak ve eskimiş seçimler bekleyen geçişi emekliye ayırır. Menü 44 px dokunma yüksekliğine sahiptir.

Gömülü kayıt tam sûre olarak baştan çalar. Cihaz sesi ve meal başlangıç âyetini kullanır. Ses motoru, kayıtlar, öncelik ve 83 zaman sınırı değiştirilmedi.

Doğrulama:

- Yeni yerel menü testleri 20/20 geçti: 320×640 ve 390×844 Chromium mobil görünümünde gerçek dokunmayla açılan menünün `:open` durumu, güvenilir seçim olayları, dört kaynak/içerik bileşimi, uzun süre açık menü, İngilizce görünüm, kaydırmadan sonraki ilk dokunuş ve seçimin korunması doğrulandı. Gerçek gömülü MP3 saati menü açıkken 12. âyetten 13. âyete geçti; 63. âyet metin seçimi sesi sarmadan korundu.
- Sonraki dokunmanın bekleyen geçişi iptal ettiği tarayıcı vakasında yalnız native onchange tarafından istenen ilk çizim kontrollü bekletildi. Menü ve sonraki sayfa kaydırması gerçek, güvenilir tarayıcı girdileridir. Bu zamanlama düzeneği raporda açıkça belirtilir.
- Önceki değişmemiş okuyucu/çerçeve tarayıcı paketi 41/41 geçti; test edilen 68 HTML/runtime/medya dosyasının baytları güncel kaynakla eşleşti, uygulama veya istek hatası oluşmadı.
- Tam üretim fonksiyonuyla kontrollü olay/çizim yaşam döngüsü 23/23, ortak navigasyon 10/10, okuyucu ilerleme 21/21 ve kaydırma yaşam döngüsü 41/41 geçti.
- r1067 karşılaştırma paketi 4/4 beklenen eski hatayı doğruladı. Eski otomatik Arapça modunda seçici devre dışıydı; uzun açık menünün seçimi de görünür âyete geçmiyordu.

Bunlar Linux Chromium 142 üzerinde mobil görünüm ve gerçek CDP dokunma testleridir. Fiziksel Android cihazının işletim sistemi menüsü bu oturumda test edilmedi. Cihaz konuşma sesleri kontrollü test düzeneğidir; gömülü MP3 tam üretim dosyasıyla gerçek HTMLMediaElement üzerinde çalındı. Son raporlar `tests/r1068/evidence/` altında saklanır.
