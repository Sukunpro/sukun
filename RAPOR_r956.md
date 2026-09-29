# SÜKÛN r956 — Esmâ arka plan kartları

Esmâ arka plan seçicisi, Berhetiyye'deki ortak önizleme panelini kullanır. Mevcut 10 sahne katalog sırasıyla, iki sütunda ve sayfa başına dört kartla gösterilir: 4 + 4 + 2. Kartlarda görsel, sahne adı, sıra numarası ve grup bulunur. Seçili sahne çerçeveyle belirtilir. Önceki, Sonraki, Kapat ve İsme göre otomatik seçenekleri kullanılabilir. Esmâ ayarlarında ayrıca “Sahneleri görerek seç” düğmesi vardır.

Kartlar önce sahnenin hafif görselini, yüklenemezse ana görselini dener. Yalnız açık sayfanın en fazla dört kartı yüklenir; panel kapanınca kaynaklar temizlenir. Esmâ/Berhetiyye değişiminde doğru katalog ve seçili kartın sayfası açılır.

Seçim mevcut SceneEngine.setEsmaScene üzerinden yapılır. Berhetiyye ayrı setScene yolunu kullanır; tercihler birbirini değiştirmez. Mevcut otomatik eşleştirme, kaynak notları ve ses akışı kullanılır. 10 sahneye yeni dinî eşleştirmeler eklenmedi.

## Kontrol
10 kartın hafif ve ana görsel yolları paket içinde doğrulandı. Üretim seçici kodu Node VM'de çalıştırılarak on Esmâ seçimi, Berhetiyye'ye geçiş, ayrı tercihlerin korunması ve otomatik seçime dönüş kontrol edildi. Değişen JS ve SW sözdizimi, runtime özetleri, SRI ve iki HTML girişinin eşitliği doğrulandı. Tarayıcıda görsel ve fiziksel telefon testi yapılmadı.

## Yükleme
ZIP içeriğini mevcut uygulama köküne birlikte yükleyin; assets klasörünü birleştirin. Kullanıcı verilerini temizlemeyin. Aktif okumayı durdurduktan sonra r956'ya güncelleyin.
Esmâ → Arka plan bölümünü açın. Üç sayfayı gezin, bir kart seçin, paneli yeniden açın. Seçim ve çerçeve aynı sahnede kalmalı. Otomatik seçimini ve ardından Berhetiyye panelini de kontrol edin.
