# SÜKÛN r874 — Mobil Yerleşim Hotfix

Taban: r873.

## Yapılanlar
- 28 İsim Seyri düğmelerinde r865 ve r869 görsel otoriteleri kaldırıldı.
- Seyir düğmeleri tek CSS grid/paint otoritesine bağlandı; `Bitir` ruby jewel olarak sabitlendi.
- Android'de flashing/repaint riskini artıran transition, animation, filter ve çift katmanlı jewel IMG boyaması kapatıldı.
- Zikir Ayarları açılır gövdesi kompakt ve okunabilir tek sütunlu mobil düzene alındı.
- Sticky ana sekme çubuğunun içerik üstüne binmesini azaltan scroll/boşluk otoritesi eklendi.
- Minimize `Oynatıcıyı göster` yüzeyi tek 48px restore barına sabitlendi ve sayfa altında güvenli boşluk ayrıldı.
- Ambiyans bilgi metinlerinin arka plan üzerinde okunabilirliği güçlendirildi.
- Ses, sayaç, seyir oturumu ve MediaSession mantığına dokunulmadı.

## Dağıtım
Bu paket TAM paket değildir. r873 üzerine yalnız `index.html` ve `nero.html` dosyalarını değiştirir.
Service Worker dosyası bu hotfix paketinde değiştirilmez; uygulama HTML etiketi r874 olurken mevcut SW r873 çalışmaya devam edebilir.
