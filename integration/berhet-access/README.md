# Berhetiyye isteğe bağlı sunucu erişim sağlayıcısı / Optional server access provider

## Durum ve kapsam

Bu klasör **kurulmamış bir sunucu şablonudur**. GitHub Pages üzerinde çalışan mevcut SÜKÛN uygulaması bir kimlik doğrulama sunucusu içermez. Bu dosyaların repoda olması bir sunucunun yayınlandığı veya ödeme/üyelik sisteminin kurulduğu anlamına gelmez. Varsayılan cihaz gizlilik kilidiyle bu sağlayıcı farklı güven sınırlarıdır.

Şablon, yönetici tarafından dağıtılan tek bir erişim kodunu sunucuda doğrular. Kodun düz metni veya doğrulama özeti istemciye gönderilmez. Başarılı doğrulama 12 saat geçerli, 32 rastgele baytlık bir Bearer oturum anahtarı verir. KV içinde yalnız anahtarın SHA-256 özeti, kapsam, süre ve lisans kimliği tutulur. Kod/lisans ile oturum ayrı nesnelerdir; `revoke` yalnız çağıran oturumu siler. Burada hesap, ödeme doğrulaması, kişiye özel lisans üretimi veya abonelik yönetimi yoktur.

**Herkese açık GitHub dosyaları korunmaz.** Bu sağlayıcı mevcut premium görsellerin herkese açık URL'lerini gizlemez ve korumalı dosya servisi sunmaz. Ücretli içeriği gerçekten korumak için dosyalar genel depodan çıkarılmalı, özel depoda tutulmalı ve her dosya isteğinde sunucuda yetki doğrulanmalıdır. İstemcideki `isActive()` yalnız arayüz için önbellek bilgisidir; içerik yetkilendirmesi yerine kullanılamaz.

## Yayın için gereken somut girdiler

1. Yöneticiye ait bir Cloudflare hesabı ve bu Worker için HTTPS alan adı/route.
2. `BERHET_SESSIONS` adlı Workers KV binding'i.
3. `BERHET_RATE_LIMITER` adlı native rate-limit binding'i. Örnek limit her route/IP için konum başına dakikada 6 istektir. Binding yoksa veya hata verirse servis açılmaz.
4. `ALLOWED_ORIGIN=https://sukunpro.github.io` — tam origin, `/sukun/` yolu eklenmez. `*`, `null`, farklı origin ve origin'siz istekler kabul edilmez. CORS kendi başına kimlik doğrulama değildir.
5. Yönetici tarafından belirlenen `BERHET_LICENSE_ID`. Bu şablonun tek ortak davet lisansı kimliğidir; gerçek kullanıcı hesabını temsil etmez.
6. Worker **secret** olarak `BERHET_ACCESS_CODE_HASH` ve en az 32 rastgele karakterlik `BERHET_RATE_KEY_SECRET`.
7. Gerçek alan adı belirlendikten sonra istemci sağlayıcısının açıkça yüklenmesi ve portal adaptörüne bağlanması.

`wrangler.example.jsonc` yer tutucular içerir ve doğrudan yayınlanamaz. Kopyasını özel çalışma alanında düzenleyin; gerçek secret değerlerini bu repoya, tarayıcı JavaScript'ine veya konuşmaya koymayın. Bu çalışmada hesap açılmadı, kaynak oluşturulmadı, maliyet kabul edilmedi ve Worker yayınlanmadı.

## Kod özeti oluşturma

En az 16 karakterli yüksek entropili rastgele erişim kodu kullanın; demo şifresi veya kısa PIN kullanmayın. Node komutu sırrı yalnız standart girdiden alır, komut satırı argümanlarını reddeder ve yalnız tuzlanmış özeti çıkarır. Bash örneği; komut, şifrenin kendisini geçmişe yazmaz:

