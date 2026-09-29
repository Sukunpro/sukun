# SÜKÛN r955 — Sahne önizlemeleri

## Doğrulanan neden
Canlı sitede assets/scenes/thumb-r949/berhet-01.webp HTTP 404 döndü. Aynı sahnenin assets/scenes/mobile-r918/berhet-01.webp adresi HTTP 200 ve image/webp döndü. Önceki seçici yalnız küçük önizlemeyi deniyor, hata alınca doğrudan “Önizleme yüklenemedi” yazıyordu.

## Düzeltme
Küçük görsel yüklenemezse kart aynı sahnenin mevcut ana görselini kullanır. Her adres yalnız bir kez denenir; iki kaynak da başarısızsa mevcut hata mesajı gösterilir. Açık sayfadaki dört görsel hemen yüklenir. Sayfa değişimi, panel kapatma ve ekran gizleme temizliği korunur.

Pakette 28 isme ait ve 6 klasik sahneye ait toplam 34 küçük önizleme bulunur. Dördü aynı anda yüklenir; ana görsele dönüş yalnız küçük kaynak başarısızsa yapılır. Seçimler, zikir sırası, r954 ses düzeltmesi ve tempo kodu değiştirilmedi.

## Kontrol
34 önizleme ve 34 ana görselin paket içinde bulunduğu doğrulandı. Küçük kaynak hatası → ana kaynak, başarılı yükleme, iki kaynak hatası ve yinelenen adresin engellenmesi üretim fonksiyonuyla kontrol edildi. Değişen JavaScript dosyalarının sözdizimi, SRI, runtime SHA-256 ve HTML giriş eşitliği doğrulandı. Tarayıcıda görsel ve fiziksel telefon testi yapılmadı.

## Yükleme
ZIP içeriğini mevcut uygulama köküne birlikte yükleyin; assets klasörünü birleştirin. Özellikle assets/scenes/thumb-r949 klasöründeki 34 dosyayı da yükleyin. Mevcut dosyaları veya kullanıcı kayıtlarını topluca silmeyin.
Uygulamayı r955'e güncelleyin. Arka plan → Süleyman (A.S.) sahneleri bölümünde ilk sayfa ve Sonraki sayfayı açın; görselleri ve sahne seçimini kontrol edin.
