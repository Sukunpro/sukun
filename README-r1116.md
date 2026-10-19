# SÜKÛN r1116 — Frekans durdurma ve yolculuk sürekliliği

Mod değiştirirken bekleyen frekans başlatması artık kendisine ait bir iptal kaydı taşır. Durdur komutu bu beklemeyi de bitirir; eski zamanlayıcı frekansı yeniden açamaz. Genel duraklatmada bekleyen mod değişimi Devam et komutunu bekler.

Frekans yolculuğu aşamaları ses motorunun saatini izler. Genel duraklatma sırasında kalan aşama ve geçiş süresi korunur. Devam ederken frekans geçişi tutulduğu noktadan kurulur. Yeni sabit set veya elle ayar önceki frekans rampasının hedefini temizler.

r1114 otomasyon temizliği ve r1115 Berhetiyye ortak yüzeyleri bu tam sürüme dahildir. Ambiyans Tam/Hazır kartları, kişisel merkez, ana sayfa ve alt yedekleme yüzeyleri seçili zikir ailesinin temasını izler. Mevcut mini/midi/max safir logo düzeni korunur.

Sürüm, iki eş giriş sayfası, PWA manifesti, servis çalışanı, başlangıç sesi URL'si, SRI değerleri ve SHA-256 dağıtım listeleri aynı r1116 kimliğinde hazırlanır. Eski CSS testlerinin sabit dosya sayısı beklentileri, etkin dosyaların gerçek içerik ve bütünlük denetimleriyle güncellenir.

Doğrulama kanıtları GitHub'da tests/r1116 altında tutulur. Kontrollü işlev testleri ile gerçek Chromium testleri ayrı raporlanır. Fiziksel Android ekran kilidi ve duyulan ses bu ortamda sınanmamıştır.
