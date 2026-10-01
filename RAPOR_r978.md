# SÜKÛN r978 — terkip, eko ve etkileşim düzeltmeleri

r977 tam paketi üzerine hazırlanmıştır. Web/PWA kaynaklarını içerir. Güncel uygulama, SW ve manifest r978 olarak eşleştirilmiştir.

## Terkip ve formül okumaları

Ses kaynakları arasında geçişin aynı terkip turunu iptal etmesi düzeltildi. Katalogdaki terkipler, altı Yâ Serîu formülü ve kullanıcı terkipleri sırayla okunur; yalnız tamamlanan tur sayılır. Durdurma, duraklatma ve isim değişikliğinde eski okumadan gelen geç tamamlanma sayılmaz. Tek tek kayıtlı isimler mevcutsa kayıt önceliği korunur; katalogda bulunmayan isimlerin Arapça metni terkibin kendi metninden taşınır. Uzun formüllerin sabit 32 saniyede kesilmesi yerine bileşenlere uygun süre bütçesi kullanılır. Terkip için ekran görünür/gizli geçişi de aynı ses tamamlanma mantığına bağlandı.

Otomatik terkip, ana otomatik oynatıcının bileşeni olarak tanınır; rakip bir oynatıcı diye kendi akışını durdurmaz. Döngü isteğinin birleştirilmesi veya kuyruğa alınması tamamlanmış okuma sayılmaz. Durdurulan eski döngünün kuyruğa alınmış okumaları ve geç ses sonuçları yeni döngüyü başlatamaz veya sayısını değiştiremez.

Terkip bileşeninin kayıt kimliği, seçili ana formülün kimliğini değiştirmez. Böylece kayıtlı bir esmâ okunurken formül yanlışlıkla tek esmâya dönüşmez. Ekran geri dönüşünde tamamlanmamış eski tur sayılmaz; görünür ekranda başlayan yeni tam tur normal sayaç kapısından geçer. Manuel okumalar ve terkibe ait yerel ses kilitleri bitiş/iptalde bırakılır; başka seyirlerin kilitleri korunur. Kimlik dinleyicileri, oynatıcı sahipliği, sesin gerçek durumu ve sayaç kapısı birlikte denetlendi.

## Eko

Havuzdaki bir kayıt ilk kez eko kapalıyken açılmışsa daha sonra eko eklenememesi düzeltildi. Kayıt sesinin kuru/efektli yolları kalıcı kurulur ve canlı ayarlar bu yollara uygulanır. Mini oynatıcıdan yapılan efekt seçimi de ekran kilidi hazırlığına dahil edilir. Aynı isim için hazırlanan yeni efektli dosya okumanın ortasında yeniden başlatılmaz; sayım yetkisi korunarak uygun sınırda uygulanır. Ayar hazırlanırken değişirse eski efekt sonucu yerine güncel tercihle hazırlanır.

Cihazın Arapça/Türkçe speechSynthesis sesi tarayıcı WebAudio grafiğine aktarılamaz. Bu cihaz sesine eko/8D uygulanamaz; arayüzde iki dilde açıklanır. Efekt tercihi kendi kayıtları için korunur. Bu sınır bir fiziksel cihaz ses testiyle giderilmiş gibi sunulmaz.

## Görünüm ve kaydırma

Berhetiyye kartının şeffaf dokunma yüzeyine uygulanan dolu safir kaplama kaldırıldı. Yazıyı gizleyen boş mavi kutu ve isim üstündeki küçük fazladan plaka giderildi; gerçek düğmelerin kaplamaları korunur. Aynı isim için birden çok eski ölçüm kodunun çalışması engellendi. Tek ölçüm sahibi, gözlenen genişlik ve değişen isim/font/dil üzerinden çalışır. Her sayaç/metin değişiminde bütün alt elemanları ölçen tarama kaldırıldı. Pasif gösterimler mevcut durum modelini kullanır; eylemler güncel durumla çalışmaya devam eder. Bu değişiklikler kullanıcı raporunda ölçülen zorunlu yerleşim yüklerini hedefler; gerçek telefon performansı bu ortamda ölçülmedi.

## Kaynak açıklaması

Hizbü’l-Vikâye ile Yâ Serîu formül derlemesi ayrı gösterilir. MIAS eser kataloğunda Hizbü’l-Vikâye RG244 muhtemel aidiyet sınıfındadır. Bu kayıt altı formülün ve 212/579/1060 adetlerinin kesin kaynağını doğrulamaz. Bu taramada birebir eser/sayfa bulunamadı; isimler, sıra ve önerilen adetler değiştirilmedi. Kaynak incelemesi integration/r978/source_review.json içinde, birincil arşiv/araştırma bağlantıları uygulamanın kaynak açıklamasında bulunur.

## Doğrulama

24 regresyon süiti geçti. Üretim kodu kontrollü DOM, medya, saat ve ağ koşullarında çalıştırıldı. Yeni testler terkip sırasını, iptal ve geç geri dönüşleri, kayıt/TTS geçişini, efekt hazırlığı ve havuz kullanımını, aynı isimde efekt geçişini, şeffaf kart yüzeyini ve yerleşim gözlemcilerini kapsar. Ayrıntılı sonuçlar integration/r978/evidence/ altındadır.

260 JavaScript kaynağı ayrıştırıldı; 30 runtime hash, 8 mevcut yeni çark görselinin hash/şeffaflık bilgisi, HTML SRI, index/nero eşitliği ve build/SW/manifest kimlikleri doğrulandı. ZIP bütünlüğü ve uygulama dosyaları paketleme sırasında doğrulanır.

Gerçek tarayıcı çizimi, fiziksel Android, ses kalitesi ve kilit ekranı testi NOT_RUN. Telefonun sağlık raporunda aktif ses örneği yoktu; tüm fiziksel eko durumlarının bu raporla doğrulandığı iddia edilmez. Güncel rapor bu dosyadır; geçmiş rapor ve testler arşiv olarak korunur.
