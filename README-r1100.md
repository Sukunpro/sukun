# SÜKÛN r1100 — Tefekkürde özgün metin ve anlam

Tefekkürde “Aktif zikrin özgün metni ve anlamı” düğmesi, gizlenen Okumalar grubuna yönelmek yerine mevcut tek okuyucuyu yerel bir dialog içinde açar. Anlam bölümü açık gelir. Kapat veya Escape aynı düğmeye odağı döndürür; normal görünümde okuyucu eski konumunda çalışır.

Dialog açmak ve kapatmak ses oturumu edinmez. Mevcut okuyucu düğümü, seçim olayları, sayaç ve çalan zikrin sahipliği korunur. Dil veya ses ayarı değişiminde aynı pencere kalır; tefekkürden çıkışta, sekme değişiminde ve seçili Berhetiyye içeriğinin erişimi kaldırıldığında kapanır. Pencere dar ekranda kendi içinde kaydırılır ve yerel klavye odağı sınırını kullanır.

r1099'un uzun kayıt incelemesi bu sürüme dahildir: en çok 180 saniye ve 8 MiB kaynak için doğrulanmış süre ve boyut sunulur. 60 saniyeyi aşan kayıt çözülmez, düzenlenmez ve ona örnek tabanlı tepe/RMS/dalga değeri atanmaz. Ses düzenleme/çözme 60 saniye ve 32 MiB ortak hazırlama bütçesiyle sınırlıdır. WebM süre üst sınırında bir saniyelik güvenlik payı vardır. Kayıt değiştiğinde eski analiz göstergeleri temizlenir. Ayrıntı: README-r1099.md.

## Doğrulama

- `node tests/r1100/reader-browser.mjs`: değişmeyen üretim dosyalarıyla üç ekran boyutunda yerel Chromium dialog, aç/kapat/Escape, odak, kaydırma, dil/seçim yenilemesi, erişim iptali ve sentetik kayıtla gerçek oynatma sürekliliği.
- `node tests/r1099/studio-regression.mjs`, `node tests/r1099/native-browser.mjs`, `node tests/r1099/ui-browser.mjs`: süre/bellek/kaynak sınırları ve Stüdyo arayüzü.
- `node tests/r1075/reading-summary-browser.cjs . tests/r1100/evidence/regressions/reading-summary.json` ve `node tests/r1068/yasin-picker-browser.cjs . tests/r1100/evidence/regressions/yasin-picker.json`: Klasik/Feyz ve Yâsîn kontrolleri.
- `node tests/r1067/scroll-races.cjs . tests/r1100/evidence/regressions/scroll-races.json`: gerçek tarayıcı dokunma olaylarıyla kaydırma ve sürükleme. Eski 250 ms bekleme r1098'de de erken ölçüm yapıyordu; test artık sınırlı süre içinde gerçek Max yerleşimini bekler.
- `node tools/release-integrity.cjs` ve `node tools/full-release-export.cjs`: sürüm/SW/SRI, bütün dosya hashleri ve üretim yedekleme dışa aktarımı.

Sonuçlar `tests/r1100/verification.json` ile kaynak hashlerine bağlanır. Yerel testler geçici tarayıcı profili ve açıkça belirtilmiş sentetik ses kullanır. Fiziksel Android dokunması, duyulan ses, mikrofon veya işletim sistemi ekran kilidi bu doğrulamanın kapsamı değildir.
