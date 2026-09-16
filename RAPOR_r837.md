# SÜKÛN r837 — Onaylı arka plan entegrasyonu

Taban sürüm: r836. Paket hazırlandı; canlı siteye yayımlanmadı.

| İsim | Otomatik arka plan | Durum |
|---|---|---|
| Berhetîhin | Billur Saray | Yeni görsel eklendi |
| Hûtîrin | Adalet ve Mühür | Yeni görsel eklendi |
| Kalnehûdin | Rüzgâr ve Hüdhüd | Yeni görsel eklendi |
| Galmeşin | Altın Nur | Üretim sınırı nedeniyle tamamlanamadı; eski sahne korunuyor |

Arka planlar:
- Yeni üç sahne hem isimle otomatik eşleşir hem arka plan menüsünden seçilebilir. Menüde Otomatik ve toplam 12 sahne vardır.
- Eşleşme yalnız kilidi açık ve gerçekten yüklenmiş Berhetiyye isminde etkinleşir. Esmâ veya normal zikre geçişte Mevlevi arka planına dönülür.
- Elle seçilen arka plan tercihi korunur. Otomatik seçilince aktif isme göre değişim geri gelir.
- Diğer 25 ismin önceki otomatik sahne eşleşmesi aynı kalır. Galmeşin için bitmemiş bir dosyaya bağlantı eklenmedi.
- Hızlı isim değişiminde geç yüklenen eski görsel yeni sahnenin üzerine yazamaz. Yükleme hatasında mevcut yedek sahne devreye girer; yeniden seçimle denenebilir.
- Görseller assets/berhetiyye-premium/scenes/ altında toplandı. Üç yeni PNG özgün 948 × 1659 çözünürlüğünde ve kaynak dosyasıyla bire bir aynı; yeniden sıkıştırılmadı.
- Yeni arka planlar Service Worker önbelleğine dahil edildi.

Korunan davranışlar:
- Berhetiyye tek çark tasarımı aynı dosyayı kullanır: assets/berhetiyye-premium/berhetiyye-ring-r819.png.
- Çarkın animasyon kodu ve saat yönünün tersine dönüşü aynıdır. Tema stilleri değiştirilmedi.
- r836 otomatik sayım koruması korunur: aynı isim otomatik sayılırken elle dokunma/+1 ikinci tekrar üretmez ve kullanıcıya önce duraklatması bildirilir.
- r836 Tempo · Bendir · Zikir ayarları erişimi ve mevcut ses/ritim kontrolleri korunur.

## GitHub kurulumu

- Mevcut sürüm r836 ise SUKUN_r837_GITHUB_GUNCELLEME.zip içeriğini site köküne yükle. Klasörleri mevcut klasörlerle birleştir ve aynı adlı dosyaları değiştir.
- Sürüm farklıysa veya bilinmiyorsa SUKUN_r837_TAM_PAKET.zip kullan.
- ZIP dosyasını olduğu gibi yüklemek yerine içeriğini aç: index.html, nero.html, sw.js, manifest.webmanifest ve sürüm dosyaları site kökünde; assets klasörü aynı kökün altında kalmalıdır.
- Güncelleme ZIP'i boş site kurulumu değildir; r836'daki diğer dosyalara dayanır. Tam paket bağımsız kurulum içindir.
- Yayından sonra nero.html?v=r837 adresini aç. Uygulama sürümü r837 olmalıdır. Kullanıcı kayıtlarını ve yerel depolamayı silmek gerekmez.

## Doğrulama

180/180 kontrol geçti: 126 sayaç/ses regresyon, 20 DOM/CSS, 11 Service Worker, 15 elle sayım/ayar ve 8 arka plan bağlam/yükleme testi.
57 sabit kaynak yolu ve 75 önbellek yolu doğrulandı. 121 mevcut asset ve sabit çark dosyası r836 ile SHA-256 bakımından aynı. Üç yeni kaynak görselin baytları aynen korundu.
İki ZIP'in içeriği, CRC değerleri ve r836 üstüne güncelleme uygulanınca tam pakete eşitliği kontrol edildi.

Bu testler kaynak/DOM/VM kontrolleridir. Canlı site, Android Chrome çizimi, gerçek dokunma/scroll ve ses donanımı üzerinde bu sürüm doğrulanmadı.

Telefonda kısa kontrol: Berhetiyye kilidini aç → arka planı Otomatik seç → Berhetîhin, Hûtîrin ve Kalnehûdin yükle → her birinde aynı çarkı ve yeni sahneyi kontrol et → Tefekkür'e geç → 99 Esmâ'ya dön. Elle sahne seçimini, hızlı isim geçişini ve çevrimdışı yeniden açılışı da kontrol et.
