# SÜKÛN r845

- Berhetiyye arka planı için 28 isim tek kanonik otoriteye bağlandı.
- Kerîrin doğrudan `scene-02-keririn-clean-r845.jpg` (pakette r844 adını koruyan temiz asset) üzerinden okunur; r832/r835 eski sahne değişkenleri her senkronizasyonda kanonik görselle ezilir.
- Aynı eski-sahne geri dönüşü 28 ismin tamamında engellendi.
- Zikir Ayarları görünür düğmesi `pointerdown` aşamasında doğrudan gerçek ayar paneline bağlandı; eski r830/r835/r844 event zincirini beklemiyor.
- Tempo, Bendir ve hedef kontrolleri kopyalanmıyor; mevcut canlı DOM düğümleri r845 paneline taşınıp kapanışta geri bırakılıyor.
- DOM yeniden kurulursa MutationObserver düğmeleri tekrar bağlar.
- SW/manifest sürümü r845'e yükseltildi.
