> DURUM: Bu önerinin aşamalı r919/r920 kapsamı kullanıcı tarafından onaylandı. Uygulananlar ve sınırlar için RAPOR_r920.md dosyasını okuyun. Aşağıdaki belge r918 sırasında hazırlanmış tarihsel öneridir.

# SÜKÛN r919–r920 — Onaya sunulan geliştirme

Bu belge gelecek sürümlerin önerisidir. r918 onarımına yeni ses motoru, yeni sayaç veya otomatik Focus Mode eklenmedi.

## r919: Otoriteleri birleştir

Yeni bir SessionState ikinci bir uygulama motoru olmamalı. İlk adım mevcut otoritelerden salt okunur, tutarlı bir oturum görünümü üretmek; ardından yazma sorumluluklarını birer birer taşımak.

| Konu | Mevcut bileşen | Önerilen görev |
|---|---|---|
| Oturum görünümü | currentFlowState, SukunNowPlayingStore | SessionState için ortak snapshot |
| Oynatma komutları | PlaybackController, SukunAudioSessionRegistry | Başlat, duraklat, sürdür, durdur için tek komut girişi |
| Öncelik ve kuyruk | SukunForegroundArbiter | Zikir/okuma sahipliği; ambiyansın bağımsız sürmesi |
| Gerçek ses durumu | SukunAudioTruth | UI'nin gerçek oynatma durumunu göstermesi |
| Ses kaynağı | SukunVoiceResolver, AudioResolver, SukunRecordingPriorityLock | Kayıt → yerel ses → TTS önceliği |
| Kaynak etiketi | SukunVoiceSource | Kendi Sesin / Yerel Kayıt / TTS / Sessiz |
| Tanılama | SukunRegressionShield, SukunRegressionSoakLab, SukunRuntimeProbe | Tek sağlık görünümü ve dışa aktarılabilir rapor |

Ek öneriler:

1. **Oturum kimliği ve işlem sırası:** sessionId + epoch + requestId. Eski isim için gecikmiş ses/görsel sonucu yeni oturuma yazamasın. Durdur komutu bekleyen hazırlıkları geçersiz kılsın.
2. **Kesintiler açık durum olsun:** IDLE, PREPARING, PLAYING, PAUSED, COMPLETING, COMPLETED yanında INTERRUPTED, RECOVERING ve ERROR. Pause/Resume iki yönlü; Stop tüm etkin durumlardan çalışmalı.
3. **Ses dosyası bozulursa sessizce TTS'ye geçme:** Kullanıcı kaydı bulunduğu hâlde çalınamıyorsa duraklat, “Kayıt açılamadı” göster; yeniden dene veya kullanıcı tarafından kaynak değişimi sun. Mevcut kod gerçek kayıt hatasından sonra TTS'ye izin veriyor; bu davranış bilinçli olarak değiştirilecek.
4. **Sahne sesin önünü kesmesin:** Görsel geçiş ve decode hiçbir zaman zikrin sesini/sayacını bekletmesin. Görsel efektin bitişi sayım olayı üretmesin. Sayım mevcut ses/oturum otoritesinden gelsin.
5. **Sahne belleği sınırlı olsun:** Aktif ve bir sonraki sahne; eski istekleri iptal et, düşük veri modunda ön yüklemeyi kapat. 28 yüksek çözünürlüklü sahneyi aynı anda decode etme.
6. **Güncelleme oturumu bölmesin:** Yeni sürüm indirilebilir, ancak otomatik reload aktif kaydı veya zikri kesmemeli. Güvenli anda veya açık Güncelle komutuyla uygulanmalı.

Geçiş kabulü: aynı komut iki ses veya iki sayaç üretmemeli; art arda isim değiştirme eski sesi geri getirmemeli; kendi kayıt varken TTS çağrısı oluşmamalı; Stop'tan sonra bekleyen iş yeniden ses başlatmamalı. Her adımdan sonra mevcut regresyon senaryoları çalıştırılmalı.

## r920: Onaylanan görünümü uygula

- Esmâ ve Berhetiyye aynı düzeni kullanacak; verileri, çarkları, arka planları ve görsel malzemeleri ayrı olacak.
- Tefekkür: tek çark, aktif isim, ilerleme, sakin kontrol yüzeyi; üst sağda en az 44 × 44 px çıkış alanı.
- İlerleme halkası mevcut sayacın oranını gösterir; ayrı bir zamanlayıcı veya sayaç oluşturmaz.
- Mini/Midi/Max: tek oturumun farklı ayrıntı düzeyleri. Küçük görünüm ambiyans menüsünü kilitlemez.
- Atlas: kanonik 28 durak, aktif/tamamlanan durumları. Yapay kilitler ve zorunlu oyunlaştırma eklenmez.
- Focus Mode isteğe bağlı ve başlangıçta kapalı. Görünür Pause/Çıkış korunur; ilk dokunuş sadece UI'yi uyandırmak için yutulmaz.
- 1–1,5 saniyelik görsel geçiş yalnız sahne kimliği değişince; reduced-motion ve Tasarruf profilinde sadeleşir.
- Health ekranı “ölçülmedi”, “desteklenmiyor” ve “hatalı” durumlarını ayırır. Yapılmamış ölçüm yeşil başarı olarak gösterilmez.

Önizlemedeki sayaç ve ses kaynağı örnek veridir; ses çalmaz ve kullanıcının gerçek ilerlemesini değiştirmez.

## Cihaz doğrulaması

Tarayıcı otomasyonu Android ekran kilidi, işletim sisteminin uygulamayı askıya alması ve Bluetooth kesintisinin yerine geçmez. Bu senaryolar hedef telefonda ayrıca doğrulanacak. WakeLock tek başına arka planda sesin kesilmeyeceği garantisi değildir.

## Onay kapsamı

Önce r919 oturum/ses otoritesi ve regresyon kapıları; ardından önizlemedeki ortak Esmâ/Berhetiyye düzeni, Tefekkür, Atlas ve akış barının r920'ye uygulanması. Onay alınmadan bu öneriler çalışan uygulamanın davranışına taşınmaz.
