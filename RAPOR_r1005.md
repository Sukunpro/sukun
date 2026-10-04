# SÜKÛN r1005

r1004 denetimindeki 23 doğrulanmış uygulama bulgusu için kod düzeltmesi ve üretim kaynaklarını çalıştıran kabul kontrolleri eklendi. Bu paket yayınlanmadı; kullanıcının verileriyle işlem yapılmadı.

## Sonuç ve sınırlar

- 88 regresyon grubundan 85 PASS, 3 NOT_RUN, 0 FAIL. Tarihî r999, r1001 ve r1003 kaynak örnekleri verilmediği için bu üç grup çalıştırılmadı. Güncel dosyalar geçmiş sürüm diye kullanılmadı. QA-01 tam 88/88 doğrulama bakımından açık; koşucu artık eksik girdiyi uygulama hatasından ayırıyor.
- 14 hedefli kabul grubu PASS. Testler bu paketin içinden ve yalnız paket içi kaynaklarla çalıştırıldı.
- 272 JavaScript blok/dosyası sözdizimi, 44 runtime hash/SRI, 8 artwork ve index/nero/SW/manifest sürüm eşliği PASS.
- Gerçek tarayıcı çizimi, native service worker geçişi, fiziksel Android/Xiaomi/iOS, mikrofon/hoparlör, ekran kilidi ve TalkBack/VoiceOver NOT_RUN. Tarayıcı çalıştırıcısı kurulamadı. Model testleri bu kontrollerin yerine geçmez.
- Denetimde doğrulanmamış üç sayaç/ses hipotezi (A-RISK-01/02/03) bu sürümde giderilmiş sayılmadı.

## Değişen davranış

İki tam yedek düğmesi de yerel ses ve özel ambiyansı alır. Kilitli özel günlük/not/seans içeriği dışa aktarılmaz; API anahtarları hariç tutulur. Kayıtlı terkipler ad, sıra ve indeksleriyle taşınır; bozuk veri yazımdan önce reddedilir. Tüm verileri silme işlemi iki ses veritabanının işlem tamamlanmasını ve boşaldığını kontrol eder; başarısız işlemi başarılı göstermez. Silme işlemi geri alınamaz; hata olursa kısmi silme olabilir ve arayüz bunu açıkça bildirir.

Ses yedeği 64 MiB sınırı içinde parçalara bölünür. 33 × 1,5 MiB sentetik kayıt iki dosyaya bölünüp gerçek içe aktarma koduyla geri yüklendi; 33 kaydın içerik hashleri eşleşti. Tek başına sınırı aşan kayıt reddedilir. Tarayıcı çoklu indirme izni isteyebilir; bütün parçalar saklanıp geri yüklenmelidir. Normal tam yedeğin mevcut biçimi ve içe aktarma sınırı ayrıca değiştirilmedi.

Depo doluyken yeni kasa parolası kaydedilmiş gibi gösterilmez; eski şifreli içerik korunur. Başka sekmenin reddettiği Tekke başlangıcı mevcut kurtarma kaydını ezmez; bilinçli kurtarma kaydı silme de sekme sahipliğiyle yapılır.

Görünür dönüş kullanıcının Duraklat kararını korur; geciken AudioContext resume işleminden sonra da yeniden kontrol eder. Journey görünür dönüşte donmuş durumdan çıkar. Eski sayfanın runtime dosyaları korunmuş eski cache ve eski manifest hashleriyle doğrulanır; eksik veya bozuk eski çalıştırılabilir dosyalar yeni sürümden ödünç alınmaz. Cache'te eski sürüm bulunmaması, bozuk cache veya tarayıcının cache tahliyesi yine çevrimdışı kullanımın sınırıdır. Güncelleme kuyruğu başka sekme etkinleştirdikten sonra ancak önceden verilmiş güncelleme onayı ve boşta olma koşuluyla tamamlanır.

Alt bölüm menüsü/toplam sayacı, Sade/Odak dil seçimi, İngilizce arama ve temel etiketler düzeltildi. Arama ve yardım pencerelerinde ilk odak, Tab sınırı, arka plan inert durumu ve kapanışta odağın geri dönmesi düzenlendi. Bölüm açılma etiketleri ve kayıt/kullanıcı adı düğmelerinin erişilebilir adları düzeltildi.

## Bulgu eşlemesi

Tüm satırlar kaynak/VM kabulü düzeyinde geçti. Test yolları `tests_r1005/` altındadır.

