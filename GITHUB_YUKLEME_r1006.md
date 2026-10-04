# r1006 yükleme

Uygulama dosyaları `GITHUB_DOSYA_LISTESI_r1006.txt` içinde sıralıdır. Bu listedeki dosyaları mevcut uygulamanın kök dizinine, alt klasör yapılarını koruyarak yükleyin. Test ve denetim dosyaları yayın için gerekli değildir.

Önce tüm asset/runtime dosyalarını, ardından HTML, service worker, manifest ve sürüm işaretlerini aynı yükleme içinde güncelleyin. Yalnız HTML dosyasını değiştirerek sürüm oluşturmayın; bütünlük koruması karışık dosya sürümlerini reddeder.

Bu ZIP yayınlanmamıştır. Aktif seans sırasında güncelleme otomatik yeniden yüklemeye zorlanmaz. Mevcut kayıtlarınızı silmeyin. Güncellemeden önce uygulamanın geri yüklenebilir yedek seçeneklerini kullanın; bir tam yedek sınırı aşarsa indirme başlamadan açıklama gösterilir.

Parçalı ses yedeklerinde bütün parçaları saklayın. r1006 parçaların kimliğini, hashini ve eksik parçaları izler. Eski parçalı arşivlerde set bütünlüğünün doğrulanamadığı açıkça belirtilir.
