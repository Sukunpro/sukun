# SÜKÛN r1113 — Kütüphane durum mesajı

r1112 canlı kontrolünde seçimle başlatma, aynı sete tekrar dokunma ve başka
sete geçiş çalıştı. Ana frekans durdurulduğunda ise son seçim mesajında
“çalıyor” sözü kalabiliyordu. Bu sürüm, yalnız kütüphanenin ürettiği mesajın
sahipliğini ve geçerli olduğu çalma/duraklatma/taşıyıcı/vuruş durumunu izler.
Bu durum değiştiğinde mesaj temizlenir. Başka araçların mesajları korunur.

Ses motoru, grafik, seçim, sayaç veya pause/stop davranışı değiştirilmez.
r1112'nin NeuroSync seçimle çalma, zikir niyeti koruması, hazır ambiyans
kartı kaplaması ve aynı içerikle taşınan Tekke CSS'i korunur.

Kontrollü Node fixture'ları gerçek hub kodunu yürütür. Gerçek tarayıcıdaki
seçim/durdurma kabulü ayrıca kaydedilir; fiziksel Android, duyulan ses ve
korumalı temanın native görünümü bu fixture sonuçlarıyla doğrulanmış sayılmaz.
