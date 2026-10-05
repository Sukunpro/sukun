# SÜKÛN r1010

Kullanıcının yeni bildirimi: kendi kayıt manuel dokunuşta çalıyor, otomatik akış TTS kullanıyor ve “hazırlanıyor” yazısı görülebiliyor. Bu sürüm r1009 üzerine kayıt seçimi düzeltmesidir; r1009 hazırlık sınırı ve r1008 Klasik/Feyz düzen düzeltmeleri korunur. Kişisel kayıtlar ve sayaçlar silinmez.

## Kanıt ve sınırı

Bu incelemede canlı site r1008 HTML içeriğini ve r1008 sürüm JSON'unu sunuyordu. Yeni görüntüde sürüm satırı yoktur; bu bildirim r1009'un telefona kurulup başarısız olduğunun kanıtı değildir. URL'nin sonundaki sürüm parametresi dosyaları yayımlamaz.

Gerçek kaynak gövdeleriyle otomatik Başlat sınandı: veritabanında `esma:0` gibi eski biçimde kendi kayıt mevcutken otomatik akış TTS başlatıyordu. Eski kod bu anahtarı aramıyordu. Native hazırlık da yalnız `zikirKey()` anahtarını okuyor, manuel kayıt çözümleyicisinin bulduğu aynı isim biçimlerini kaçırabiliyordu. Yalnız biçim farkı, görünür foreground yolunda tek başına TTS hatasını üretmedi; o yol bazı alternatif kayıtları zaten buluyordu. Bu ayrım doğrulama raporlarında korunur.

## Düzeltme

Manuel, otomatik foreground ve otomatik native başlangıç aynı kayıt adaylarını arar. Tekil okuyuşlarda seçili tam kayıt anahtarı önce gelir; sonra aynı ismin diğer biçimleri ve eski biçimsiz anahtarı denenir. Seyir ve terkipte açıkça istenen kayıt biçimi korunur. Başka bir ismin kaydı seçilmez. Mezcelin–Bezcelin ortak kartının mevcut anahtarı da tam isim eşleşmesiyle bulunur; özel erişim koşulları değişmez.

Eksik veya eski `RECKEYS` listesi TTS seçmek için yeterli sayılmaz. Otomatik Başlat veritabanını sınırlar içinde sorgular. Yalnız doğrulanmış kayıt yokluğu TTS'ye izin verir; veritabanı hatası veya süre aşımı kullanıcı kaydını yok saymaz, sayaç korunarak durdurulur. **Kendi kayıt** kaynağının önceliği uygulanır; kullanıcının açıkça seçtiği **Türkçe/Arapça cihaz sesi** modları değiştirilmez.

Seçili zikir kimliği ile bulunan ses dosyasının anahtarı ayrı tutulur. Alternatif kayıt tam ses dosyasıyla, mevcut tempo ve fiziksel başlama saati üzerinden çalar. Hazırlık sırasında daha öncelikli kayıt eklenmesi, kaydın değiştirilmesi veya Stop, eski sonucu geçersiz kılar. Geciken efekt yeni kaydı değiştiremez. Kayıt yokluğu bilgisi yeni kayıt kaydedilince veritabanı revizyonuyla geçersiz olur; liste yenilemek şart değildir.

Efekt hazırlığı uzarsa r1009'daki 3 saniyelik bütçeyle ekran açıkken özgün kayıt kullanılabilir; eko/8D uygulanmadığı belirtilir. Sesli sayaç yalnız tamamlanan okuyuşu sayar. Takılan native çözümleme aynı anda sınırsız yeni çözücü açılmasına yol açmaz.

## Doğrulama

`python3 tests_r1010/run_checks.py` paket içinden çalıştırılabilir. 313 davranış senaryosu ve 149 sürüm/dosya bütünlüğü kontrolü geçti; 272 JavaScript gövdesi derleme kontrolünden geçti. 44 runtime kaynağı eşleştirildi, 245 varlık dosyası korundu. Son kaynak hash'leri `TEST_SONUCLARI_r1010.json` ve `DOGRULAMA_r1010.json` içindedir. Önceki 267 davranış kontrolü korunur; yeni kontroller gerçek otomatik Başlat, kayıt çözümleyici ve hazırlık gövdelerinde ilk sesin kendi kayıt olmasını, TTS'nin başlamamasını, erken sayaç kredisi verilmemesini, yokluk/hata ayrımını, Stop/retry ve kayıt değişikliği yarışlarını sınar. Baseline kanıtları test klasöründedir.

Tarayıcının medya, veritabanı ve zaman uçları kontrollüdür. Bu kontroller kullanıcının gerçek dosya biçimini, fiziksel Android hoparlöründe duyulan sesi, mikrofon iznini veya telefondaki scroll kare sürelerini ölçmez. Canlı yayın bu teslim sırasında değiştirilmemiştir.
