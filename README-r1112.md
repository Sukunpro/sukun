# SÜKÛN r1112 — Kütüphaneden çalma ve hazır kart kaplaması

NeuroSync kütüphanesindeki sabit frekans satırları artık seçildiğinde ana
frekansı uygular ve mevcut `frToggle` üzerinden başlatır. Çalan frekansta
yeniden seçim aynı grafiği akort eder; ikinci NeuroSync sentezleyicisi açılmaz.
Frekans modu, ses düzeyi ve bağımsız ambiyanslar değiştirilmez. Genel
duraklatmada yalnız ayarlar uygulanır; Devam et açıkça kullanıcıya bırakılır.
Çok aşamalı yolculuklar kendi başlatma alanına yönlendirmeyi sürdürür.
Öneri kartları bu değişikliğin dışındadır ve ayar uygulama davranışını korur.

Frekansın AudioLife sarmalayıcısı, açık ve durdurulmamış arka plana frekans
eklerken yeni bir genel sözlü okuma niyeti üretmez. Böylece devam eden veya
hazırlanan okumanın `SukunVoiceAttempt` geçerliliği korunur. Önceki terminal
Durdur veya duraklatma sonrasında açık yeni başlangıç niyeti mevcut akışı
izler. Gecikmiş durum yayını, daha yeni Duraklat/Durdur niyetini geçersiz
kılamaz.

Berhetiyye seçiliyken Ambiyans bölümündeki hazır oturum kartları da mevcut
safir ve altın malzemesini kullanır. Kaplama yalnız mevcut kanonik tema
niteliğine bağlıdır; tema kilidi, seçim sahibi ve ses davranışı değiştirilmez.

G8 kapsamında `sukun-r990-tekke-set-style` gövdesinin 7.182 baytı aynı ID ve
sırayla `css/tekke-set-card-r1112.css` dosyasına taşınır. Görsel kaynak,
import, font dosyası veya CSS değişkeni içermez; Tekke olay kodu korunur.

Node fixture'ları kontrol yönlendirmesini, tekrar seçimde tek grafik
oluşmasını, gerçek AudioLife/VoiceAttempt koduyla niyet korumasını ve stil
taşımasının bayt eşitliğini denetler. Kontrollü FR ve DOM bağımlılıkları
duyulan ses, fiziksel Android, yerel tarayıcı otomatik çalma veya kilit
ekranı kabulü anlamına gelmez. Korumalı temanın native görünümü ayrıca
doğrulanmadığında açıkça belirtilir.
