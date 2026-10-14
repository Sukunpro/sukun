# SÜKÛN r1064 — Arapça okuma, kaynak seçimi ve Yâsîn

Bu sürüm r1063 main commit `1c838e6c0903e79163e4c281ce03b423944eb0ff` üzerine hazırlandı. Mevcut sayaç, kayıt anahtarları, kişisel ve jenerik depolar değiştirilmez.

## Kullanım

Zikir → Ek ayarlar → Kayıt araçları → Okumalar altında **Özgün metin, okunuş ve anlam** ve **Yâsîn sûresi · 83 âyet** bulunur. İlgili mevcut dua kartları da bu görünüme bağlantı verir.

İçerik seçimi (eski davranış / özgün Arapça / Türkçe anlam) ile ses kaynağı (otomatik / Arapça TTS / Türkçe TTS / yalnız kişisel / yalnız jenerik) bağımsızdır. Son açık seçim saklanır. İlk güncelleme, eski kullanıcının seçimini zorla değiştirmez. Kaydın dili veya türü bilinmiyorsa mevcut dosya başka içerik olarak yeniden sınıflandırılmaz. Eski otomatik seçim ve kayıt önizlemesi korunur.

Arapça metin RTL; Latin okunuş ve Türkçe anlam LTR gösterilir. Anlam isteğe bağlı açılır. Arapça dinleme doğru dilde cihaz sesi ve aynı özgün metin gerektirir; eksik kaynak veya ses için açıklama vardır. Türkçe anlam, Latin okunuş değildir. Cihaz TTS’si tecvidli kıraat kaydı olarak sunulmaz. Tarayıcı uygun erkek Arapça ses sunmazsa böyle bir ses varmış gibi etiketlenmez; adı ve diliyle mevcut ses seçilebilir.

## Metin kaynakları ve kullanım koşulları

| İçerik | Kaynak / eşleştirme | Durum |
| --- | --- | --- |
| Yâsîn 36:1–83 | Tanzil Project, Quran Text v1.1, Uthmani görünüm ve Simple ses metni | 83 sıra, tam metin ve ayrı besmele, kaynak satırlarıyla denetlendi |
| Yâsîn Türkçe meal | Elmalılı Muhammed Hamdi Yazır’ın tarihî özgün meali; Vikikaynak Yâsîn sürüm 150714, 6 Mayıs 2022 | 83 ayet işaretiyle kaynak aktarımı denetlendi; özgün baskı taraması bağımsız karşılaştırılmadı |
| Ayetel Kürsi / Fatiha | Mevcut özgün metinler ve ayrı Latin/anlam alanları; Kur’an kaynakları katalogda | Kaynak ve exact metin sınırları kayıt bazında gösterilir |
| İstiğfar, tevhid, Esma ve salavat | Aynı kısa metin/nüsha için klasik kaynak tanıkları katalogda | Doğrulanan / kısmi / bekleyen ayrılır; farklı metin sessizce ikame edilmez |
| Delâil açılış, sekiz hizb, kapanış | Mevcut paketlenmiş Türkçe metin korunur | Aynı baskıya ait tam özgün Arapça kaynak bekleniyor |
| Hizbü’l-Vikâye | Mevcut 13 bent ve kapanış sürümü korunur | İlk bulunan Arapça nüsha aynı değildir; özgün karşılık bekleniyor |

Tanzil: <https://tanzil.net/> · <https://tanzil.net/docs/text_license>. Arapça metin CC BY 3.0 ve Tanzil’in aynen koruma/atıf koşullarıyla kullanılır. Uthmani ve Simple için tam telif bildirimi veri dosyasında bulunur. İki yazımın verisi birbirine dönüştürülmez; her biri kendi yayımlanmış kaynak satırlarıyla aynıdır.

Türkçe meal: <https://tr.wikisource.org/w/index.php?title=Kur%27an/Y%C3%A2s%C3%AEn_Suresi&oldid=150714>. Atıf: Muhammed Hamdi Yazır; Vikikaynak katkıda bulunanlar. Aktarılan metin CC BY-SA 4.0 ile paylaşılır: <https://creativecommons.org/licenses/by-sa/4.0/>. Ayet işaretleri metinden ayrı alanlara ayrılmıştır; tarihî kaynak yazımı değiştirilmemiştir. Bu bildirim atıf verilen metin içindir; çevresindeki uygulama kodunun lisansını değiştirmez. Ticari kullanımı kısıtlı Tanzil Türkçe meal indirmesi pakete alınmadı.

## Açık eşleştirme eksikleri

Delâil’in 10 bölümünün aynı baskıya ait Arapça sayfaları/kapak-künye bilgisi olmadan tam eşleştirme yapılmış sayılmaz. Açılıştaki **101 Esma** ve **200 Peygamber ismi** korunur; standart 99 listesine indirilmez. Kapanıştaki kolofon, açıklama ve kişisel not/şiir, yeni özgün veya anlam kuyruğunda dua gibi okutulmaz; eski metin alanı silinmez. Devam sayfası ve farklı nüsha notları katalogda gösterilir.

