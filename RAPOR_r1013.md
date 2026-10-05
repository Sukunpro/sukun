# SÜKÛN r1013

Feyz tema + Klasik düzen, Tûrânin'den Tekke'ye girişte sağ kenar taşması ve yerleşim değişimleri için r1012 üzerine düzeltme.

## Bulgular ve değişiklikler

Kullanıcının üç Android görüntüsünde giriş ekranının Mihrap düğmesi, amaç kartları ve alt açıklama metni sağdan kesiliyor. Tekke kök grid'i yalnız satırları tanımlıyordu; sütunun içerikten gelen asgari genişliği, başlık/ortadaki alanın varsayılan min-width değerleri ve uzun kart metinleri dar ekran sınırını aşabilirdi. Kök grid'e minmax(0,1fr) tek sütun eklendi; başlık ve giriş çocukları ekran genişliğiyle sınırlandı. Kartın metin sütunu küçülebilir ve gerektiğinde satıra geçer; simge ve onay işareti korunur. Feyz arka planı ve Klasik ana uygulama görünümü değiştirilmedi.

Giriş açıkken arkasındaki gizli nefes sahnesinin simge ölçümü durduruldu. Görsel viewport yüksekliği tamsayıya çevrilir ve piksel düzeyindeki gürültü süzülür; yakınlaştırma sırasında küçülen görsel viewport uygulama yüksekliğine geri beslenmez. Normal tarayıcı çubuğu, klavye ve yön değişimi yeniden ölçülür. Nefes animasyonunun Hû simgesine uyguladığı ölçek ve ses/sayaç işlevleri korunur.

Bu değişiklikler yalnız assets/runtime/tekke-ux-r992.js ve tekke-ux-r992.css davranışını değiştirir. HTML/index, service worker, manifest ve sürüm/bütünlük işaretleri r1013 ile eşlendi. r1012 kayıt, erişim ve katalog düzeltmeleri ile önceki kendi ses önceliği ve kaydırma/tıklama düzeltmeleri korunur. Görsel dosyalarının baytları değişmedi.

## Doğrulama ve sınırlar

599 kontrollü senaryo ve CSS kontrolü, 149 sürüm/dosya/SRI kontrolü ve 272 JavaScript gövdesi sözdizimi kontrolü geçti. Önceki 552 senaryo korunur. Yeni kapsamda 41 kontrollü işlev senaryosu ve 6 statik CSS kontrolü vardır. Tekke kontrolleri gerçek üretim ölçüm işlevlerini kontrollü DOM/viewport ile çalıştırır; CSS sınırları ve önceki nefes dönüşümünün korunması ayrıca denetlenir.

Canlı web sayfası incelendiğinde ?v=1012 adresinde uygulama işareti r1007 idi; sorgu parametresi eski yayını yeni sürüme dönüştürmez. Masaüstü tarayıcıda 1356×936 ekran geometrisi okunabildi; dar mobil tarayıcı düzeni bu ortamda yeniden üretilemedi. Kullanıcının Android görüntüleri taşma kanıtıdır; kod bulgularıyla uyumlu olmakla birlikte esneme hissinin tek nedenini telefon üzerinde kesinleştirmez.

Yeni paket fiziksel Android, gerçek hoparlör/mikrofon veya dokunmatik kaydırma ataletiyle denenmedi. r1013 canlı GitHub Pages'e bu ortamdan yüklenmedi; teslim edilen ZIP tam kaynak ve dağıtım paketidir. Ses kayıtları telefonda kalır; kişisel sesler pakete gömülmedi.
