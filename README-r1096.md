# SÜKÛN r1096 — Kayıt stüdyosu ve süre açıklamaları

- Yeni kayıt seçilirken veya analiz yenilenirken önceki kaydın süre, tepe, boyut ve dalga bilgileri temizlenir. Başarısız analiz eski ölçümleri seçili kayda aitmiş gibi göstermez.
- Stüdyo hata açıklamaları; doğrulanmış süre, dosya boyutu, bellek, hazırlık sırası, bekleyen çözümleme, zaman aşımı ve dosya biçimini ayrı belirtir.
- Normalize ve sessizlik kırpma, uygulama boşta iken kendi bekleyen düzenleme isteği yüzünden engellenmez. Başka işlem, çalan veya duraklatılmış zikir ve başka sekme korumaları devam eder.
- Normalize, sessizlik kırpma veya yeni kayıt kaydedildikten sonra analiz tamamlanamazsa kaydın saklandığı açıkça belirtilir. Başarılı kayıt işlemi geri alınmış gibi gösterilmez. Düzenleme kaydından hemen sonra gelen iptal de kaydı başarısız saymaz; eski işlemin yeni seçimin ekranını değiştirmesi önlenir.
- Stüdyonun 60 saniye ve 8 MiB üst sınırı Türkçe ve İngilizce açıklanır. Bellek bütçesi ve WebM güvenlik payı daha kısa kayıtları da sınırlayabilir; mevcut korumalar korunur.
- Bu sınırlar stüdyonun analiz ve düzenleme işlemlerine aittir. Mikrofon kaydını otomatik kesen yeni bir sınır eklenmez.
- Kayıt yardımındaki sınırsız süre ifadeleri gerçek sınırlarla eşleştirildi: zikir/sûre kaydı en çok 10 dakika, dua kaydı en çok 45 dakika. Süreyi aşan okuyuşlar bölümlere ayrılabilir.

- Sürüm hazırlığı, değişmeyen görsel kataloğunun dosya adını ve veri sürümünü korur. Güncelleme sonrası çevrimdışı paket denetiminin yanlış kataloğu istemesi önlenir.

## Doğrulama

Güncel test sonuçları ve kaynak kimlikleri `tests/r1096/verification.json` dosyasında; ayrıntılı kapsam `tests/r1096/README.md` içindedir.

## Sınırlar

Stüdyo analizi ve düzenleme: doğrulanmış 60 saniye, 8 MiB kaynak ve paylaşılan 32 MiB hazırlama bütçesi. WebM/Opus incelemesindeki +1 saniyelik güvenlik payı ve gerçek kanal/örnekleme yapısı daha kısa kayıtları da sınırlayabilir. Bu sürüm üç dakikalık işleme desteği getirmez.

Zikir/sûre mikrofon kaydı 10 dakika; dua okuyucusu kaydı 45 dakika üst sınırını korur. Bunlar stüdyo işleme sınırından ayrı işlemlerdir; uzun kaydın bütün efektlerde oynatılacağı garantisini vermez.

Kişisel sesler, jenerik arşiv, sayaçlar ve kayıtlı seanslar için veri silme/göç işlemi eklenmemiştir. Gerçek Android mikrofonu, kilit ekranı ve duyulan ses için fiziksel cihaz kabulü ayrıca gereklidir.
