# SÜKÛN r1067 — Yâsîn âyet ve meal takibi

Yâsîn dinlenirken okunan âyetin Arapça metni ve görünür durumdaki meali aynı turkuaz çerçeve içinde belirtilir. Duraklatıldığında çerçeve altın rengine döner. Takip sayfayı kendiliğinden kaydırmaz, açıklama açmaz veya odağı değiştirmez; **Okunan âyete git** düğmesi açık kullanıcı gezinmesi yapar.

TTS takibi, ilgili âyetin gerçekten başlayan konuşma olayına dayanır. Gömülü Arapça kıraatte yalnız doğrulanmış kaydın gerçek `HTMLMediaElement.currentTime` ve `duration` değerleri kullanılır. Duvar saati, tahminî okuma hızı veya oynatma hızından konum türetilmez. Eski kişisel ve jenerik kayıtlar âyet zamanları varmış gibi sınıflandırılmaz; bu kaynaklarda otomatik âyet eşleştirmesi yapılmaz.

## Ses ve zaman kanıtı

- Kaynak: `assets/audio/arabic-r1065/yasin.mp3`; Aaqib Azeez / Atcovi'nin CC0 kaydı. Orijinal MP3 değiştirilmedi.
- SHA-256: `4096f23ddba18fb4b410e54459cac520d91de178c5b5d2a78232e57723fb6a3d`.
- Boyut: **21.195.286 bayt**. Çözülmüş ses süresi: **1260.3278125 saniye**. Chromium'un native medya süresi `1260.3278` saniyedir; encoder gecikmesi için ek kaydırma uygulanmaz.
- Değişmez 83 cue, bütün ses üzerinde global CTC hizalamasıyla çıkarıldı. Aynı canonical metnin harekeli ve harekesiz iki referansıyla yürütülen ayrı hizalamalar 83 ilk-token çapasında birebir eşleşti; referansa zorlanmamış greedy metin denetimi ve bağımsız dalga biçimi ölçümleriyle çapraz kontrol edildi.
- İlk âyet **6.86**, son âyet **1246.88** saniyede başlar. Başlangıçtaki Besmele ayrıdır. Âyetler arasındaki sessizlikte önceki çerçeve korunur; son cue, sesin sonundaki sessizliği kapsar.
- **20 ms**, zaman ızgarasının çözünürlüğüdür; mutlak fonetik sınır doğruluğu veya bir güven yüzdesi değildir. CTC skorları kalibre edilmiş olasılık değildir. Doğrulama makine ve dalga biçimi temellidir; bütün kaydın insan tarafından dinlenerek denetlendiği iddia edilmez. Üçüncü âyetin daha yüksek yerel gürültüsü ek eşikle kontrol edildi.

Tam kaynak, model, hash ve denetim kaydı: [yasin-timing-r1067.json](yasin-timing-r1067.json). Runtime tablo: `assets/runtime/yasin-timing-r1067.js`. Ses hash'i, bayt sayısı veya native süre eşleşmezse bu tablo kullanılmaz. Canonical Arapça metin ve meal değiştirilmedi.

## Kaydırma ve etkileşim

- Nefs ve Tefekkürde gecikmiş konum düzeltmeleri kendi bağlamlarıyla sınırlıdır; yeni kullanıcı girdisi veya kapanan hedef önceki isteği iptal eder.
- Yarım kalan akış barı tutamacı sürüklemesi odak kaybında ve iptal olaylarında temizlenir.
- Yatay kontrol şeridi yatay gezinmesini korur; doğal dikey sayfa kaydırması engellenmez.
- Etkin olmayan görünmez alt katmanlar `display: none` ile tıklama ve kaydırmayı yakalamaz. Açık bildirim çekmecesi kendi içeriğinde kayar; kısa içerikte hareket arka sayfaya geçmez. Kapanınca normal sayfa kaydırması geri gelir.
- Dar ekranda eski Nefs listesinin metni sıfır genişliğe sıkışmaz. Metin ve Arapça ad tam satıra yerleşir; rehber düğmesi ayrı 44 px dokunma alanı taşır.

## Doğrulama

| Test | Sonuç | Kanıt |
|---|---:|---|
| Üretim timing modülü, 83 sınır ve kaynak bütünlüğü | 13/13 | `../tests/r1067/evidence/yasin-timing.json` |
| Native medya ilerlemesi | 13/13 | `../tests/r1067/evidence/native-progress.json` |
| Okuyucu ilerlemesi | 21/21 | `../tests/r1067/evidence/reader-progress.json` |
| Kaydırma yaşam döngüsü | 41/41 | `../tests/r1067/evidence/scroll-lifecycle.json` |

Timing testi ayrıca 249 sınır örneğini ve 4096 deterministik rastgele medya zamanını bağımsız doğrusal aramayla karşılaştırdı; metadata reddi, değişmez veri ve oynatma hızından bağımsızlık geçti.

| Test | Sonuç | Kanıt |
|---|---:|---|
| Yâsîn çerçevesi, meal, native ses saati ve doğal kaydırma | 41/41 | `../tests/r1067/evidence/yasin-follow-browser-final.json` |
| Mobil dokunma, çekmece, görünmez dock ve dar Nefs satırları | 44/44 | `../tests/r1067/evidence/scroll-audit-release.json` |
| Nefs ankrajı, yeni dokunmada iptal ve yarım drag temizliği | 8/8 | `../tests/r1067/evidence/scroll-races-release.json` |
| Arapça asıl/meal, 83 âyet sırası ve ses kaynakları | 52/52 | `../tests/r1067/evidence/readings-regression-final.json` |
| Desteklenen üretim kaynağı regresyon grupları | 113/113 | `../tests/r1067/evidence/regressions-summary-final.json` |
| r1063 → r1067 gerçek SW güncellemesi, kayıtlar ve iki yeniden başlatma | 24/24 | `../tests/r1067/evidence/persistence-release.json` |

Son 41, 44 ve 8 kontrol aynı konsolide HTML/runtime kaynakları üzerinde çalıştı. 52 kontrolün okuyucu mantığı ve veri kaynakları son CSS düzenlemesinde değişmedi. Ayrı sınırlı denemeler, kısa çekmecede arka sayfanın sabit kalmasını ve uzun içerikte gerçek iç kaydırmayı doğruladı. Nihai 44 kontrol çekmece, kapatma ve sonraki sayfa hareketini aynı sürüm üzerinde yeniden sınadı.

Mobil sınamalar 320×640 ve 390×844 Chromium görünümlerinde gerçek CDP dokunmalarıyla yapıldı; ayrıca gömülü MP3 320×740 görünümünde gerçek medya saatiyle çalındı. Cihaz TTS sesi kontrollü bir test sınırıdır. Fiziksel Android donanımında veya kullanıcının özel kayıtlarında doğrulama yapılmadı.

Güncelleme paketi r1063, r1064, r1065 ve r1066 üzerine uygulanabilir; 81 zorunlu runtime dosyasını ve altı gömülü Arapça kaydı içerir. Dosyalar aynı yollarla birleştirilir. Tarayıcı kayıtları ve tercihler için silme veya yeniden sınıflandırma işlemi eklenmedi.
