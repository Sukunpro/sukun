# r1066 nihai test kanıtları

Bu dizindeki JSON dosyaları tamamlanmış koşuların raporlarından baytları değiştirilmeden kopyalandı. Üretim `nero.html` SHA-256 değeri: `2e0762f0d403921c668bc519d0ae7f0167c5a7355b741457769e038952255fce`.

| Dosya | Sonuç | Kapsam |
| --- | --- | --- |
| [navigation-policy.json](navigation-policy.json) | 10/10 | Üretim gezinme denetleyicisi; kontrollü politika/gate uçları. |
| [diagnostics-tempo.json](diagnostics-tempo.json) | 20/20 | Üretim yardımcıları ve tempo işleyicisi; kontrollü CSSOM, model ve input. İptal kayıt/ses yazmaz. |
| [mobile-navigation-final.json](mobile-navigation-final.json) | 22/22 | 320×640 ve 390×844 profilleri; tam Klasik/Feyz uygulama, native CDP dokunma/pan ve hit test. |
| [diagnostics-tempo-browser-final.json](diagnostics-tempo-browser-final.json) | 11/11 | Tam uygulama; CSS değerleri/öncelikleri, tekrarlı kilit, başka sahip, native tempo pan ve ikinci dokunma. |
| [persistence-final.json](persistence-final.json) | 24/24 | Sentetik WAV; içe aktarma, hata reddi, Finish, yenileme, iki tam Chromium yeniden başlatması ve r1063→r1066 service worker güncellemesi. |
| [readings-regression-final.json](readings-regression-final.json) | 52/52 | Tam uygulama; Arapça asıl/meal/kaynak entegrasyonu, yerel ve toplu oynatma otoritesi, native kayıt bankaları. Cihaz konuşması kontrollü uçtur. |
| [regressions-final.json](regressions-final.json) | 109/109 grup | Üretim kaynaklarıyla kontrollü geçmiş regresyon fixture'ları. Bağımsız gerçek tarayıcı koşuları bu sayıya eklenmez. |
| [full-release-export-final.json](full-release-export-final.json) | PASS; 696 dosya | Tam üretim dışa aktarıcısı, tüm yayın dosyası baytları ve SHA-256 envanteri; kontrollü yerel fetch/DOM, sentetik kişisel JSON. |
| [release-integrity-final.json](release-integrity-final.json) | 1253/1253 | Yayın kimliği, tam SHA-256/boyut, SRI ve JavaScript sözdizimi. Statik kontrollerdir. |

Güncelleme paketi uyumluluğu r1063/r1064/r1065 için değişen/yeni dosya birleşimi, gerekli 80 runtime dosyasının tamamı ve altı gömülü MP3 üzerinden doğrulandı. Paket SHA-256 ve ZIP boyutu son belge/envanter yenilemesinden sonra ayrı yayın makbuzunda kaydedilir; bu kanıt seti eski bir paket digest'i taşımaz.

JSON dosyaları kendi yöntemlerini ve sınırlamalarını taşır. Test grupları ve tekil kontroller örtüştüğü için sayılar birleştirilmez. Geniş regresyon koşusunda önceki 18 tanılama/tempo kontrolü de bulunur; bağımsız 20/20 raporu son iki sahiplik/pointer kontrolünü ekler.

Tarayıcı kanıtları izole headless Chromium kullanır. Native dokunma olayları gerçek browser input'udur; blur vakası açık pencere olayıyla modellenir. Mobil gezinmede cihaz konuşması sentetiktir. Tanılama/tempo koşusu bilinçli ses oynatma başlatmaz. Okuma koşusunda cihaz konuşma sesleri, utterance bitişi ve hata olayları kontrollü uçlardır; gerçek native kayıt kaynakları ve dil izolasyonu uygulama üzerinden sınanır. Kalıcılık yalnızca sentetik kayıtlar kullanır. Fiziksel Android ekran kilidi, gerçek kullanıcı verisi veya işitilebilir hoparlör çıkışı doğrulaması iddia edilmez.

Kaynak raporlar: `qa-r1066/navigation-policy.json`, `qa-r1066/diagnostics-tempo.json`, `qa-r1066/mobile-navigation.json`, `qa-r1066/diagnostics-tempo-browser-final.json`, `qa-r1066/persistence-final.json`, `qa-r1066/readings-regression-final.json`, `qa-r1066/full-release-export-final.json`, `qa-r1066/release-integrity-final.json` ve proje üstündeki `regression-r1066-final/results.json`.
