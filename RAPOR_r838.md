# SÜKÛN r838 — düzeltme ve kurulum

r837 üzerine hazırlanmıştır. Mevcut tek Berhetiyye çarkının resmi ve animasyon kodu korunmuştur.

## Düzeltilenler

- Berhetiyye Atlası başlığı, bilgi hücreleri ve isim detayları dar ekranda satıra sarılır; kart yüksekliği metne göre büyür.
- Zikir ayarları düğümü sayaç yeniden yerleşiminde korunur. Açılan panel özgün tempo, bendir ve usûl kontrollerini kullanır.
- Berhetiyye Hedef/Kalan kutuları ve −1/+1 kontrolleri mevcut premium görsellerle giydirildi.
- Bütün Süleyman sahneleri `assets/berhetiyye-premium/` altında toplandı; çalışma zamanı ve önbellek yolları buna göre güncellendi.
- Başarısız sahne yüklemesi her sayaç yenilemesinde yeniden denenmez; kullanıcı yeniden seçim yaparak tekrar deneyebilir.
- Tekke/Neuro ekranını yalnız açmak etkin zikri durdurmaz. Yeni bir ses oturumu başlatmak ayrı bir eylemdir.
- Kayıtlı sesin arka plana devrinde yeni ses başlamadan önce mevcut ses kesilmez. Gecikmiş ve iptal edilmiş devretmeler sayacı etkilemez.
- Arka planda duyulan kayıt döngüleri ve tamamlanan TTS okumaları bir kez sayılır; duraklama/bekleme süresi sayılmaz. Görünür ekrana dönüşte aynı tekrarlar yeniden eklenmez.
- Aynı isim otomatik sayılırken manuel sayaç ekleme koruması, erişim kilidi ve normal Esmâ için Mevlevi görünümü korunmuştur.

## GitHub yüklemesi

1. Güncelleme ZIP’ini aç; içeriğini mevcut r837 depo köküne, klasör yapısını koruyarak yükle. Yeni bir `sukun-r838` alt klasörü oluşturma.
2. `nero.html`, `index.html`, `sw.js`, manifest ve sürüm dosyalarıyla birlikte **assets klasörünü de yükle**. Yalnız HTML yüklemek sahne hatasını çözmez.
3. GitHub Pages dağıtımı tamamlanınca uygulama sürümünün r838 olduğunu kontrol et.
4. `assets/berhetiyye-premium/scenes/` eski kopyaları artık kullanılmaz; yeni bütün sahneler bir üst klasördedir.

## Sahne eşleştirmesi

| Seçim | Dosya |
|---|---|
| Billur Saray | berhetiyye-palace.png |
| Sırlar Sarayı | scene-01-billur.png |
| Asa | scene-02-asa.png |
| Şelale | scene-03-selale.png |
| Rüzgâr / Teras | scene-04-teras.png |
| Kristal | scene-05-kristal.png |
| Mühür / Yüzük | scene-06-yuzuk.png |
| Mor Kristal | scene-07-mor-kristal.png |
| Ayasofya / Billur | scene-08-ayasofya-billur.png |
| Berhetîhin | scene-09-berhetihin-billur-r837.png |
| Hûtîrin | scene-10-hutirin-adalet-r837.png |
| Kalnehûdin | scene-11-kalnehudin-ruzgar-r837.png |

Otomatik seçim son üç ismi doğrudan ilgili sahneye bağlar. Diğer isimlerin önceki eşleştirmeleri korunur. Elle seçilmiş sahne kullanıcı tekrar Otomatik seçeneğine dönene kadar korunur. Görseller yalnız erişimi açık ve yüklenmiş bir Berhetiyye ismi bağlamında etkindir.

## Doğrulama ve sınırlar

197 otomatik kontrol geçti. 219 JavaScript bölümü/service worker sözdizimi doğrulandı. 75 önbellek dosyası mevcut; 112 mevcut görselin baytları korunmuştur.

Gerçek tarayıcı görüntü doğrulaması ve Android kilit ekranı testi yapılmadı. Tarayıcı/işletim sistemi sayfayı dondurur veya kapatırsa web sayfası kesintisiz çalışma garantisi veremez. Bu paket görünür/gizli geçişlerde uygulama kaynaklı durdurmayı ve çift sayımı düzeltir; fiziksel cihaz davranışı ayrıca denenmelidir.

Cihaz kontrolü: kendi kayıtla ve TTS ile ayrı ayrı zikir başlat; ayarlardan tempo/bendir değiştir; ekranlar arası geç; telefonu kilitle; sesin sürmesini, açınca sayacın yalnız tamamlanan tekrarları eklemesini ve hedefte sonraki isme geçişi kontrol et.
