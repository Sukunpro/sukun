# SÜKÛN r941 — AI bağlantıları

## Sağlık testinin tam yeri

**Üstteki dişli → Ayarlar ve araçlar → Sistem sağlığı → Sağlık denetimini çalıştır.**

Alttaki **Araçlar** düğmesi de aynı menüyü açar. Bu görünür giriş r940 ve sonraki sürümlerdedir; eski r939 ekranda görünmeyebilir. Önce toplu paketi yükleyip **Uygulama r941 / SW r941** eşleşmesini doğrulayın.

Sorun olduğu anda **Sorun şimdi oldu**, ardından **JSON Rapor** düğmesine dokunun. AI bağlantı hataları da aynı rapora sağlayıcı, model, hata kodu, süre ve kota bekleme bilgisiyle eklenir. Sağlık testi AI isteği göndermez ve API kotası harcamaz.

## AI ayarlarının tam yeri

**Üstteki dişli → Ayarlar ve araçlar → AI bağlantıları.**

1. İstediğiniz sağlayıcının hesap bağlantısını açıp kendi API anahtarınızı alın.
2. Anahtarı ilgili alana yapıştırın. Sağlayıcı seçimi **Otomatik** ise yalnız anahtar eklediğiniz uygun bağlantılar sırayla denenir. Bir sağlayıcı seçerseniz yalnız o kullanılır.
3. **Bağlantıları kaydet → Seçili bağlantıyı test et.** Otomatik seçimde yalnız sıradaki uygun sağlayıcı test edilir; bütün hesaplar arka arkaya taranmaz.
4. Ayarları kapatıp AI isteğinizi yeniden başlatın. Kaydetmek özel metni otomatik yeniden göndermez.

Anahtar eksik veya reddedilmişse ayarlar açılır. Kota ve ağ hataları ayrı gösterilir; bunlarda geçerli anahtarı değiştirmeniz istenmez. API anahtarını sohbette veya ekran görüntüsünde paylaşmayın.

## Hazır seçenekler

| Sağlayıcı | Modeller | Kullanım koşulu |
|---|---|---|
| OpenRouter | `openrouter/free`: hizmette o anda kullanılabilen ücretsiz model havuzu | Anahtar ve kota var; ücretli modele otomatik geçiş yok |
| Groq | GPT-OSS 120B / 20B | Açık ağırlıklı modeller; ücretsiz plan kotası veya hesabınızdaki ücretli koşullar |
| Gemini | Flash-Lite / Flash | Ücretsiz katman hesabınıza ve model erişimine bağlı |
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

Sağlayıcı protokolleri ve hata akışları sahte HTTP yanıtlarıyla test edilmiştir. Gerçek API anahtarıyla canlı yanıt, bu paketin mobil tarayıcıda görünümü ve fiziksel ekran kilidi davranışı doğrulanmış sayılmaz. Canlı siteye otomatik dağıtım yapılmadı.

27 Eylül 2026 tarihinde kontrol edilen resmî kaynaklar:

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
