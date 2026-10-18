# SÜKÛN r1099 — Uzun kayıt incelemesi ve tefekkür okuyucusu

Tefekkürde “Aktif zikrin özgün metni ve anlamı” düğmesi, gizlenen Okumalar alanı yerine mevcut tek okuyucuyu görünür bir pencerede açar. Kapatıldığında okuyucu eski yerine döner.

Kayıt Stüdyosu, 8 MiB kaynak sınırı içinde doğrulanmış 180 saniyeye kadar kayıtların süre ve boyutunu salt okunur inceleyebilir. Paket içindeki Âyetü’l-Kürsî ve koruma kaydı bu yoldan incelenir. Uzun kayıtlar için decoder, CPU worker, WAV üretimi veya kayıt yazımı başlatılmaz. 60 saniyenin altında olsa bile çözümleme bellek bütçesine sığmayan bir analiz de yalnız süre/boyut sunabilir.

Bu sonuçta tepe, RMS ve dalga bilgisi üretilmez; ekranda boş kalır. WebM için gösterilen süre 1 saniyelik güvenlik payı içeren üst sınırdır. Örneğin 179 saniyelik bazı WebM kayıtları bu payla 180 saniyeyi aşabilir ve reddedilir. WAV süresi başlıktan tam örnek sayısıyla hesaplanır. Doğrulanamayan biçimler ve bozuk başlıklar reddedilir.

Normalize, sessizlik kırpma, eko ve gerçek örnek ölçümlerinde 60 saniye, 8 MiB kaynak ve 32 MiB ortak hazırlama belleği korunur. İnceleme önbelleği bu sınırları gevşetmez. Mikrofonun mevcut 10 dakika zikir/sûre ve 45 dakika dua sınırları değişmez. Daha önce düzenlenerek dosyadan silinen ses yeniden üretilemez.

İnceleme mevcut tek hazırlama sırası ve iptal duvarını kullanır. Seçim, kaynak revizyonu veya oturum sahipliği değişince eski sonuç yayımlanmaz. r1098 oynatma başlangıcı ve baş/son hece korumaları değiştirilmez.

Doğrulama: tests/r1099/verification.json ve yürütülebilir regresyon betikleri. Gerçek paketli WebM ve ffmpeg ile üretilmiş sentetik dosyalar okunur. VM kontrolleri fiziksel Android ses çıkışı veya ekran kilidi testi değildir.
