# SÜKÛN r1097 — WebM kayıt başlığı düzeltmesi

Uzun MediaRecorder WebM/Opus dosyalarındaki uzunluğu açık bırakılmış ardışık Cluster öğeleri r1096'da iç içe okunuyordu. Bu durum geçerli kayıtlarda derinlik sınırına ulaşıp `PREP_INVALID_HEADER` hatası oluşturuyordu. Paketlenmiş jenerik arşivdeki Âyetü’l-Kürsî (`koruma:0`) dahil 38 kayıt bu hatayı yeniden üretiyordu.

r1097, sonraki Segment alt öğesini gerçek EBML öğe sınırında algılayarak açık Cluster'ı kapatır. Ses verisi içinde bayt dizisi aramaz. Uzunluğu belirli Cluster'ın içine yerleştirilmiş başka bir Cluster, kesilmiş dosyalar ve desteklenmeyen belirsiz öğeler reddedilir. Derinlik, öğe sayısı, kanal, süre, kaynak boyutu ve ortak bellek korumaları sürer.

Analiz kaynak ses baytlarını değiştirmez. Stüdyo sınırları doğrulanmış 60 saniye, 8 MiB kaynak ve 32 MiB ortak hazırlama belleğidir; WebM için bir saniyelik güvenlik payı korunur. Bu düzeltme daha uzun kayıt desteği eklemez.

Test kapsamı ve son kaynak/kanıt kimlikleri `tests/r1097/verification.json` içindedir. Tarayıcı testleri, ayrı ve geçici Chromium profilinde uygulamanın paketlenmiş ses dosyalarını kullanır; kullanıcının kişisel kayıtları okunmaz. Fiziksel Android ekran kilidi ve duyulan ses bu testlerin kapsamında değildir.
