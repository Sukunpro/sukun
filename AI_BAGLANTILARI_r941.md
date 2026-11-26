# SÜKÛN r1272 — AI bağlantıları

## Sağlık testinin tam yeri

**Üstteki dişli → Ayarlar ve araçlar → Sistem sağlığı → Sağlık denetimini çalıştır.**

Alttaki **Araçlar** düğmesi de aynı menüyü açar. Web sürümünde uygulamanın ve çevrimdışı önbelleği yöneten servisin sürümünü burada görebilirsiniz.

Sorun olduğu anda **Sorun şimdi oldu**, ardından **JSON Rapor** düğmesine dokunun. AI bağlantı hataları da aynı rapora sağlayıcı, model, hata kodu, süre ve kota bekleme bilgisiyle eklenir. Sağlık testi AI isteği göndermez ve API kotası harcamaz.

## AI ayarlarının tam yeri

**Üstteki dişli → Ayarlar ve araçlar → AI bağlantıları.**

1. İstediğiniz sağlayıcının hesap bağlantısını açıp kendi API anahtarınızı alın.
2. Anahtarı ilgili alana yapıştırın. **Otomatik** seçim bir OpenRouter anahtarı ister ve yalnız ücretsiz modelleri kullanır. Başka bir sağlayıcı kullanmak için adını listeden seçin.
3. **Bağlantıları kaydet → Seçili bağlantıyı test et.** Otomatik seçimde OpenRouter test edilir.
4. Ayarları kapatıp AI isteğinizi başlatın. Bağlantı testi sabit bir örnek metin gönderir. Uygulama, kişisel bir istek göndermeden önce her seferinde sağlayıcıyı gösterip onayınızı ister.

Anahtar eksik veya reddedilmişse ayarlar açılır. Kota ve ağ hataları ayrı gösterilir; bunlarda geçerli anahtarı değiştirmeniz istenmez. API anahtarını sohbette veya ekran görüntüsünde paylaşmayın.

## Hazır seçenekler

| Sağlayıcı | Modeller | Kullanım koşulu |
|---|---|---|
| OpenRouter | Ling 3.2 Flash (free), ücretsiz model havuzu ve ERNIE 5.5 Flash Preview (free) | Anahtar ve kota var; ücretli modele otomatik geçiş yok |
| Groq | GPT-OSS 120B / 20B | Açık ağırlıklı modeller; ücretsiz plan kotası veya hesabınızdaki ücretli koşullar |
| Gemini | Gemini 4 Hydrogen, 3.8 Flash, 3.5 Flash-Lite, 3.6 Flash | Ücretsiz katman hesabınıza ve model erişimine bağlı |
| Kimi / Moonshot | Kimi K2.6 / K3 | Ücretli API, bakiye ve hesap erişimi gerekir |
| Anthropic | Claude Sonnet 5 | Mevcut ücretli bağlantı korunur |
| NVIDIA | Nemotron 3 Super / Kimi K3 | Geliştirici denemesi; yalnız elle seçilir; kendi aracı servisinizi kurmanız gerekir |

Ücretsiz API sınırsız kullanım demek değildir. Açık kaynak/açık ağırlıklı modelin sunucuda çalıştırılması ayrıca ücretli olabilir. Telefona dev model dosyaları yüklenmez; bu pakete bağlantı adaptörleri ve model seçimleri eklenmiştir. Ortak veya gizli bir servis anahtarı pakete gömülmemiştir. Anahtarsız mevcut yerel SÜKÛN düzeni bulut modeli gibi sunulmaz.

NVIDIA doğrudan tarayıcı CORS denetiminde erişim vermedi. **integration/README-NVIDIA.md** ve **integration/nvidia-proxy.mjs** kendi Worker'ınızı kurmak içindir. Dosyayı GitHub Pages'e yüklemek sunucuyu çalıştırmaz. Başka kişilerin proxy adreslerine anahtarınızı göndermeyin. Şablon yayımlanmış bir servis değildir ve NVIDIA deneme uç noktaları sınırsız üretim hizmeti olarak kullanılamaz.

## Hata kodlarını okuma

| Kod | Yapılacak işlem |
|---|---|
| `MISSING_KEY`, `AUTH` | Anahtar ekleyin veya reddedilen anahtarı düzeltin |
| `QUOTA` | Belirtilen bekleme süresi / hesap kotasını kontrol edin |
| `BILLING`, `ACCESS` | Bakiye, hesap ve model izinlerini kontrol edin |
| `PROXY_REQUIRED` | NVIDIA için kendi aracı servis kurulumunu tamamlayın |
| `NETWORK_OR_CORS` | Ağ, tarayıcı erişimi ve gerekiyorsa kendi aracı servisinizi kontrol edin |
| `TIMEOUT`, `DEADLINE` | Sağlayıcı zamanında yanıt vermedi; daha sonra deneyin |
| `MODEL_UNAVAILABLE` | Önerilen model yedeğini veya başka sağlayıcıyı seçin |
| `INVALID_RESPONSE` | Boş/geçersiz/büyük yanıt; sağlık raporundaki sağlayıcı ve modeli kontrol edin |
| `AI_BUSY`, `CANCELLED` | Önceki isteği bekleyin veya AI isteğini iptal et düğmesini kullanın |

Bir AI işlemi aynı anda yalnız tek istek zinciri açar. İstek başına gövde dahil 16 saniye, zincir genelinde 40 saniye ve en fazla 8 ağ denemesi sınırı vardır. Geciken isteği iptal etmek ekranı tekrar kullanılabilir hale getirir; sağlayıcıda başlamış kullanım için ücret iadesi garantisi vermez.

## Doğrulama ve kaynaklar

Mobil Chromium’da bağlantı ayarlarını açma, anahtar kaydetme ve örnek yanıta ulaşma akışı denendi. Testte sağlayıcı yanıtı taklit edildi. Ücretsiz model listesi ve tarayıcı bağlantı izinleri sağlayıcıların canlı uç noktalarında kontrol edildi.

26 Kasım 2026 tarihinde doğrulanan yeni model bağlantıları:

- [Ling 3.2 Flash ücretsiz sürüm](https://openrouter.ai/inclusionai/ling-3.2-flash:free)
- [ERNIE 5.5 Flash Preview ücretsiz sürüm](https://openrouter.ai/baidu/ernie-5.5-flash-preview:free)
- [Gemini 4 Hydrogen](https://aistudio.google.com/docs/whats-new-gemini-4-hydrogen)

Diğer sağlayıcı belgeleri:

- [OpenRouter ücretsiz yönlendirici](https://openrouter.ai/docs/guides/routing/routers/free-router)
- [OpenRouter sınırları](https://openrouter.ai/docs/api_reference/limits)
- [Groq model listesi](https://console.groq.com/docs/models)
- [Groq kota bilgileri](https://console.groq.com/docs/rate-limits)
- [Gemini modelleri](https://ai.google.dev/gemini-api/docs/models)
- [Gemini fiyatlandırması](https://ai.google.dev/gemini-api/docs/pricing)
- [Kimi model parametreleri](https://platform.kimi.ai/docs/api/models-overview)
- [Kimi K3 erişim koşulları](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart)
- [NVIDIA geliştirici uç noktaları](https://docs.api.nvidia.com/nim/docs/product)
- [Claude modelleri](https://platform.claude.com/docs/en/models/overview)
