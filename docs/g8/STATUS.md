# SÜKÛN — G8 durum ve kabul kaydı

Kaynak tabanı: **r1117**, `5459587e2a4ce794683908c1b098076b3f2eb081`.
Tarih: **19 Ekim 2026**. Bu çalışma geliştirme araçları ve belge ekidir;
uygulama sürümünü veya dağıtım envanterini değiştirmez.

## Plandaki gerçek durum

`README-r1095.md` içindeki planın G6 maddesi r1107'de, G7 maddesi r1108'de
tamamlandı. G8 **açık / kısmi** durumdadır. G8'in özgün teslimi görsel
referans haritası ile küçük, geri alınabilir ortak CSS/JS taşımalarıdır.

| Eşit ağırlıklı başlık sayımı | Kapalı | Kalan |
| --- | --- | --- |
| Hata + geliştirme ana planı | 14 / 15 = %93,3 | 1 / 15 = %6,7 |
| Yalnız G1–G8 geliştirme planı | 7 / 8 = %87,5 | 1 / 8 = %12,5 |

Bu oranlar iş saati, takvim, kod satırı veya kalan mühendislik emeği tahmini
değildir. Sonradan gelen talepler ve fiziksel cihaz kabulü bu paydaya dahil
değildir. G8'in kendi tamamlanma yüzdesi için sabit bir taşıma listesi henüz
kabul edilmediğinden ayrıca yüzde verilmez.

## Yayındaki ortak CSS taşımaları

| Kaynak | Bayt | Kanıt |
| --- | ---: | --- |
| `css/category-flow-r1109.css` | 1.987 | `tests/r1109/category-flow-extraction.cjs` |
| `css/tooltip-help-r1110.css` | 1.721 | `tests/r1110/tooltip-help-extraction.cjs` |
| `css/notification-layout-r1111.css` | 4.990 | `tests/r1111/notification-layout-extraction.cjs` |
| `css/tekke-set-card-r1112.css` | 7.182 | `tests/r1112/tekke-set-card-extraction.cjs` |
| `css/name-info-r1115.css` | 5.642 | `README-r1115.md` ve güncel dosya |
| **Toplam** | **21.522** | **Beş taşıma** |

Bu toplam, satır içi CSS'ten dış dosyalara alınan bu beş gövdeyi ölçer;
uygulamanın tamamının modülerleşme yüzdesi değildir. HTML'de kalan stillerin
tamamını silme veya taşıma kararı verilmiş değildir.

**Eski metadata uyarısı:** `sukun-build-r1117.json` içindeki `g8PlanPhase`
alanı hâlâ `fourth-shared-css-extraction` değerindedir. Beşinci taşıma r1115
ile sevk edilmiştir. Bu alan tamamlanma hesabının otoritesi değildir. Sonraki
üretim sürümü hazırlanırken metadata, o sürümün envanter ve bütünlük işlemiyle
birlikte güncellenmelidir; bu belge ekinde r1117 üretim baytları değiştirilmez.

## Bu adımın çıktısı

`tools/visual-reference-map.cjs` güncel dağıtım envanterinden tekrar
üretilebilen, salt okunur bir görsel referans haritası oluşturur.
`visual-reference-map.json` o aracın r1117 üzerindeki anlık çıktısıdır.
Yöntemin kesin kapsamı, çözülmemiş başvuruları ve hata listesi JSON'un
içindedir. Harita, çalışma zamanında tüm olası seçici ve dalların yürütüldüğü
veya başvuru görülmeyen bir dosyanın kullanılmadığı anlamına gelmez.

Genişletilen r1117 haritası **295 görsel dosyasının** gerçek boyut ve SHA-256
değerini doğrular; **88 statik seçim eşlemesini** ve **26 aynı bayt grubunu**
ayrı gösterir. İlk haritadaki 38 eşlemeye 50 çark seçimi eklendi.
Envanter dışında görünen tarihsel metin başvuruları, eksik bir aktif görselin
kanıtı olarak sayılmaz; incelenecek gözlemler olarak tutulur.

`tools/wheel-catalog-map.cjs` yalnız bilinen kaynak biçimlerini tanır:
premium, klasik, native ve woven üreticileri ile bunların gerçek katalog
map/concat bağlarını denetler. **54 çark seçimi / 37 ayrı yol** çıkarır:
Berhetiyye 31, Esmâ 23 seçim. Şablon kodunu çalıştırmaz. Tanım veya tüketici
biçimi değişirse ilgili kapsam açık kalır; güvensiz/tekrarlı veri başarılı
katalog olarak sunulmaz. Çözülen genel tarama gözlemleri tam kaynak
konumuyla eşleştirilir; aynı satırdaki ilgisiz benzer şablon açık kalır.

