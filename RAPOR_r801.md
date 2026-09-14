# RAPOR r801

- Sorun: Berhetiyye zikir sayacında bazı cihazlarda hâlâ eski yüzük görünüyordu.
- Neden: Yüzük tasarımı CSS ile eklenmiş olsa da eski asset referansı ve/veya cache etkisi yüzünden yeni ring her durumda baskın çıkmıyordu.
- Çözüm:
  - Seçilen yeni yüzük görseli `berhetiyye-ring-r799.png` olarak korundu.
  - Aynı görsel eski fallback dosyası `berhetiyye-ring.png` üzerine de yazıldı.
  - `r778RingSkin` elemanına çalışma anında yeni yüzüğü zorla atayan ek runtime eklendi.
  - Manifest, build marker ve service worker r801'e yükseltilerek cache kırılması sağlandı.
- Sonuç: Berhetiyye seçildiğinde sayaçta yeni yüzük görünmeli; eski yüzük fallback yoldan da engellendi.
