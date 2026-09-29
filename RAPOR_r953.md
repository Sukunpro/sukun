# SÜKÛN r953 — Berhetiyye otomatik geçiş düzeltmesi

## Doğrulanan neden
r952 sağlık kaydında Tûrânin hedefinin sonuna gelindiğinde Berhetiyye indeksi 3→4 oluyor; hemen ardından kategori esma, indeks 0 ve durum IDLE oluyor. Eski r863/r883 bitiş dinleyicisi, otomatik ilerleyen işlemleri de bitiş sayarak 80 ms sonra parkToEsma çalıştırıyordu. Hata r952 koduyla Chromium üzerinde yeniden üretildi; çağrı izi doğrudan bu dinleyiciye ulaştı.

## Değişiklikler
- Otomatik ilerleyen işlem Esmâ’ya park edilmez; Berhetiyye kategorisi ve otomatik okuma devam eder.
- Gecikmiş bitiş işlemi yalnız aynı işlem, seçim ve kullanıcı komutu hâlâ geçerliyse çalışır. Yeni seçim veya duraklatma üzerine yazamaz.
- 28/99 seyirlerin kendi bitiş yönetimi korunur. Otomatik ilerleme kapalı gerçek tekil bitişin mevcut davranışı korunur.
- Kilitliyken soğuk kayıt hazırlanmasında seçili tekrar aralığı PCM dosyasına sessizlik olarak eklenir. Konuşma örnekleri kesilmez, tempo için ses hızlandırılmaz. Önceden hazırlanmış efektli kaynak yolu korunur. Bu yol zamanlayıcıyla tekrar boşluğu veya çalışan OfflineAudioContext gerektirmez.
- Sağlık kontrolündeki dosya başına 256 KiB sınırı, paketin 283054 baytlık nefs-data dosyasını SIZE_LIMIT ile dışlıyordu. Sınır 512 KiB yapıldı; SHA-256 karşılaştırması aynen sürüyor.
- HTML, manifest, Service Worker ve build işaretleri r953 ile eşitlendi.

## Test kanıtı
- r952’de Berhetiyye→Esmâ/0 hatası üretildi; r953’te aynı senaryo Berhetiyye/4 konumunda kaldı.
- Görünür/gizli senaryolarda hem Esmâ hem Berhetiyye otomatik hedef geçişleri doğrulandı.
- Otomatik ilerleme kapalı bitiş, gecikme sırasında yeni seçim, kullanıcı duraklatması doğrulandı.
- IndexedDB’ye yalnız test ortamında konan sentetik WAV kayıtlarıyla gerçek HTMLAudioElement kaynağı berhet:3→berhet:4 geçti; oynatma ve sayaç devam etti.
- Aynı kaynak görünürden gizliye geçerken yeniden başlatılmadı; kaynak ve tekrar aralığı korundu. Soğuk yeni kayıtta görülen 500 ms çevrim, düzeltmeden sonra 1000 ms oldu.
- Tarayıcı testinde çalışma zamanı JavaScript hatası yok. 242 çalıştırılabilir inline script sözdizimi kontrolünden geçti.
- Çekirdek dosya özetleri, SRI ve iki HTML girişinin eşitliği doğrulandı. Ayrıntılar DOGRULAMA_r953.json içinde.

## Sınırlar
Gizlilik durumu tarayıcı testinde simüle edildi; fiziksel Android ekran kilidi, işletim sistemi ses odağı ve süreç dondurması ölçülmedi. Raporlarda daha erken görülen AbortError için bu testler cihazdaki tüm olasılıkları çözmüş sayılmaz. PCM hazırlığı 8 MiB kaynak, 120 saniye ve 24 MiB çıktı sınırları içinde çalışır; bütçe dışı veya decode edilemeyen kaynaklar mevcut ham kayıt yoluna döner. Soğuk kaynakta efekt üretimi önceki sürümde olduğu gibi sınırlıdır; mevcut hazırlanmış efektler kullanılır.

## Yükleme ve telefon testi
ZIP’in içindeki dosyaları aynı uygulama klasörüne birlikte yükleyin. Veri/kayıt temizliği yapmayın. Aktif okumayı bitirdikten sonra uygulamayı güncelleyin ve r953 göründüğünü kontrol edin.
Berhetiyye tekil zikrinde otomatik sonraki isim + ebced ile Tûrânin’i çalıştırın. Telefonu hedef bitmeden kilitleyin. Sonraki Berhetiyye ismi duyulmalı; ekran açıldığında Rahmân’a dönmemeli ve sayaç ilerlemeli. Aynı denemeyi ekran açıkken karşılaştırın. Bir kesinti olursa hemen yeni sağlık raporunu alın.
