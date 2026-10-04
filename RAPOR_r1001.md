# SÜKÛN r1001

r1000 tam paketi üzerine iki görünür çeviri eksikliği düzeltildi:

- güç / Güç → Power; GÜÇ → POWER.
- 28 İsim içinde ara… → Search among the 28 Names… (üç noktalı alternatif de kapsanır).

Etiketin kaynak anahtarı ve Atlas arama placeholder'ı değiştirilmedi; Eng'de görüntü sözlükten çevrilir, Türkçe'ye dönünce özgün metin geri gelir. Kullanıcının yazdığı arama değeri ve imleç seçimi korunur. Anahtar kelime eşleştirme, Atlas kimlikleri, zikir sayacı ve ses davranışı değiştirilmedi. Önceki r1000 kapsamlı çeviriler ve mevcut işlevler korunur.

85/85 regresyon grubu geçti. Yeni Atlas etiket grubu gerçek üretim I18N ve deterministik DOM modeliyle Eng → Türkçe → Eng geçişini ve arama değeri korunmasını doğrular. 272 JavaScript blok/dosyası, 44 runtime hash/SRI, build/SW/manifest r1001 eşliği ve 8 çark hash/alpha kontrolü geçti. ZIP CRC ve 253 gerekli uygulama dosyasının byte eşliği doğrulanır. Canlı siteye yayın yapılmadı. Gerçek telefon çizimi/duyulan ses/kilit testi NOT_RUN.

Güncel yükleme yönergesi GITHUB_YUKLEME_r1001.md, kaynak index.html/nero.html ve test kanıtları integration/r1001 altındadır. Eski raporlar tarihsel arşivdir.
