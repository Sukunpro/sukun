# r875 BUTTON HARD FIX
Kök problem: Berhetiyye kontrol alanında çok sayıda eski CSS/runtime otoritesi aynı düğümleri tekrar boyuyor.
Bu düzeltme sürüm/SW katmanına dokunmaz.

- Gerçek button DOM düğümleri korunur; event listener'lar kırılmaz.
- Grid içine sonradan enjekte edilen dekoratif node'lar kaldırılır.
- Inline `!important` paint authority kullanılır; eski yüksek-specificity kurallar artık Bitir'i soyamaz.
- Ruby asset yüklenirse Bitir ruby kullanır.
- Ruby asset sunucuda yoksa Bitir çıplak kalmaz: çalışan sapphire jewel kırmızı tint ile fallback olur.
- hidden bsPause zorla görünür yapılmaz.
