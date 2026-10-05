# SÜKÛN r1012

r1011 üzerine ses kaydı, ortak tek sekme erişimi ve kayıtların görünürlüğü düzeltmeleri.

## Bulgular ve değişiklikler

Ekran görüntüsündeki tek sekme erişim uyarısı, hem ses oynatma hem mikrofon isteminden önce bulunan ortak erişim katmanından gelir. Görüntü tek başına telefonun hangi API/depo hatasını verdiğini belirlemez. r1011'deki Web Locks istek seçenekleri geçerlidir; yanlış seçenek gönderildiği iddia edilmez.

Web Locks isteği callback başlamadan reddedilirse, aynı paylaşılan IndexedDB üzerinden atomik alternatif sahiplik denenir. Başka sekmenin etkin kilidi, callback başladıktan sonraki hata veya sahiplik belirsizliği geçilmez. Erişim deposu açılma/işlem beklemeleri 10 saniyede sonuçlanır; aktif ses sahibinin kilidi zaman aşımıyla düşürülmez. Genel ses işlem hatası artık tarayıcı erişim hatası diye gösterilmez.

Mikrofon durdurma istisnası veya gelmeyen bitiş olayı kayıt ekranını kilitlemez. Bitiş 8 saniyeyle, kayıt depolama aşamaları 10 saniyeyle sınırlıdır. Boş/geçersiz ses yazılmadan reddedilir; işlem hatası veya iptalde işlem geri alınır. Veritabanının iç yazımı tamamlanmış, fakat onay olayı gecikmişse eski sesin korunduğu iddia edilmez; kullanıcıya kayıt listesinden sonucu kontrol etmesi söylenir. Geç gelen tamamlanma, katalog ve ses önbelleğini günceller.

Kayıt listesi okunamadığında önceki doğrulanmış liste korunur; 0 kayıt/silindi sonucu üretilmez. Başarısız silme işlemi satırı kaldırmaz. Tarama sırasında eklenen veya silinen kaydı, eski tarama sonucu geri alamaz. Liste açılışı depoyu yeniden okur. Sınırlı katalog okuma, kayıt sayısını erişim hatasında ? olarak gösterir.

Sistem raporuna salt okunur, izin verilen erişim metadata alanları eklendi: yöntem, hata aşaması, hata adı, alternatif yönteme geçme nedeni. Kişisel ses, anahtar, sekme kimliği veya ham hata metni alınmaz.

r1011'in eksik sesleri mevcutları ezmeden tamamlama seçeneği, r1010 otomatik kendi ses önceliği ve Feyz/Klasik kaydırma/dokunma düzeltmeleri korunur. Görsel ve CSS varlıklarının baytları değişmedi.

## Doğrulama

552 davranış senaryosu, 149 sürüm/dosya/hash/SRI kontrolü ve 272 JavaScript gövdesinin derlenmesi geçti. 44 çalışma zamanı girdisi doğrulandı. Önceki 417 senaryo korundu; yeni kapsam tek sekme erişimi, mikrofon/depoya yazma, listeleme ve sistem raporudur.

Pristine r1011 karşılaştırmasında erişim suite'inin ilk 10 senaryosunda 7 başarısızlık yeniden üretildi; nihai erişim suite'i 16/16 geçti. Yeni mikrofon suite'i r1011'de 18/36, r1012'de 36/36 geçti. Bazı senaryolar yeni hata açıklamalarını doğrular; bu sayılar ayrı fiziksel telefon hatası sayısı değildir. Bağımsız erişim ve erişim/mikrofon bütünleşme testleri de geçti.

Testler gerçek üretim işlevleriyle, kontrollü tarayıcı uçları, saatler, medya olayları ve atomik depolama modeliyle çalıştı. Fiziksel Android mikrofonu, gerçek ses çıkışı, ekran kilidi veya dokunmatik kaydırma ataleti ölçülmedi. Ekran görüntüsünün kesin cihaz hata nedeni için yeni JSON sistem raporu gerekir.

## Kayıtların durumu

Kullanıcı son mesajında telefondaki kayıtların silinmediğini bildirdi. Erişim/görünürlük sorunu olarak ele alındı. Otomatik kayıt silme yolu bulunmadı; yalnız açıkça onaylanan veri temizleme/silme işlemleri vardır. Gerçek kişisel ses JSON'u bu çalışmada sağlanmadı; telefondaki kayıtlar buradan geri yüklenmedi veya yayın paketine gömülmedi.
