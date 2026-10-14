# SÜKÛN r1065 — gömülü Arapça ve güvenli kayıt akışı

r1064’te özgün Arapça tercihi tüm eski zikir/kayıt yollarına uygulanabiliyor, dili tanımlanmamış kayıtları bloke ediyor ve olmayan cihaz sesine bağımlılık oluşturuyordu. Okuyucu tercihi eski otomatik yollardan ayrıldı; mevcut kullanıcı kayıtları yeniden sınıflandırılmaz ve kayıt depolarına gömülü sesler yazılmaz.

## Davranış

Okumalardaki Otomatik dinle ve eski okuyucu düğmeleri: gömülü Arapça → jenerik → kendi kayıt. Gömülü kayıt olmayan eski okuyucular mevcut bölüm zincirini korur. Ana zikirde kullanıcının kendi kaydı önceliği korunur. Arapça cihaz sesi açık bir seçimdir. Arapça dinle / Türkçe anlamı dinle açık içerik seçimlerinde bilinmeyen bir eski kayıt başka dildeymiş gibi sunulmaz; otomatik düğme ile eski kayıt kullanılabilir.

Gömülü altı ses: Yâsîn 36:1–83, Fâtiha 1:1–7, Âyetel Kürsî 2:255, İhlâs 112:1–4, Felâk 113:1–5, Nâs 114:1–6. Kaynak: Aaqib Azeez (Atcovi), Wikimedia Commons. Dört CC0, Kürsî ve İhlâs CC BY-SA 4.0. Orijinal MP3 baytları değiştirilmemiştir. Kaynak, atıf, lisans ve SHA-256 `arabic-audio-manifest-r1065.json` ile `assets/audio/arabic-r1065/LICENSES.txt` içindedir; arayüz kaynak panelinde de gösterilir. Commons dosya SHA-1 değerleri indirmeyle karşılaştırıldı ve altı dosya ffmpeg ile baştan sona çözüldü.

Gömülü tam sûreler özgün MP3 ile, kayıt efektleri uygulanmadan çalar. Böylece 21 dakikalık Yâsîn için büyük WAV/efekt işlemeye gerek kalmaz; kişisel/jenerik kayıtların efekt ayarları korunur. Gömülü Yâsîn’de âyet zamanları uydurulmaz: âyet seçimi/tekrarı için isteğe bağlı Arapça cihaz sesi seçilir. Paketlenmiş sesler sürümün doğrulanan çevrimdışı dosyalarıdır; güncelleme tamamlandıktan sonra çevrimdışı oynatılabilir.

Hizbü’l-Vikâye ve Delâilü’l-Hayrât için mevcut nüshayla eşleşen izinli tam Arapça kayıt henüz yok. Mevcut jenerik ve kişisel kayıtlar korunur. Türkçe Delâil anlam kaydı, Arapça özgün ses diye kullanılmaz.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| Üretim kaynakları regresyon grupları | 107/107 geçti; raporlardaki 3.163 tekil kontrol |
| Arapça kaynak bütünlüğü | 13/13 geçti; altı gerçek MP3, SHA-256 ve izinli kaynak kimliği |
| Ses önceliği / eski akış / uzun yerel ses | 10/10, 17/17, 5/5 geçti |
| Tam uygulama Arapça/anlam/ses seçimi | 52/52 Chromium kontrolü geçti |
| Gömülü sesli tam uygulama | 28/28 Chromium kontrolü geçti |
| Gerçek SW ile çevrimdışı oynatma | 10/10 geçti; yeni JS oturumu, engellenen ağ denemesi, altı native ses ve gerçek ses saatleri |
| r1063 → r1065 ve tarayıcı yeniden açılışı | 24/24 kayıt kalıcılığı kontrolü geçti; sentetik WAV baytları değişmedi |
| Dağıtım grafiği, SRI, dosya özetleri | Son paketleme öncesi tekrar doğrulandı |

Tekil kontrol sayıları ile gruplar ayrı tutulur; bu tablo satırları örtüşebilir ve bir toplam iddiası değildir. Testler gerçek kullanıcı kayıtları yerine izole profillerde sentetik WAV kullanır. Cihaz sesi testlerinde kontrollü Web Speech arayüzü, gömülü seslerde Chromium’un gerçek MP3 çözücüsü ve yerel medya saatleri kullanılır. Tam sesin işitilmesi/tecvidinin bağımsız denetimi iddia edilmez. Nihai raporlar `tests/r1065/evidence/` içinde; kaynak listesi ve lisanslar aynı pakette bulunur. Gerçek Android ekran kilidi ve cihaz hoparlöründen işitilen telaffuz bu ortamda doğrulanamaz; Chromium ile uygulama davranışı, ses baytları ve kayıt kalıcılığı denetlenir.
