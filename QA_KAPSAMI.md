# r920 doğrulama kapsamı

- `identity-results`: Tam uygulamada 28/99 isim seçimleri, sahneler ve sayaç bağımsızlığı.
- `session-ui-results`: Gerçek IndexedDB WAV, oynatma, Tefekkür ve Atlas.
- `tef-final-results`: Son görünümde çark, isim ve çıkış; eski seans/tempo panellerinin gizlenmesi.
- `ambience-final-results`: Zikir arayüzünün Ambiyans ana kontrollerini gizlemediği doğrulandı.
- `journey-results`: Tam uygulamada 28/99 otomatik ilerleme ve taşıma komutları.
- `voice-results`: Mevcut uygulama kaynaklarında kayıt/TTS önceliği ve asenkron iptal senaryoları.
- `dock-results`: Mevcut uygulama kaynaklarında dokunma ve ambiyans yoğunluğu.
- `integrity-results`: Üretilen dosyalar, sürümler, varlıklar ve özgün hash'ler.
- `health-results`: Gerçek tanılama dışa aktarımı.
- `sw-results`: Yerel gerçek Service Worker kurulumu ve çevrimdışı erişim.
- `test-sw-integrity-results`: Gerçek Service Worker, bozuk dağıtım reddi, bekleyen güncelleme ve çevrimdışı betik hash'leri.
- `session-r919-test-results`: Bağımlılıkları kontrollü SessionState sözleşme testleri; fiziksel ses testi değildir.
- `session-native-cancel-results`: Gerçek R698 kodu, kontrollü gecikmiş Stop/start yarışı.
- `test-scene-update-results`: Mevcut sahne/güncelleme kodunun kontrollü hata ve zamanlama testleri.

Tarayıcı testleri fiziksel Android ekran kilidi veya Bluetooth doğrulaması yerine geçmez. Test sesleri bu çalışma için üretilmiş sentetik WAV dosyalarıdır; kullanıcı kayıtları kullanılmadı.