```bash
IFS= read -r -s BERHET_CODE
printf '%s' "$BERHET_CODE" | node integration/berhet-access/hash-code.mjs
unset BERHET_CODE
```

Özeti güvenilir yönetici terminalinde Worker secret olarak kaydedin. Düz kod, özet veya Bearer anahtarlarını issue, PR, log ve herkese açık dosyalara eklemeyin. Özet biçimi `pbkdf2-sha256$100000$<16-bayt-base64url-tuz>$<32-bayt-base64url-özet>` şeklindedir. 100.000 maliyet Worker uyumluluğu için sabittir; bu nedenle yüksek entropili kod ve sunucu hız sınırı birlikte gereklidir. Gerçek dağıtımda platformun işlem süresi bütçesini doğrulayın.

## HTTP sözleşmesi

| İstek | İçerik | Başarılı yanıt |
|---|---|---|
| `POST /v1/redeem` | JSON `{ "code": "…" }` | `{ "sessionToken": "…", "tokenType": "Bearer", "scope": "berhetiyye", "expiresAt": 0 }` |
| `GET /v1/session` | `Authorization: Bearer …` | `{ "active": true, "scope": "berhetiyye", "expiresAt": 0 }` |
| `POST /v1/revoke` | `Authorization: Bearer …` | `204`, yalnız bu oturum iptal edilir |

`expiresAt` Unix milisaniyesidir; tablodaki `0` yalnız türü gösterir. Yanlış kod `401`, hız sınırı `429`, eksik bağlayıcı/gizli yapılandırma `503` döndürür. İstek gövdesi en çok 2048 bayt, kod en çok 256 karakter/1024 UTF-8 bayt olabilir. Query string kabul edilmez. Hiçbir yanıt cache'lenmez. Kod, token, ham IP ve binding hataları uygulama tarafından log'lanmaz; dağıtım hesabında istek gövdesi/Authorization kaydı yapan ek izleme katmanlarını da kapatın.

## Tarayıcı adaptörü

`example-http-provider.js` otomatik yüklenmez. Gerçek sunucu kurulduktan sonra dosyayı portal başlamadan önce yükleyip şu atamayı kullanın:

```js
window.SUKUN_BERHET_ACCESS_PROVIDER = window.createBerhetHttpProvider({
  baseURL: 'https://GERCEK-ERISIM-ALAN-ADI'
});
```

- `await verify(code, {signal})` → `{ok:true, receipt}`. Bu adım yalnız doğrular; kapıyı veya yerel kilidi açmaz. Token receipt üzerinde bulunmaz.
- `commit(receipt, {signal})` → `{ok:true, scope, expiresAt}`. Portalın güncellik/iptal kontrolünden sonra bir kez çağrılır. Bekleyen veya iptal edilmiş eski doğrulama kapıyı açamaz.
- `isActive()` → eşzamanlı, bellekteki oturum süresi kontrolü.
- `await status({signal})` → sunucudan durum doğrulaması. Ağ hatası `active:false` döndürür; bu sonuçla arayüz yeni yetki vermemelidir.
- `await revoke({signal})` → tokenları önce bellekten siler, sonra sunucuya iptal isteği gönderir. Ağ hatasında yerel erişim kapanır; uzaktaki oturum için hata bildirilmeli ve en geç 12 saatlik süre sınırı bilinmelidir.

Tokenlar yalnız bellektedir; yenileme/yeni sekme sonrası tekrar giriş gerekir. Sağlayıcı `localStorage`, `sessionStorage`, cookie, DOM, URL veya yerel KLT fonksiyonlarına token/kod yazmaz. Her istek için 8 saniye ağ zaman aşımı vardır. Kullanıcı ekranı kapatınca tüm devam eden doğrulamalarda aynı `AbortSignal` kullanılmalıdır. Örnek, eski cevapları geçersiz kılar ve bilinen iptal edilmiş tokenları en iyi çabayla iptal eder. Sunucu tokenı üretmişken ağ cevabı kaybolursa istemci onu bilip iptal edemez; süre aşımı sınırı geçerlidir.

