# Sonraki çalışma: uzun kayıt stüdyosu

r1098 oynatma başlangıcını ve son heceleri korur. Stüdyo işleme sınırları 60 saniye, 8 MiB kaynak ve 32 MiB ortak hazırlama belleği olarak kalır.

Yalnız süreyi 180 saniyeye çıkarmak yeterli değildir: paketlenmiş dua:ak WebM kaydı için mevcut stüdyo bellek tahmini 44,1 kHz’de yaklaşık 45 MiB, 48 kHz’de 48,71 MiB olur. Süre ve bellek korumaları farklı katmanlarda uygulanır.

Önerilen ilk değişiklik: uzun kayıtlarda çözümleyici çalıştırmadan süre/boyut bilgisi sunan ayrı, salt okunur stüdyo işlemi. Ortak sıra, iptal, sahiplik ve kaynak revizyonu denetimleri korunmalı. Üretilmeyen tepe/RMS/dalga bilgileri boş kalmalı; WebM +1 saniye güvenlik payı açıkça belirtilmeli.

Aynı Blob için uzun stüdyo incelemesinin WeakMap önbelleği olağan 60 saniyelik FX politikasını aşmamalı. 8 MiB+1 kaynak okunmadan reddedilmeli. Eski seçim sonucu yeni kayda taşınmamalı; uzun inceleme decoder/worker başlatmamalı, kayıt baytlarını ve revizyonlarını değiştirmemeli. Uzun kayıtta normalize/kırp mevcut sınırla açıkça reddedilmeli. 180 saniye ve WebM güvenlik payı sınır durumları ayrı sınanmalı.

Gerçek Chromium kabulünde paketlenmiş dua:ak ve koruma:4 kullanılabilir. Tam uzun kayıt düzenlemesi ayrı, parçalı çözümleme ve çıktı belleği tasarımı gerektirir. Fiziksel Samsung/Android ses ve ekran kilidi kabulü henüz yapılmadı.
