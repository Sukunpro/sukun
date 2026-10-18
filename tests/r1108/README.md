# r1108 doğrulama kapsamı

- `kandil-preferences.cjs`: iki gerçek giriş HTML’indeki Kandil sahibini,
  arayüz depolama sarmalayıcısını ve tur fonksiyonlarını kontrollü DOM/saatte
  çalıştırır. Tercihler, iptal edilmiş callback, tek bekleme, saklama hatası,
  sekmeler, tur yarışları, odak ve ilk dönüş hareketinin yutulması denetlenir.
- `presentation-notice.cjs`: gerçek görünüm modülünün ilk açılış, ön plan,
  gerçek dönüş, elle denetim, gecikmiş kare ve eski iş iptal davranışları.
- `health-presentation-context.cjs`: pasif gözlem bağlamının ve doğrulanmamış
  durumun rapor/sunum zincirinde korunması; eski kayda tarafsız açıklama.

r1042, r1045 ve r1048’in ilgili test kaynakları gerçek dönüş uyaranı kullanacak
şekilde uyarlandı; mevcut geometri/odak/iptal kabulü kaldırılmadı. Eski sürüm
kanıtları değiştirilmez. Bu sürümün yeniden koşu sonuçları bu klasördedir.

Node fixture sonuçları native tarayıcı piksellerini, fiziksel Android kilidini
veya duyulan sesi doğrulamaz. Canlı Chrome arayüz kabulü yayın sonrasında
ayrıca yapılır; fiziksel cihaz kabulüyle eşit sayılmaz.
