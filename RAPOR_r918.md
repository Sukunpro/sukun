# SÜKÛN r918 — Sahne ve dokunma onarımı

25 Eylül 2026 · Temel: r917 · Güncelleme paketi

## Kurulum

Mevcut uygulama klasörünün üzerine birleştirerek kopyalayın. Mevcut `assets` klasörünü veya kendi ses dosyalarınızı silmeyin. Bu arşiv, eski sürümlerdeki bütün medya dosyalarının bulunduğu doğrulanmış bir temiz kurulum paketi değildir. Tarihsel kodda pakette olmayan 38 eski dosya yolu var; bazıları geçersiz kılınmış yollar. r918 yeni eksik dosya yolu eklemiyor. Canlı siteye bu çalışma sırasında yayın yapılmadı.

## Onarılanlar

- Aktif Berhetiyye ismi → kanonik indeks → sahne bağlantısı mevcut görsel motorunda tutuldu. İsim değişiminde sahne değişir; sayaç değişimleri yeni sahne seçimi başlatmaz.
- İlk r918 açılışında eski sabit sahne tercihi taşınmaz, isme göre otomatik sahne varsayılan olur. Sonraki açık manuel seçimler korunur.
- Atıl 99 seyir önizlemesinin aktif Berhetiyye arka planını engellemesi düzeltildi. Esmâ seçilince Mevlevî görünümüne dönülür.
- 35 çalışma görseli WebP olarak hazırlanıp doğrulandı: 106,116,471 bayttan 16,372,574 bayta, %84.6 azalma. Özgün PNG'ler ve 1/10/11 onaylı sahneler değişmedi.
- Sahne dosyası çözümlenmeden yeni görsel gösterilmez. Her yükleme 6 saniye ile sınırlı; WebP başarısızsa aynı sahnenin özgün PNG'si denenir. İkisi de başarısızsa nötr Berhetiyye gradyanı ve Yeniden Dene gösterilir; yanlış ismin eski görseli kalmaz.
- Geç kalmış sahne sonuçları yeni ismi ezemez; yalnız bir sonraki sahne ön yüklenir. Veri tasarrufu açıkken ön yükleme kapalıdır.
- Tefekkür çarkını gizleyen eski CSS düzeltildi. Aynı sayaç ve aynı çark kullanılır; ikinci sayaç motoru eklenmedi.
- Tefekkür çıkışını örten görünmez akış barı tutamacı kaldırıldı. Tefekkürde mevcut yerel kontroller kullanılır; çıkınca normal bar geri gelir. Uzun ana menüler Tefekkür kontrollerinin arasından çıkarıldı.
- Altı eylem düğmesi Berhetiyye görsel ailesine alındı; dokunma alanları korundu. Hedef/Kalan simgeleri görünür hâle getirildi.
- Service Worker, HTML, manifest ve sürüm işaretleri r918'e eşitlendi. Büyük tarihsel sahneler ilk açılışta topluca indirilmez; önceki önbellekten geri dönüş korunur.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| JavaScript sözdizimi | 241 HTML betiği ve SW geçti |
| Paket bütünlüğü | 152 kontrol geçti |
| Kanonik 28 isim | Gerçek uygulama seçim işleyicileriyle 28/28 doğru sahne |
| Özgün dosyalar | r917'deki 67 asset bayt bayt aynı |
| WebP dosyaları | 35/35 çözümleniyor |
| Sayaç → sahne | Beş artırma yeni sahne seçimi yaratmadı |
| Manuel/otomatik sahne | Sabit sahne korunuyor, otomatiğe dönünce isim eşleşiyor |
| Altı eylem düğmesi | elementFromPoint ile 6/6 doğru hitbox, 167×58 px |
| Gerçek dokunma | Favori aç/kapat; Tefekkür çıkışı 360/390/430 px geçti |
| Tefekkür | Tek çıkış, görünür çark, iki durum simgesi, yatay taşma yok |
| Esmâ ayrımı | Berhetiyye çarkı kaldırılıyor, 99 seyri kendi halkasını kullanıyor |
| Hatalı/gecikmiş görsel | Özgün dosyaya fallback, gradyan, yeniden deneme, zaman aşımı, eski sonuç engeli geçti |
| PWA | Gerçek SW kurulumu, 16 ön yükleme dosyası, çevrimdışı sahne ve r918 sayfa açılışı geçti |
| JavaScript çalışma hatası | Bu senaryolarda 0 |

Görsel hata senaryoları mevcut sahne runtime'ının izole tarayıcı testinde; 28 isim, butonlar ve Tefekkür kontrolleri tam uygulamada doğrulandı. Test verileri ayrı yerel tarayıcı profilindedir.

## Sınırlar ve sonraki adım

Android'in gerçek ekran kilidi/arka plan askıya alma davranışı, fiziksel cihaz sesi, Bluetooth ve kendi kayıt/TTS geçişleri bu çalışma kapsamında cihaz üzerinde test edilmedi. Bunlar için başarı iddiası yoktur. Ses, sayaç ve foreground queue otoriteleri değiştirilmedi.

`R919_R920_ONAY_ONERISI.md` içindeki yeni mimari ve görünüm önerileri onay bekliyor. Yeni SessionState, ses bus sistemi, katı kayıt önceliği, Focus Mode ve sinematik Atlas r918'de uygulanmış sayılmamalı.
