# G8 — Sıradaki sınırlı CSS taşıma kapsamı

Bu liste r1117 üretim kaynağında incelendi. Aşağıdaki üç gövde **henüz
taşınmadı**; sonraki üretim değişikliği bu listeyle sınırlandırılabilir.
Bu belge ve çark haritası güncellemesi uygulama sürümünü değiştirmez.

| Mevcut stil ID'si | UTF-8 bayt | Sahiplik ve korunacak konum |
| --- | ---: | --- |
| `sukun-r1029-surface-clarity` | 7.630 | Ambiyans/mikrofon yüzeyleri; `smart-session-ui-r1082` bağlantısından sonra, r1031'den önce |
| `sukun-r1031-personal-centre-glass` | 1.206 | Ambiyans kişisel merkez boyası; r1029'dan sonra, `sukun-r920-contract` öncesinde |
| `sukun-r917-scene-info` | 337 | Sahne açıklaması; `sukun-r918-repair` sonrasında, `sukun-r916-repair` öncesinde |
| **Toplam** | **9.173** | **Üç ayrı taşıma** |

Her ID giriş dosyasında bir kez var. Üç gövdede de `url()`, `@import` veya
`var()` bulunmuyor; çalışma zamanı bu stil ID'lerine başvurmuyor.
r1029/r1031 aynı `sukun-r933-controls` katmanını kullanır. r917 katmansız
kalmalıdır. Her gövde kendi yerinde, aynı ID ile, baytı baytına taşınmalıdır.

İçerik okuyucusu uyarlanacak mevcut testler:

- `tests/r1029/ui-surface-contract.cjs`
- `tests/r1031/personal-centre-glass.cjs`
- `tests/r1112/ambience-ready-theme.cjs`

Bu testler satır içi stil arıyor. Harici CSS kaynağına geçerken içerik, katman,
sıra ve tek sahip kontrolleri korunmalı. `dashCreate`,
`sukun-r1029-mic-notes-preference` ve `sukun-r914-runtime` içindeki
`syncScene` bu taşımanın kapsamına girmez.

| Kabul alanı | Geçiş koşulu |
| --- | --- |
| Kaynak | `index.html === nero.html`; her stil sahibi tek; eski gövde ile yeni CSS aynı baytlar; JS sahipleri aynı |
| Görünüm | Klasik/Feyz × Esmâ/Berhetiyye × 320/390/430/1280 px; Tam/Hazır Ambiyans, açık/kapalı akordiyonlar, kişisel merkez ve sahne açıklaması |
| Etkileşim | Bilgi/önizleme/anahtar odağı ve tıklaması, mikrofon notu tercihi, sahne açıklaması aç/kapat |
| Görsel bağlantıları | Haritadaki seçimler mevcut varlıklara bağlanır; eski varlıklar korunur; yeni CSS ağda ve çevrimdışı açılır |
| Ses sahipliği | Gezinti ve açıklama aç/kapat ses sahibini değiştirmez; Pause/Resume/Stop çift başlatma oluşturmaz; kayıt/TTS önceliği korunur |
| Yayın | Yeni sürüm envanteri ve SRI/SHA eşleşir; kurulu service worker yükseltmesi ve çevrimdışı yeniden açılış doğrulanır; desteklenen geri dönüşte kişisel kayıt ve sayaç korunur |

Bu tablo tamamlanmış test sonucu değildir; sonraki taşımanın kabul ölçütüdür.
Küresel dock/scroll/tefekkür otoritesi ve JavaScript taşımaları bu küçük adıma
eklenmez. Fiziksel Android kilit ve duyulan ses kabulü ayrıca açık kalır.