| Kimlik | Öncelik | Bulgu | Kabul testi |
| --- | --- | --- | --- |
| ST-01 | P1 | “Tam yedek indir” ses kayıtlarını yedeklemiyor | `storage/test_storage_fixed.cjs` |
| ST-02 | P2 | Kilitli özel içerik yedek yollarından dışarı çıkabiliyor | `storage/test_storage_fixed.cjs` |
| ST-03 | P1 | Tam yedek–geri yükleme kayıtlı terkip kitaplığını kaybediyor | `storage/test_storage_fixed.cjs` |
| ST-04 | P1 | “Tüm veriler” temizliği ses veritabanlarını bırakıyor | `storage/test_storage_fixed.cjs` |
| ST-05 | P2 | Başlatması reddedilen sekme Tekke kurtarma ilerlemesini sıfırlıyor | `storage/test_tekke_checkpoint.cjs` |
| ST-06 | P1 | Ses yedekleyici kendi içe aktarıcısının açamadığı dosya üretiyor | `storage/test_audio_parts_fixed.cjs` |
| ST-07 | P2 | Depo doluyken güvenli yedek parolası değiştirilmiş gibi gösteriliyor | `storage/test_persistence_quota.cjs` |
| SW-01 | P2 | Eski sayfa için runtime sürümü korunmuyor; çevrimdışı geri dönüş bozuluyor | `storage/test_sw_fixed.cjs` |
| SW-02 | P2 | Başka sekmenin etkinleştirdiği güncelleme, kuyrukta kalıp sayfayı eşitlemiyor | `storage/test_version_conflicts.cjs` |
| BG-01 | P1 | Görünür dönüş hızlandırıcısı kullanıcının Duraklat kararını aşıyor | `background/lifecycle_runtime_test.cjs` |
| BG-02 | P2 | Resume olayı gelmeyen dönüşte Journey V2 donmuş kalıyor | `background/journey_lifecycle_flags_test.cjs` |
| UI-01 | P2 | Alt bölüm menüsü ve toplam sayacı için r986 montajı erişilemeyen dalda | `ui/source-traces-checks.cjs` |
| UI-02 | P2 | Sade/Odak kabuğunda doğrudan dil değiştirme yolu yok | `ui/source-traces-checks.cjs` |
| UI-03 | P2 | EN dilinde kayıt güvenliği uyarısı ve temel denetimler hâlâ Türkçe | `ui/ui-regression-checks.cjs` |
| UI-04 | P2 | Genel arama, kendi örneği olan yağmur/ambiyans seslerini bulmuyor | `ui/semantic_ui_fixed.cjs` |
| UI-05 | P2 | EN Zikir anlam araması yalnız Türkçe veride eşleşiyor | `ui/source-traces-checks.cjs` |
| UI-06 | P3 | Genel aramada ilk ArrowUp son sonucu atlıyor | `ui/ui-regression-checks.cjs` |
| UI-07 | P2 | Genel arama modalinin Tab odağı sayfaya kaçıyor | `ui/dialogs_fixed.cjs` |
| UI-08 | P2 | Eski yardım/kayıt sheetleri modal semantiği ve ilk odak yönetimi taşımıyor | `ui/dialogs_fixed.cjs` |
| UI-09 | P2 | Mihrap bölüm başlıklarında aria-expanded görünür durumun tersinde | `ui/semantic_ui_fixed.cjs` |
| UI-10 | P3 | Kullanıcı adını kaydetme eylemi EN dilinde ses kaydı gibi etiketleniyor | `ui/ui-regression-checks.cjs` |
| UI-11 | P3 | Kayıt düğmesinin erişilebilir adı iki kez okunuyor | `ui/ui-regression-checks.cjs` |
| UI-12 | P2 | Klavye odağının açtığı ipucu, Nasıl? yardım eylemini engelliyor | `ui/dialogs_fixed.cjs` |

## Tek paketin içeriği

245 assetin tamamı korundu; resim ve ses dosyaları silinmedi veya yeniden sıkıştırılmadı. Yalnız beş runtime dosyası değişti. Önceki integration sürümleri yeniden paketlenmedi. Tek güncel regresyon ağacı, gerekli gerçek tarihî fixture dosyaları, r1004 SW karşılaştırma kaynağı, hedefli kabul testleri ve güncel kanıtlar aynı ZIP'tedir. Üretim dosyaları `GITHUB_DOSYA_LISTESI_r1005.txt`, tam paket kapsamı `PAKET_DOSYALARI_r1005.json` ile belirlenir. Paketleme tüm çalışma ağacını toplamaz. Eski çalışma dosyaları kaynak arşivden silinmedi.

## Yeniden çalıştırma

Python 3, Node.js ve Pillow gerekir; tarayıcı gerektirmeyen testler:

```sh
python3 integration/r1005/verify.py
python3 integration/r1005/run_regressions.py
python3 tests_r1005/run_acceptance.py
```

Tam test sonuçları `integration/r1005/evidence/r1005_regression_runs.json`, `tests_r1005/acceptance_results.json` ve `BULGU_DURUMU_r1005.json` içindedir. NOT_RUN satırları başarılı test sayısına dahil edilmez.
