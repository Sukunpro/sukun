# r1241 ses, çevrimdışı ve performans kabul planı

## Sonuçların kapsamı

Bu sürüm ses motorunu, kayıt sahibini veya çevrimdışı veri sözleşmesini performans varsayımıyla değiştirmez. HTML dosya boyutu tek başına yavaşlık kanıtı değildir. Başlangıç için yerel Linux Chromium çalıştırma denemesi, uygulama açılmadan `socket() failed: Operation not permitted` ile durdu. Bu nedenle yerel DCL, load, long-task, transfer ve ilk etkileşim değerleri **ölçülmedi**; sıfır veya başarılı kabul edilmez. Fiziksel Android/iPhone da bu ortamda yoktur.

`tests/performance/startup-browser.cjs` yetkili Chromium ortamında, değişmez r1240 ve r1241 kaynakları üzerinde ayrı ayrı üç yeni tarayıcı bağlamıyla çalıştırılır. JSON raporu kaynak/test SHA-256 değerlerini, sürümü, tarayıcı sürümünü, ham Navigation/Resource Timing değerlerini, long-task kayıtlarını, gerçek onboarding tıklamasından iki animasyon karesine süreyi ve sayfa JavaScript hatalarını ayrı kaydeder. Kaynakların ölçüm boyunca değişmediği doğrulanır. Çıktı INP veya gerçek telefon performans ölçümü değildir. Loopback, sıkıştırmasız HTTP, kısıtlanmamış CPU ve engellenmiş service worker koşulları raporda açıkça yazılıdır.

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/performance/startup-browser.cjs "$BASELINE" "$EVIDENCE/startup-baseline.json"
CHROMIUM_PATH=/usr/bin/chromium node tests/performance/startup-browser.cjs "$CANDIDATE" "$EVIDENCE/startup-candidate.json"
CHROMIUM_PATH=/usr/bin/chromium python3 tests/r1213/run-current-checks.py --scope full --upgrade-baseline "$BASELINE" --output "$EVIDENCE/full"
```

Raporları aynı makinede ve tarayıcı sürümünde karşılaştırın. Üç koşunun medyanını ve dağılımını kullanın. Uzun görevler için sayı, toplam süre ve en uzun süreyi; ağ için navigation dahil transfer/decoded byte değerlerini ayrı karşılaştırın. İlk etkileşim görünür değilse rapordaki `notRun` başarılı sayılmaz. Runtime hatası veya değişmiş kaynak varsa ölçümü kabul etmeyin. Ölçülmüş bir darboğaz bulunmadan yeni lazy-load uygulanmaz; özellikle ses/offline çekirdeklerini geciktirmeyin.

## Otomatik kabul matrisi

| Katman | Test | Kabul ve durum |
|---|---|---|
| Worker sözleşmesi | `tests/r1213/update-offline.cjs` | 14/14, r1240 değişmez baseline üzerinde geçti. Kesinti, retry, byte hash, range, iptal ve önceki medyanın korunması. Kontrollü VM, gerçek çevrimdışı tarayıcı değildir. |
| Ses yarışları | `tests/r1215-audio-races.cjs` | 8/8 baseline geçti. Geç başlayan/reddedilen sahip yeni oynatımı bozmamalı. |
| Frekans motoru | `tests/r1121/frequency-engine-contract.cjs` | 9/9 baseline geçti. Tek graph, durdurma, timer, sweep/pause. |
| Ses devri | `tests/r1121/frequency-handoff-contract.cjs` | 29/29 baseline geçti. Eski çözüm/rejection yeni sesi canlandırmamalı, mute korunmalı. |
| Başlangıç örtüşmesi | `tests/r1122/frequency-onset-contract.cjs` | 13/13 baseline geçti. Native/live eşzamanlı ses ve pending-stop güvenlikleri. |
| Mini kapı sesi | `tests/r1210/mini-door-audio.cjs` | Baseline geçti. Sessiz/sıfır seviye/kayıt/kilit/meşgul durumları. |
| Gerçek Chromium medya | `tests/r1124/media-wheel-native-browser.cjs` | Yerel çalıştırma BLOCKED: Chromium socket izni. CI'da 18 kontrolün tamamı gereklidir. HTMLAudioElement saati gerçektir; TTS kontrollüdür, kulaklık/OS düğmeleri fiziksel değildir. |
| Native upgrade/offline | `tests/r1213/release-upgrade-browser.cjs` | CI'da 8/8 gereklidir. r1240→r1241 yükseltme, çevrimdışı runtime hash, rollback ve kişisel veri/kayıt korunması. Yerel native sonuç mevcut değildir. |
| Nihai sürüm | `tests/r1213/run-current-checks.py --scope full` | Final kaynaklar dondurulduktan sonra yeniden çalıştırılır. Focused veya baseline pass, r1241 full acceptance yerine geçmez. |

## Ölçümün ilk turu ve sınırlar

r1241 adayının ilk CI turunda (86f661e, 2026-11-09) aynı Linux koşucusunda üç yeni bağlamla r1240 ve aday ölçüldü. Medyan DCL 3255→3291 ms, load 4963→4638 ms, long-task toplamı 3625→3325 ms ve tıklama→iki kare 98.9→83.4 ms oldu. DCL iyileşmedi; bu küçük örneklemden genel hızlanma sonucu çıkarılmaz. Sunucu `no-store`, loopback ve sıkıştırmasızdır; ölçülen yaklaşık 17 MB aktarım üretim ağı/cache davranışı değildir.

Aynı giriş sesinin preload ve fetch istekleri farklı sürüm sorgularıyla 288044 byte olarak iki kez gözlendi. Sonraki düzeltme doğrulanmış preload URL'sini yeniden kullanır. Son adayın yeni ölçümü Actions artefaktındadır; önceki adayın sonuçları yeni commit için başarı kanıtı değildir. Ses sahibi, süre, decode ve içerik hash denetimi korunur.

r1241 frekans-seti yarışı gerçek ayrı Chromium sekmelerinde test edilir. İlk Web Locks + localStorage denemesi native testte kayıp güncelleme verdi; bu nedenle son tasarım aynı IndexedDB readwrite işleminde güncel kaydı okuyup değiştirir. Kontrol edilen/fake IndexedDB testleri native sonucun yerine geçmez.

## Fiziksel cihaz kabul matrisi: tamamı BEKLİYOR

Her satırı Android Chrome + kurulu PWA, iPhone Safari + ana ekrana eklenmiş uygulamada ayrı çalıştırın. Cihaz/OS/tarayıcı sürümü, build, kaynak türü, beklenen ve gerçek davranış, süre ve gerektiğinde ekran kaydı ekleyin. Kişisel kayıt içeriklerini rapora yüklemeyin.

| Senaryo | Adımlar ve kabul ölçütü | Durum |
|---|---|---|
| Ekran kilidi | Kullanıcının seçtiği kayıtla başlat, 30 sn ve 5 dk kilitle, aç. Desteklenen native yol devam etmeli; çift ses/sayaç sıçraması/istenmeyen yeniden başlama olmamalı. | BEKLİYOR |
| Kilitte pause/resume | OS medya kontrolünden duraklat/devam et. Aynı kaynak/konum, tek aktif sahip; duraklamada sayaç ilerlemez. | BEKLİYOR |
| Gelen arama | Ses açıkken arama al/reddet/bitir. OS kesintisiyle tutarlı ve kullanıcıya anlaşılır durum; eski async iş sesi tekrar başlatmaz. | BEKLİYOR |
| Bluetooth | Kulaklık bağla, çıkar, yeniden bağla; fiziksel medya tuşlarıyla pause/resume yap. Çift ses ve istenmeyen hoparlör devamı olmamalı. | BEKLİYOR |
| TTS sınırlaması | Cihaz TTS'si ve kayıt yolunu ayrı dene; TTS arka plan kısıtını native kayıt başarısı gibi raporlama. | BEKLİYOR |
| Çevrimdışı yeniden açma | Çekirdek ve seçili sesleri doğrulanmış şekilde indir, uçak moduna al, uygulamayı kapat/aç. Shell açılır; indirilmiş ses çalar; eksik ses açık hata gösterir. | BEKLİYOR |
| İndirme kesintisi | İndirmeyi ağ keserek/iptal ederek durdur ve tekrar dene. Tamamlanan doğrulanmış dosyalar kalır, yalnız eksikler alınır; yanlış hazır etiketi yoktur. | BEKLİYOR |
| Güncelleme ve geri alma | Kayıt/ilerleme içeren kurulumda güncelle; ağ kesintisi ve desteklenen rollback uygula. Kişisel veri/kayıt korunur; yanlış sürüm karışmaz. | BEKLİYOR |
| Düşük depolama | Kota hatasında indirmenin başarısızlığı açık görünür; önceki çalışan shell ve kayıtlar silinmez. | BEKLİYOR |

Bu belge fiziksel testlerin yapıldığını veya bütün cihazlarda arka plan sesinin garanti edildiğini iddia etmez. Yayın özeti CI sonucunu ve bekleyen fiziksel kapsamı ayrı belirtmelidir.
