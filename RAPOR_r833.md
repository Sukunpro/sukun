# SÜKÛN r833 — Canlı sürüm, erişim bağlamı ve etkileşim onarımı

## Taban ve canlı kontrol

15 Eylül 2026 tarihinde https://sukunpro.github.io/sukun/nero.html HTTP üzerinden indirildi; yüklenen ayrı nero.html ile SHA-256 değeri birebir aynı. Bu HTML/index r832, ZIP r798. Daha yeni Nero ve index korunarak r798 varlıklarıyla birleştirildi. Canlı manifest ve Service Worker r828 idi. Bu paket canlı siteye dağıtılmadı.

Canlı sitede üç `scene-kristal-* / scene-sirlar-*` dosyası, `sukun-nur-ring-r831.png` ve `__sukun_latest__.json` 404 döndürüyordu. Seçilen üç mevcut sahne dosyası da sunucuda eksikti ancak r798 paketinde bulunuyordu. Sahne seçimleri bu mevcut yüksek çözünürlüklü dosyalara bağlandı ve dosyalar pakete dahil edildi. Yeni Berhetiyye çarkı ve eksik kontrol varlıklarının 13 dosyası canlı siteden alındı; yeniden sıkıştırılmadı. Üç gönderilen tasarım referansı incelendi; bu turda yeni görsel üretilmedi veya mockup metinleri uygulama verisine çevrilmedi.

## Davranış

- Berhetiyye görünümü için mevcut `SukunSecretPolicy.unlocked()` erişimi VE gerçekten yüklenmiş Berhetiyye kaydı birlikte gerekir. Erişim mekanizması değiştirilmedi.
- Normal esma, dua ve diğer kategorilerde Mevlevi arka planı/normal nur çarkı kullanılır. Favoriler gerçek kaynak kaydına göre değerlendirilir. Aktif akıllı seansın yüklenmiş kaydı, gezilen kategori sekmesinden önceliklidir. Eski seyir durumu veya başlıkta geçen Berhetiyye sözcüğü görünümü açamaz.
- Yeniden kilitleme hem çarkı hem arka planı normale döndürür. Sahne seçicileri gizlenir. Ses ve sayaç bu görsel geçiş nedeniyle baştan başlatılmaz.
- r829 ve r832'nin çakışan sahne sahipliği tekleştirildi. Yazılan `r831` durumu ile CSS'nin beklediği `r832` farkı giderildi. Arka plan, body altında kalmak yerine görünen sabit `r717Scene` katmanına uygulanır; tefekkürde de aynı sahne kullanılır.
- Normal çarkın kayıp r831 dosyası, mevcut r757 ana görseli ve siyahı saydamlaştıran SVG filtresiyle değiştirildi. Berhetiyye çarkı ayrı RGBA görselidir. Dönüş saat yönünün tersinde kalır.
- Görünen çarkın `host.click()` çağrısı saymıyordu: eski sayaç click'i iptal edip pointerup'ta sayıyordu. Yeni yüzey doğrudan mevcut sayım işlevine bağlandı. Sürükleme, kaydırma, iptal, uzun basma ve tekrarlayan tuş basımı sayım üretmez. Klavye/erişilebilir click desteklenir.
- Aynı sayaç metninin sürekli yeniden yazılarak MutationObserver'ı tetiklemesi kaldırıldı. Çark görünür host geometrisinde merkezlenir, dar kapsayıcıya sığar; gizli host üzerinde hayalet hit alanı bırakmaz.
- Zikir Ayarları üst details kapalıysa onu da açar. Özet düğmesinde çift toggle engellendi; yeniden DOM kurulumu sonrası bağlama yenilenir. Tefekkür butonunun modalın arkasından koordinatla tetiklenmesi önlendi. Kendi Sesin metni ve Bitir kontrolünün görsel yerleşimi iyileştirildi.
- index, Nero meta/alt etiket, manifest, SW ve güncelleme işaretçisi r833 olarak eşitlendi. index gelen query/hash bilgisini korur. SW meta özellik sırasından bağımsız sürümü okur, eski sürüm önbelleğini erken silmez ve eksik görsele uygulama HTML'i döndürmez.
- Modüler containment CSS içindeki 12 göreli URL `../assets/` olarak düzeltildi. HTML kapanışından sonra kalan script/style katmanları belge içine alındı; dışarıda yazı olarak görünen literal `\n` kalıntıları temizlendi.

## Doğrulama ve sınırları

154 kontrol: 17 bağlam/etkileşim, 11 servis çalışanı/çevrimdışı ve 126 mevcut kaynak/VM regresyon kontrolü geçti. Çalıştırılabilir 217 inline modül ve SW sözdizimi kontrol edildi. 79 benzersiz yerel HTML/CSS kaynak yolu ve SW önbellek listesi mevcut; statik ID tekrarı yok.

Eski testlerde artık kullanılmayan worker işlevine bağlı altı kontrol, r798 sonrasındaki dayanıklı kurulum davranışını sınayan 11 kontrolle değiştirildi. Eski raporlar tarihseldir; bu sürümün doğrulaması `diagnostics/r833/verification.json` dosyasındadır.

Bunlar kaynak kodu ve izole DOM/CacheStorage testleridir; tarayıcı yerleşim motoru, gerçek Android dokunması/FPS, kilit ekranı veya fiziksel ses doğrulaması yapılmadı. Canlı kontrol HTTP dosya erişimi ve içerik karşılaştırmasıdır; canlı butonlara basıldığı iddia edilmez.

Çalıştırma:
- `node diagnostics/r833/test_context.cjs`
- `node diagnostics/r833/test_worker.cjs`
- `node diagnostics/r833/test_regression.cjs`

## Yükleme

ZIP içeriğini `/sukun/` dizinine **assets, css ve js klasörleriyle birlikte** yükle. Yalnız Nero/index dosyalarını değiştirmek eksik saray görsellerini düzeltmez. `sw.js`, manifest ve `__sukun_latest__.json` dahil paket birlikte yayınlanmalı. Sonrasında uygulama alt etiketi r833 olmalıdır.
