# SÜKÛN r844 — Berhetiyye Görsel Otoritesi + Zikir Ayarları

- Kök neden 1: r843 yeni sahne değişkenlerini yazsa da eski r832 sahne motoru daha sonra tekrar çalışıp eski `scene-12-keririn-tevhid-r840.png` gibi varlıkları geri boyuyordu.
- Çözüm: 28 isim için tek `--r844-berhet-scene` görsel otoritesi oluşturuldu. Eski r829/r832 değişkenleri artık görünür arka planı ezemez.
- Kerîrin: gömülü sahte UI/yazı ve gezegenli üst bölüm kullanılmayan temiz görsel assete ayrıldı: `scene-02-keririn-clean-r844.jpg`.
- Diğer 27 isim de aynı indeks tabanlı tek otoriteden okunur; isim değişiminde sahne aynı event zincirinde yeniden senkronize edilir.
- Kök neden 2: Zikir Ayarları için r830, r839 ve r843 aynı dokunmayı farklı modal/panellere taşıyordu; canlı `.r679SettingsBody` bir panelden diğerine kaçabiliyordu.
- Çözüm: r844 doküman-capture otoritesi tek panel kullanır, eski açıcıların aynı dokunmayı ikinci kez işlemesini durdurur ve gerçek tempo/bendir düğümlerini r844 sheet içinde açar.
- Paket kimliği, manifest ve service worker r844'e yükseltildi.
