# SÜKÛN r961

Onaylanan çark içi gezinme düzeni uygulandı. Önceki ve sonraki düğmeleri sayının iki yanında, küçük yuvarlak taş ve metal çerçeveli biçimde gösterilir. Taş rengi mevcut çark paletini kullanır; kehribar ve bakır çarklarda sıcak metal çerçeve seçilir. Düğmeler çarkla orantılı boyutlanır. Görünüm ayarındaki “Çark içi önceki–sonraki düğmeleri” seçimi saklanır. Düğmeler kapalıyken mevcut dış gezinme kontrolleri kullanılabilir.

İlerleme yayı ince neon görünümünü korur. Durum yazısı için ayrı alt alan bırakıldı. Uzun sayaç değerlerinde yazı küçültülür. Düğmeler mevcut isim geçişlerini kullanır; yeni ses veya sayaç motoru eklenmedi.

Arka planlar kalıcı görsel önbelleğine kaydedilir. Çevrimdışıyken sürüm sorgusu değişse de aynı görselin son kaydedilen sürümü kullanılabilir; çevrimiçiyken yeni sürüm sorgusu ağdan güncel görseli alır. JavaScript ve CSS için sürüm ve bütünlük doğrulaması korunur. Eski önbelleklerdeki görseller güncelleme sırasında taşınır.

“Arka planları çevrimdışı hazırla” seçeneği 113 ana/hafif/önizleme görselini indirir (yaklaşık 100 MB). İşlem bitince gerçek önbellek kaydı kontrol edilir; eksik kayıt varsa yeniden deneme istenir. Daha önce indirilmemiş görseller internetsiz ilk kullanımda gösterilemez. Tarayıcı depolamayı temizlerse yeniden hazırlık gerekir.

Yeni ayar, çevrimdışı hazırlık bilgileri ve sürüm notları için İngilizce karşılıklar eklendi.

## Doğrulama

- 260 JavaScript ayrıştırması ve 25 çalışma dosyası SHA-256 kontrolü geçti.
- HTML eşitliği, SRI ve r961 sürüm eşleşmeleri geçti.
- Ses hazırlığı, eko/8D, sıfır ses düzeyi, hazırlıkta durdurma ve eski kaynağın yeni kaynağı ezmemesi kontrolleri geçti.
- Service worker kurulum, çevrimdışı uygulama/manifest/çalışma dosyaları, görsel güncelleme ve çevrimdışı sürüm geçişi model testleri geçti.
- Arka plan dosyaları görüntü çözümleyiciyle açıldı.
- Gerçek tarayıcı görsel doğrulaması yapılamadı: Chromium indirmesi tamamlanamadı. Android kilit testi yapılmadı. Görünümün kusursuz olduğu iddia edilmez.

## Yükleme ve telefon testi

ZIP içeriğini assets klasörü dahil birlikte yükle; uygulamayı r961'e güncelle. Kayıtlarını ve uygulama verilerini silme.

Görünüm ayarından düğmeleri aç/kapat, uygulamayı yeniden açıp tercihi kontrol et. Çark küçük/büyükken ve safir/kehribar temalarında sayaç ve durum satırının okunmasını kontrol et.

İnternet açıkken “Arka planları çevrimdışı hazırla” düğmesine bas ve hazır bilgisi gelmesini bekle. Uçak moduna geç; Esmâ ve Berhetiyye'de farklı sahneleri seç. Ses için eko/8D açık halde ekranı kilitleyip en az iki isim geçişini dinle.
