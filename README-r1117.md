# SÜKÛN r1117 — Mod geçişinde genel Duraklat ve Devam

Frekans modu değişirken motorun 320 ms yeniden kurulum aralığında genel Duraklat verilince frekans beklemede kalıyordu: registry fiziksel grafiği kapalı gördüğü için genel miksin devam kaydını yakalamıyordu. Bekleyen veya tutulmuş frekans başlatması artık aynı miksin duraklatma sahipliğine dahildir. Duraklat mevcut miniPause üzerinden zamanlayıcıyı tutar; açık Devam komutu seçili modda yalnız bir kez yeniden başlatır. Durdur bu hakkı iptal eder. Boştaki mod değişimi oynatma hakkı oluşturmaz.

Bu tam sürüm yayımlanmamış r1114–r1116 değişikliklerini de içerir: Berhetiyye ortak safir/altın yüzeyleri, aynı konumda dışarı alınmış aktif isim bilgi CSS’i, gecikmiş frekans başlatma iptali ve AudioContext saatini izleyen yolculuk duraklatması.

Doğrulama kanıtları tests/r1117/evidence altında tutulur. Yeni gerçek Chromium regresyonu eski r1116 üzerinde iki hatayı yeniden üretir; düzeltilmiş sürümde aynı test çalıştırılır. Üretim dosyaları, gerçek osilatörler ve ses saati değiştirilmez. Tema matrisi 320/390/430/1280 piksel klasik/Feyz görünümlerini sınar; kilitli Berhetiyye kaplaması için sunum öznitelikleriyle yapılan CSS kontrolü, ayrı yerel seçim/oturum testiyle açıkça ayrılır.

Fiziksel Android ekran kilidi, işletim sistemi ses odağı ve duyulan ses kalitesi bu ortamda sınanmamıştır.
