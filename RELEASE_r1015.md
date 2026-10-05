# SÜKÛN r1015

- Bitir, yeni depo/kilit isteği açmadan mevcut seansı durdurur
- Kapatılan eski hata mesajı geç kalan işlemden yeniden görünmez
- Kapanmış kayıt ve sekme-sahipliği bağlantıları sınırlı, güvenli biçimde yeniden açılabilir
- Okuma hatası “0 kayıt” veya “kayıt yok” olarak gösterilmez; Tekke bilinen kayıt bilgisini korur
- Kayıt erişilemediğinde set otomatik olarak cihaz sesine geçmez; doğrulanmış eksik adımda mevcut TTS davranışı korunur
- Odak kaybında yarım kalan dokunma, sonraki kaydırma/yerleşimi kilitlemez

Test: 705 mevcut +84 yeni kontrollü senaryo, 150 bütünlük/sürüm kontrolü ve 279 JavaScript ayrıştırması geçti. Fiziksel Android akıcılığı ve cihazdaki kayıtların gerçekten erişilebilir olduğu ayrıca kontrol edilmelidir. Bu sürüm kayıtları silmez, sıfırlamaz veya yedekten içe aktarmaz; yeniden büyüyen giriş ekranı için genel zoom müdahalesi içermez.
