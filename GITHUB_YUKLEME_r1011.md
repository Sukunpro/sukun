# r1011 yükleme ve sesleri geri getirme

ZIP'i çıkar. `GITHUB_DOSYA_LISTESI_r1011.txt` içindeki çalışma dosyalarını GitHub Pages klasörüne aynı yollarla birlikte yükle. `index.html`, `nero.html`, `sw.js`, sürüm/manifest dosyaları ve `assets` klasörünün tamamı birlikte güncellenmeli.

Yayın hazır olduğunda uygulamanın **Güncelle** düğmesini kullan. Alt satırda **Uygulama r1011 · SW r1011** görünmeli. Adresin sonuna `v=1011` yazmak tek başına sürümü yükseltmez. Güncellemek için Chrome site verilerini veya kayıtları temizleme.

## Kendi seslerini koruyarak geri yükle

1. Etkin zikir varsa **Bitir** ile tamamla.
2. **Araçlar → Kayıtlarım & Yedekleme → Eski yedekten eksik sesleri tamamla** seçeneğini aç.
3. Varsa **en güncel ses JSON yedeğini önce**, ardından eski JSON yedeğini seç. Aynı işlemde farklı ses içeren aynı anahtar seçilirse, cihazda karşılığı yokken belirsiz sürüm tercih edilmez; güncel yedeği tek başına yüklemen istenir.
4. Bu seçenek yalnız eksik sesleri ekler. Cihazda zaten bulunan kayıtlar, ayarlar ve sayaçlar korunur. Tam uygulama yedeği de burada yalnız sesleri için kullanılabilir.
5. Berhetiyye gibi kilitli bölümlerin seslerini geri yüklemek için ilgili bölümü önce aç. Parçalı yedekte bütün parçaları sakla; eksik parça olduğunda tam set geri yüklenmiş sayılmaz.
6. Eklenen ve korunan kayıt sayılarını kontrol et. Ardından **Tüm sesleri yedekle** ile birleşen güncel seslerini indir.
7. Otomatik zikirde **Ses kaynağı → Kendi kayıt** seçili olsun. **Türkçe cihaz sesi** veya **Arapça cihaz sesi** seçilirse ilgili TTS kullanılır.

Genel **Amel Defteri / Geri yükle** kontrolü tam ayar geri yüklemesi içindir ve aynı kayıtları üzerine yazma davranışı vardır. Eksik sesleri mevcut seslere eklemek için yukarıdaki özel seçeneği kullan.

## Yedeklerin durumu

Bu çalışma sırasında erişilebilen r1003 ve r1004 tam paketlerinde kişisel ses JSON yedeği bulunmadı. r1011 özel ses dosyalarını içermez; telefonundaki kayıtlar bu ortamdan değiştirilmedi. Daha önce telefonda yeniden yüklediğin JSON dosyasını uygulamadaki yeni seçenekle seçebilir veya incelememiz için konuşmaya ekleyebilirsin.

`Tüm uygulama verilerini sil — ses kayıtları dahil` düğmesi tüm verileri siler. Bu işlem güncelleme veya ses geri yükleme adımı değildir.

`tests_r1011` ve raporlar inceleme içindir; yayın dosyaları ayrı listelenmiştir. Davranış testleri gerçek uygulama işlevlerini kontrollü tarayıcı uçlarıyla çalıştırır. Fiziksel Android sesi, gerçek dokunmatik kaydırma ataleti ve telefonun çizim süreleri ölçülmedi.
