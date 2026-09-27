# SÜKÛN — isteğe bağlı NVIDIA bağlantısı

Bu klasördeki `nvidia-proxy.mjs`, **kendi Cloudflare hesabınızda çalıştırmanız için hazırlanmış bir Worker şablonudur**. Henüz yayımlanmış bir servis değildir. GitHub Pages'e dosyayı yüklemek, Worker'ı çalıştırmaz.

NVIDIA'nın barındırdığı API, kontrol sırasında SÜKÛN alan adına tarayıcı CORS izni vermedi. Bu nedenle yalnızca NVIDIA anahtarını girmek doğrudan bağlantıyı sağlamaz. Bu küçük ara sunucu istekleri sabit NVIDIA adresine iletir. Üçüncü kişilerin rastgele proxy adreslerini kullanmayın; yalnızca yönettiğiniz adrese kendi anahtarınızı girin.

## Kurulum

1. Cloudflare hesabınızda bir **Worker** oluşturun. Kod düzenleyicisindeki modül kodunu `nvidia-proxy.mjs` içeriğiyle değiştirin.
2. İzin verilen site varsayılan olarak `https://sukunpro.github.io` adresidir. Farklı bir alan adı kullanıyorsanız Worker ayarlarındaki `ALLOWED_ORIGIN` metin değişkenine tam origin'i yazın: örneğin `https://ornek.com`. Sonuna `/sukun/` ya da `/` eklemeyin. `*` kullanılamaz.
3. Worker'ı kendi hesabınızda yayımlayın. Örnek bağlantı biçimi: `https://sukun-nvidia.hesabiniz.workers.dev/nvidia`.
4. SÜKÛN AI ayarlarında NVIDIA'yı seçin; bu adresi NVIDIA proxy alanına, kendi NVIDIA Developer API anahtarınızı anahtar alanına girin. **Anahtarı Worker koduna, GitHub dosyalarına veya bu belgeye yazmayın.**
5. Uygulamadaki bağlantı testini çalıştırın. Başarılı test, yalnızca o andaki hesap ve model erişimini doğrular; kesintisiz hizmet garantisi değildir.

## Desteklenen modeller ve istek

| Model | Kullanım |
|---|---|
| `nvidia/nemotron-3-super-120b-a12b` | Varsayılan kısa sohbet seçeneği |
| `moonshotai/kimi-k3` | Gelişmiş seçenek; düşük akıl yürütme çabası kullanılır |

İstek: `POST /nvidia`, `Authorization: Bearer KENDI_ANAHTARINIZ`, `Content-Type: application/json`.

```json
{
  "model": "nvidia/nemotron-3-super-120b-a12b",
  "messages": [{"role": "user", "content": "Kısa bir yanıt ver."}],
  "max_tokens": 1024
}
```

Yalnızca metin mesajları kabul edilir. Yanıtın `choices[0].message.content` alanı son yanıtı içerir; akıl yürütme metni aktarılmaz. Kimi K3'ün yanıt üretmesi 15 saniyeyi aşarsa zaman aşımı sonucu döner; tekrar tekrar otomatik deneme yapılmaz. Kısa sohbet için Nemotron'u seçebilirsiniz.

## Sınırlar ve hata sonuçları

- Tek sabit hedef: `https://integrate.api.nvidia.com/v1/chat/completions`. İstekten URL alınmaz; yönlendirme takip edilmez.
- İstek üst sınırı 100 KiB, yanıt üst sınırı 512 KiB, en fazla 80 metin mesajı ve 4096 çıktı tokenı. Başlıklar ve yanıt gövdesi dahil işlem süresi en fazla 15 saniyedir.
- Origin eşleşmesi zorunludur. Tarayıcı CORS kontrolü, sunucu istemcilerine karşı kimlik doğrulama yerine geçmez; her istek yine kendi geçerli NVIDIA anahtarını gerektirir.
- Kod anahtar veya sohbet kaydetmez ve log yazmaz. Anahtar ve sohbet, kendi Worker'ınız üzerinden NVIDIA'ya gönderilir. Cloudflare hesabınıza üçüncü taraf istek/başlık kaydı eklemeyin.
- `401/403 NVIDIA_AUTH_FAILED`: anahtar veya hesap iznini kontrol edin. `429 NVIDIA_RATE_LIMIT`: `Retry-After` süresi kadar bekleyin; geçerli anahtarı değiştirmeniz gerekmez.
- `504 UPSTREAM_TIMEOUT`: yanıt süre sınırını aştı. `502`: üst servis/yanıt sorunu. Ham servis hata metinleri ve başlıkları geri aktarılmaz.

NVIDIA Developer Program'ın ücretsiz uç noktaları **prototip, araştırma, geliştirme ve test** içindir; sınırsız üretim hizmeti olarak sunulmaz. Gerçek kullanıcılara üretim hizmeti verirken NVIDIA'nın geçerli lisans/hizmet koşullarına uygun bir dağıtım gerekir. Worker kullanımının Cloudflare hesabınıza ait kota ve ücretleri ayrıca geçerlidir.

Resmî kaynaklar, 27 Eylül 2026 tarihinde kontrol edildi:

- [NVIDIA NIM kullanım koşulları ve genel sorular](https://docs.api.nvidia.com/nim/docs/product)
- [NVIDIA Nemotron model sayfası](https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b)
- [NVIDIA üzerinden Kimi K3](https://build.nvidia.com/moonshotai/kimi-k3)
- [Cloudflare Worker CORS örneği](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)

Bu şablonun birim testleri sahte HTTP yanıtlarıyla çalıştırılır. Gerçek NVIDIA anahtarıyla veya yayımlanmış Cloudflare Worker üzerinde test yapılmış sayılmaz.
