# SÜKÛN r963

Canlı r962 site dosyaları mevcut: sürüm işaretleri r962; yeni taş görseli ve ilgili JS/CSS HTTP 200. Gerçek tarayıcıda yeni taş düğmesi DOM'da vardı ve hidden=false idi; ::before hesaplanan display değeri none idi. Eski ortak düğme kuralı görsel katmanını gizliyordu. Bu bir paket yükleme eksikliği değildi.

r963 taş görsel katmanına açık display:block ekler. Yön SVG'lerini mutlak konumlayarak grid'in yüzde genişliğini tekrar daraltmasını önler. Taş görünümü, tema tonları, aç/kapat tercihi, dönüş ve mevcut gezinme komutları korunur.

260 JavaScript ayrıştırması, 26 dosya özeti, SRI ve sürüm eşleşmeleri geçti. Ses ve SW model testleri geçti. Canlı eski sürümün hatası gerçek tarayıcıda doğrulandı; düzeltmenin tam uygulama içindeki yeni görünümü henüz yayımlanmadığından doğrulanmadı. Android kilit testi yapılmadı.

GITHUB_YUKLEME_r963.md her dosyanın kesin depo yolunu verir. Küçük GitHub yükleme ZIP'i r962 üzerine gerekli 32 uygulama dosyasını içerir; tam paket ilk kurulum için bütün sahneleri de içerir. Kayıtları/verileri silme.
