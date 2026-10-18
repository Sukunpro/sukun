# SÜKÛN r1101 — Birleşik Frekanslar ve Berhetiyye kontrolleri

NeuroSync’in gelişmiş araçları Frekanslar bölümünde aynı sayfaya yerleşir. Ortak taşıyıcı, vuruş, ses ve oynatma kontrolleri ana frekans motoruna aittir. İkinci tam ekran sentez paneli ve yinelenen oynatma kumandaları gösterilmez. Kütüphane, frekans taraması, Kimatik, öneri, nefes ve rehber araçları mevcut yerel düğümleri ve olaylarıyla korunur; arayüz kopyaları oluşturulmaz. Eski bağımsız sentezleyiciye ait dalga/filtre/kanal ve gürültü kontrolleri bu birleşik görünümden çıkarılmıştır. Ana motorun harmonik, pembe gürültü ve uzamsal ses ayarları mevcut yerlerinde kalır.

“İsim, çark ve görünüm” başlığındaki Mevlevî anahtarı, Berhetiyye’den Esmâ bölümüne geçer ve Klasik Mevlevî sahnesini seçer. Kapatıldığında önceki Berhetiyye seçimine döner. Anahtar yalnızca mevcut Berhetiyye erişimi geçerliyken görünür; ilk başarılı girişten önce ve yeniden kilitlenince gizlidir. Saklanmış bir “önceden açıldı” işareti erişim yetkisi yerine kullanılmaz.

Geçiş mevcut `SukunSessionState.command('select')` sınırını kullanır. Çalan ön plan zikri bitirilir; hedef bölüm kendiliğinden başlamaz. Bağımsız ambiyans/frekansların ve genel duraklatmanın sahipliği korunur. Her bölümün son seçilen ismi ve okuyuş türü aynı sayfa oturumunda hatırlanır. Seyir dönüşünde açık indeks verilmez; mevcut kaydedilmiş sıra ve tekrar konumu korunur. Seçim reddedilirse arayüz var olmayan bir geçiş göstermeye çalışmaz.

Yeni stil katmanı, mevcut safir/zümrüt/elmas taşları ile boş çerçeveyi kullanarak yardım simgelerini, metin alanlarını, seçicileri, ayar kartlarını ve okuyucu/Atlas/yardım pencerelerini tamamlar. Boyut ve DOM taşıma yetkisi mevcut düzen motorlarında kalır; çark yeniden oluşturulmaz. Tema kapsamı SceneEngine’in `data-r1074-theme` seçimini izler; Esmâ’ya geçildiğinde Berhetiyye malzemeleri kaldırılır. Sistem yüksek kontrast paleti desteklenir.

Doğrulama ve kaynak hashleri `tests/r1101/verification.json` altında tutulur. Yerel Chromium denemelerinde geçici profil ve gerektiğinde açıkça belirtilmiş sentetik ses kullanılır. Fiziksel Android dokunması, duyulan ses ve işletim sistemi ekran kilidi bu sürüm testlerinin kapsamı değildir.

Kayıtlı seyirde sahiplik alınmadan değiştirilen tekrar türü ve özel tekrar sayısı yalnızca geçici tercih taslağı olarak tutulur; Başlat sırasında doğrulanmış ilerlemenin üzerine yalnız bu iki tercih uygulanır. Sayaç, toplam ve sıra bu taslaktan alınmaz. Açık geri yükleme taslak tercihleri kullanmaz.

Dinamik frekans taramasının fiziksel Android ekran kilidinde sürmesi bu sürümde doğrulanmadı; mevcut arka plan dışa aktarımı anlık frekans durumunu kullanır.
