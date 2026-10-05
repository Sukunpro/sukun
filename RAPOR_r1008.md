# SÜKÛN r1008

r1004 ve r1003'ün gerçek teslim paketleri, r1007 ve iki Android/Chrome sağlık raporuyla karşılaştırıldı. r1008, r1007 üzerine uygulanmış düzeltmedir; kişisel ses kayıtlarını veya ilerlemeyi silen bir geçiş içermez.

## Ses düzeltmesi

Raporlarda zikir kaynağı `SILENCE`, kendi kayıt motorunun başlatma sayısı sıfırdı. Sayaç 93'ten 155'e ilerlemişti. Rapor eski “birlikte” ayarının değerini içermediğinden telefonun o ayarı doğrudan doğrulanamadı.

Kaynak kodu testi aynı durumu yeniden üretti: r1004'te ses başlatan yol, sonraki sürümde kayıtlı “Zikir ve okuma birlikte” tercihi açıkken, hiçbir metin okuyucusu çalışmasa da susturuluyordu. r1007 bu koşulda ses başlatmadan sayı ekledi.

r1008 bu tercihi yalnız gerçekten çalışan metin okuyucusuyla birlikte değerlendirir. Okuyucu yoksa kendi kayıt veya TTS başlatılır. Okuyucuya geçişte tekil yerel kayıt bırakılır; okuma bitince otomatik zikir yeniden devam eder. Sesli tekrarda başarısız veya kesilen okumaya tamamlanma kredisi verilmez. Kullanıcının açıkça kapattığı ses tercihi ve metin okurken sessiz sayaç tercihi korunur.

## Klasik ve Feyz arayüzü

Yeni arayüz kodu toplam sayaç satırını geçici `r938Hero` içine taşımıştı. Yerleşim geri alındığında bu panelin silinmesi `totalCnt` öğesini de siliyor, sonraki eski ekran güncellemesini hataya düşürüyordu. Gerçek r1003 ve r1004 kodu aynı yaşam döngüsü kontrolünden geçti; r1007 sayaç öğesini kaybetti.

r1008 sayaç satırını kalıcı kökün doğrudan çocuğu olarak tutar. Değişmeyen sayaç çizimlerinde gereksiz DOM kimlik yazımları ve Home yerleşim taramaları da kaldırıldı. Yerleşim gerçekten taşınırsa onarım yeniden çalışır. Klasik, Klasik + Feyz ve Sade için açılma, gizlenme, panel kaldırma ve geri dönme senaryoları kontrol edildi.

## Sağlık raporu

Rapor dışa aktarma artık mevcut tıklama/çizim tanı tamponlarını, seçili ses politikasını ve sessizlik nedenini içerir; yeni ölçüm veya ses başlatmaz. `SILENCE` kaynağı ile taşıma motorunun “playing” durumu ayrı gösterilir. Taşıma durumu fiziksel hoparlörden ses geldiğinin kanıtı değildir. Türkçe ve İngilizce açıklamalar eklendi.

## Doğrulama ve sınırlar

`python tests_r1008/run_checks.py` paket içinden çalıştırılabilir. 231 davranış senaryosu ve 149 sürüm/dosya bütünlüğü kontrolü geçti; 272 JavaScript gövdesi derleme kontrolünden geçti. 44 çalışma zamanı kaynağının hash, SRI ve SW bildirimi eşleştirildi; 245 varlık dosyası korundu.

Testler gerçek üretim fonksiyonlarını kontrollü medya, DOM, depolama, zaman ve teslim edilen MutationObserver kuyruklarıyla çalıştırır. Fiziksel Android mikrofonu, işitilebilir ses, ekran kilidi veya telefondaki scroll kare süreleri ölçülmedi. Skin kontrolleri DOM sahipliği ve yaşam döngüsü içindir; CSS piksel görünümünün veya bütün takılmaların telefonda düzeldiğinin garantisi değildir. Mevcut Android raporları sorun işaretinin anındaki tıklama gecikmesini ölçmemiştir.

Canlı r1007'de Feyz + Klasik düzen açıldı; temel tıklama, Atlas ve scroll denendi. Bu gözlem r1008'in telefonda denenmesinin yerine geçmez. Bu teslim bir tam ZIP paketidir; canlı GitHub Pages yayını değiştirilmedi.

## Telefonda son kontrol

1. Paket dosyalarını yükledikten sonra uygulama ve SW sürümünün ikisinin de r1008 olduğunu kontrol et. Uygulamanın Güncelle düğmesini kullan; kayıtları veya site verilerini silme.
2. Feyz görünümünde Klasik düzeni kullan. Kendi kaydı olan bir isimde Başlat'a dokun; sonra Türkçe/Arapça TTS seçimiyle ayrı dene. Arka planda metin okunmazken “birlikte” tercihi tek başına zikri susturmamalı.
3. Kontrolleri aç/kapat, scroll yap ve bir metin okuyucusunu başlatıp durdur. Zikir sesi yalnız okuyucu çalışırken beklemeli; durunca devam etmeli.
4. Sorun tekrarlanırsa aynı anda sorun işaretini bırakıp yeni raporu dışa aktar. r1008 raporu o andaki ses tercihini ve mevcut giriş gözlemlerini korur.
