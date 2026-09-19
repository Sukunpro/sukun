# SÜKÛN r846 — kök çakışma temizliği

- r845'e eklenen iki ayrı arka plan/ayar authority bloğu tamamen kaldırıldı.
- Kerîrin arka planındaki gerçek hata bulundu: HTML `scene-02-keririn-clean-r845.jpg` istiyordu, paketteki gerçek dosya `scene-02-keririn-clean-r844.jpg` idi. r846 kanonik eşleme gerçek dosyaya bağlandı.
- Tetlîhin için de aynı tip dosya adı uyuşmazlığı bulundu (`r843` isteniyordu, pakette `r841` vardı) ve düzeltildi.
- 28 sahne manifestindeki bütün dosya yolları paket üzerinde varlık kontrolünden geçirildi.
- Zikir Ayarları için r845'in capture/pointerdown katmanları kaldırıldı. Bunlar daha önce çalışan r830 dialog açılışını `stopImmediatePropagation()` ile kesiyordu.
- Görünür ayar düğmesi doğrudan mevcut `SukunR830SettingsFix.open()` fonksiyonuna bağlandı; ikinci panel/DOM taşıma sistemi kaldırıldı.
- Service Worker/cache kimliği r846 olarak yenilendi.