Eski seçim adları, dönüştürülmüş görsel varyantları ve gerçekten aynı baytları
taşıyan dosyalar ayrı ilişkiler olarak değerlendirilir. Aynı SHA-256, dosyanın
silinmesinin güvenli olduğunu veya bir seçim adının diğerine yönlendirildiğini
kanıtlamaz. Dinamik yol üretimi gözden geçirme gerektirir.

## G8'i kapatmadan önce

- [ ] Haritanın statik kapsamının dışındaki dinamik görsel üreticileri
  incelensin; her biri için açık bir karar ve kanıt kaydedilsin.
- [x] Sonraki küçük CSS taşıma listesi ve her parçanın mevcut sahibi
  belirlendi: `NEXT_BATCH.md` ve `next-batch.json`. Üç gövdenin toplamı
  9.173 bayt; henüz taşınmadı. Yinelenen katman kaldırılmadan karşılığı
  kanıtlanmalı.
- [ ] Seçilen her taşımada ID, yükleme sırası, CSS göreli yolları ve mevcut
  olay/ses sahipliği korunsun; uygun kaynak ve tarayıcı regresyonları geçsin.
- [ ] Son üretim paketinde eski görsel bağlantıları, Klasik/Feyz görünümü,
  dosya bütünlüğü, service worker yükseltmesi ve desteklenen sürüm geri dönüşü
  birlikte kabul edilsin.

Görsel haritanın oluşması tek başına bu dört kabulü kapatmaz. Eski varlıklar
bu adımda kaldırılmaz. Her taşımanın kapsamına göre fiziksel Android,
kilit ekranı, duyulan ses ve işletim sistemi ses odağı kabulü ayrıca izlenir;
statik dosya kontrolleri bunları doğrulamaz.

## Yeniden üretme ve doğrulama

Depo kökünden:

```bash
node tools/visual-reference-map.cjs --root . --output docs/g8/visual-reference-map.json
node tests/g8/visual-reference-map.cjs
node tests/g8/wheel-catalog-map.cjs
node tests/g8/wheel-map-integration.cjs
node tools/release-integrity.cjs .
```

Aracın sentetik hata girdileri kendi geçici ağaçlarını kullanır. İlk G8
kontrol noktasındaki üretim bütünlüğü **1.529 / 1.529** geçti. Bu sonuç yalnız
r1117'nin tam yerel üretim baytları, sürüm/SRI/SHA-256/sözdizimi ve mevcut
harici CSS denetimi içindir; yeni bir fiziksel cihaz testi değildir.

G6/G7 ve mevcut ortak CSS için ilk kontrol noktasında on odaklı suite çalıştırıldı:
**262 / 262** kontrol geçti. Bunlar depoları ve arayüzü kontrollü VM
girdileriyle, CSS taşımalarını ve kaynak denetimini statik dosya girdileriyle
sınar. Bu sayı tarayıcı/gerçek cihaz kabul sayısına eklenmez.

Bu genişletmede üç güncel grup yeniden çalıştırıldı: ana harita **13 / 13**,
çark çözümleyici **17 / 17**, bütünleşim **5 / 5**. Toplam **35 / 35** araç
kontrolü geçti. Ana harita testleri eksik/değişmiş dosya, yol sınırı,
sembolik/sabit bağlantı üzerinden üzerine yazma ve aynı çıktıyı denetler.
Çark testleri tanım/tüketici değişikliği, tekrarlı/güvensiz veri ve
çalıştırmadan çözümlemeyi sınar. Yalnız açıkça etiketlenmiş bütünleşim testi,
değişmemiş ilk çark modülünü kontrollü VM'de çalıştırıp 54 seçimi bağımsız
karşılaştırır; araç üretim JavaScript'ini çalıştırmaz.

Haritanın güncel kaynaktan yeniden üretim kontrolü de geçti. Üretim baytları
aynı kaldığı için 1.529 ve 262 sayıları önceki kontrol noktasının korunmuş
kanıtlarıdır; bu genişletmede yeniden koşulmuş sayılmaz. Makine kaydı:
`tests/g8/verification.json`.