Hizb ve bazı özel salavat/Esma-tevhid biçimleri için aynı özgün nüsha beklenir. Latin metinden geri çeviri veya Arapça uydurma yapılmadı. Kısa “Sübhanallahi ve bihamdihi” ile birleşik metin ayrı kimlikte tutulur; tekrar hedefleri değişmez. Delâil’in mevcut kişisel kayıtları kullanıcının beyanı uyarınca **Türkçe anlam** yolunda seçilebilir; Arapça özgün yolunda kullanılmaz. Diğer içeriği belirsiz sesler otomatik yeniden sınıflandırılmaz.

Kayıt bazındaki tüm kimlikler, sıra, mevcut metin özeti/hash, Arapça kaynağı, anlam kaynağı, durum ve nüsha notları `reading-source-inventory-r1064.json` ve çalışma zamanındaki kaynak görünümündedir.

## Doğrulama

Testler son r1064 üretim dosyaları üzerinde çalıştırıldı. Test grubuyla içindeki tekil kontrol sayısı ayrı tutulur.

| Kontrol | Sonuç | Kapsam |
| --- | --- | --- |
| Desteklenen proje regresyonları | 102/102 grup geçti | Mevcut sayaç, yerel/global kontroller, ambiyans/frekans arka plan sözleşmeleri, Tefekkür çıkışı, görünüm, kayıt ve yeni okuma testleri |
| Arapça metin bölme | 7/7 geçti | Arapça parçaların korunması, hareke, farklı alfabeler ve kısa/birleşik zikir sınırları |
| Yâsîn veri denetimi | 10/10 geçti | 83 Uthmani, Simple ve Türkçe satırın ayrı kaynak hashleri, sıra, besmele, atıf ve kullanım koşulları |
| Katalog | 30/30 geçti | Gerçek mevcut metinler, kimlikler, 101/200 isim ve 10 Delâil bölümü |
| Ses/içerik politikası | 24/24 geçti | Arapça/anlam ayrımı, kişisel/jenerik önceliği, uygun dil ve açık eksik kaynak hataları |
| Okuyucu sahiplik yaşam döngüsü | 8/8 geçti | Gerçek üretim kilit mantığı, geç kapanış, sekmeler arası koruma ve art arda başlatma |
| Gerçek r1063 → r1064 güncelleme kalıcılığı | 24/24 geçti | Native sentetik WAV hashleri; içe aktarım, üzerine yazmama, yenileme, tarayıcı yeniden açılışı, SW güncellemesi ve tekrar açılış |
| Tam Chromium uygulama denetimi | 52/52 geçti | Classic/Feyz, TR/EN, mobil ekranlar, TTS metin/dil, native kayıt sesi ve transport |
| Sürüm bütünlüğü ve tam paket | 1219/1219 geçti | JS sözdizimi, SRI, canonical HTML, sürüm/SW ve her dağıtım dosyasının hash'i |

Regresyon komutu: `python3 tests/r1049/run-regressions.py --source-root . --output-dir /tmp/sukun-r1064-qa`. Ayrı tarayıcı komutları `tests/r1064/README.md` içindedir. Kalıcılık için `tests/r1021/persistence-browser.cjs --root <r1063> --update-root <r1064>` kullanıldı. Kaynak fixture'ları cihaz sesi değildir; tam tarayıcı testi dağıtım dosyalarını SRI etkin olarak aynen yükler.

## Doğrulama sınırları

Kontrollü tarayıcı sesleriyle TTS’ye verilen gerçek metin/dil, sıralama ve uygulama davranışı denetlenir; bu, cihaz sesinin telaffuz kalitesini ölçmez. Native ambiyans taşıyıcısının zamanının ilerlemesi görünür sayfada denetlenir. Yazılımda gizlenme/arka plan sözleşmeleri mevcut regresyonlardadır. **Fiziksel Android kilit ekranı, gerçek cihaz TTS kullanılabilirliği ve hoparlör testi NOT_RUN**; bu sürüm telefon kilidindeki kesintinin fiziksel olarak çözüldüğünü iddia etmez.

Kalıcılık, gerçek kullanıcı kaydıyla değil izole Chromium profilindeki sentetik WAV kayıtlarıyla denetlendi. Bir ara denemede değiştirilmeyen r1063 tabanında tarayıcı yeniden açılışında aralıklı eksik metadata gözlendi. Bağımsız native IndexedDB ve değiştirilmeyen taban tekrarları geçti; uygulamanın dosya sildiği kanıtlanmadı, depolama kodu bu gözlem için değiştirilmedi. Son tutarlı r1063 → r1064 güncelleme koşusu 24/24 geçti.

Kaynak aktarımı doğrulaması, Delâil/Hizb aynı baskı eşleştirmesi veya Elmalılı özgün baskı taraması karşılaştırması yerine geçmez. Doğrulanmamış kısımlar arayüzde beklemede/kısmi görünür. Cihaz sesinin tecvidi ve dinlenebilir kalite ölçümü yapılmadı.
