# SÜKÛN r867 — Authority / Berhetiyye düzeltmesi

- Uygulama build meta, SW sürümü ve cache r867 olarak eşitlendi.
- 28 İsim Seyri hedef otoritesi global sayaçtan ayrıldı: seyir her isimde kendi tekrar limitini (Ebced moduysa o ismin ebcedini) Zikir Çarkı hedefi olarak zorunlu uygular; eski 20 hedefi artık ikinci devir üretemez.
- Seyir isim değişiminde sayaç ve devir sıfırlanır; hedefe ulaşınca sıradaki isme seyir motoru geçer.
- Zikir Ayarları Tempo ile 28 İsim Seyri tekrar aralığı tek otoriteye bağlandı; seyir Ara kontrolü de aynı tempo değerini günceller.
- r865'in `bsStart.textContent=...` runtime'ı kaldırıldı. Bu runtime jewel IMG çocuklarını her tıklamada DOM'dan siliyordu.
- Jewel görselleri z-index 0 gerçek IMG katmanı; tüm buton metinleri z-index 2 span katmanına sarılır. Duraklat/başlat ametist, önceki/sonraki safir, bu ismi baştan zümrüt, Bitir yakut.
- Kendi kayıt aktifken durum çipi kompakt içerik genişliğinde `🎙 Kendi kayıtlı sesin çalıyor` gösterir.