## Bilinen sınırlar

- Workers KV **eventual consistency** kullanır. İptal başka konumlarda 60 saniye veya daha fazla gecikebilir; yeni oturum da başka konumda hemen görünmeyebilir. Anında küresel iptal gereken güvenlik modeli için KV yerine tutarlı bir Durable Object/uygun veritabanı oturum deposu gerekir.
- Native rate-limit binding'i konum başına yaklaşık sınırlama yapar; küresel, atomik, kesin deneme sayacı değildir. Saldırıya açık ücretli hizmet için tutarlı deneme kilidi/WAF/Turnstile ve hesap bazlı yetkilendirme ayrıca tasarlanmalıdır.
- Girişten önce doğrulanmış kullanıcı kimliği bulunmadığından IP'den secret anahtarlı HMAC türetilir. Aynı mobil ağ/NAT kullanıcıları aynı sınıra takılabilir. IP ham hâli depolanmaz veya log'lanmaz. Bu tercih kimlik doğrulama yerine geçmez.
- `CF-Connecting-IP` yalnız doğrudan Cloudflare edge arkasında güvenilir kabul edilir. Aynı kod başka bir hosta taşınacaksa bu başlığa istemcinin müdahale etmesini engelleyen güvenilir proxy yapılandırması gereklidir.
- `crypto.subtle.timingSafeEqual` Cloudflare native uzantısı zorunludur; JS döngüsüyle sessiz bir yedek yoktur. Node testleri bu native işlemi `node:crypto.timingSafeEqual` ile sağlar; bunlar gerçek workerd/hesap dağıtım testinin yerini tutmaz.

## Doğrulama

Repo kökünden:

```bash
node --test tests/r1080/provider-server.js tests/r1080/provider-client.js
```

Sunucu testleri doğru/yanlış kod, token özeti, ayrı oturum iptali, süre/kapsam/lisans denetimi, CORS, girdi sınırı, hız sınırı ve yapılandırma hatalarında kapalı kalmayı doğrular. İstemci testleri verify/commit ayrımını, iptal/eski cevap sınırını, yalnız bellek kullanımını ve ağ hatasında yerel çıkışı doğrular. Yayından önce gerçek workerd ortamı, native rate limiter/KV ve cihaz tarayıcısıyla uçtan uca test ayrıca gerekir.

## English

This is an **undeployed optional backend template**, not an existing production authentication service or a payment system. It validates one administrator-issued shared access code exclusively on a Cloudflare Worker, issues a 12-hour random scoped Bearer session, stores only the token digest in KV, and revokes individual sessions without deleting the code/license. No cloud account, paid resource, domain, or deployment was created by this work.

Deployment requires an administrator-controlled Cloudflare account and HTTPS route, session KV, native rate-limit binding, exact allowed origin, a license identifier, and the two Worker secrets listed above. Use a high-entropy random code of at least 16 characters. The stdin-only CLI prints the salted PBKDF2 hash, never the raw code. Never commit actual secrets, hashes, or tokens.

The browser example keeps tokens only in memory. `verify` prepares a private receipt; only a fresh, uncancelled `commit` activates it. `revoke` clears local memory immediately before the remote request. No provider method mutates the legacy device lock. Network failures must not grant new access. Reloading requires sign-in again.

This does **not** protect publicly hosted repository assets or implement protected asset delivery. KV revocation/creation is eventually consistent across locations; native rate limiting is approximate and local to an edge location. Immediate global revocation, exact attempt counts, individual billing entitlements and private asset delivery require additional architecture. The local tests use deterministic in-memory fixtures and a Node native timing-safe-compare shim; production workerd integration still needs verification.

Official references checked while preparing this template:

- [Workers Web Crypto and native timingSafeEqual](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Native rate-limit configuration, locality and accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [KV consistency and visibility limitations](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
