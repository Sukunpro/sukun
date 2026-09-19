# r875 CLEAN JOURNEY DOM

Flashing çözümündeki r798 değişikliği korunmuştur.

Bu düzeltmede Berhetiyye seyir kontrol grubunun DOM'u doğrudan temizlendi:
- sadece 7 gerçek button kaldı;
- ID'ler davranış koduyla uyumlu olarak korundu;
- dekoratif bağımsız node yok;
- pseudo-element jewel yok;
- runtime paint / MutationObserver yok;
- Başlat/Pause aynı grid alanını paylaşır; hidden Pause yer kaplamaz;
- Önceki/Sonraki yan yana;
- Bu ismi baştan/Bitir yan yana;
- Tüm seyri baştan tam genişlik;
- Bitir doğrudan ruby asset kullanır;
- SW/manifest/version untouched.

index.html: IDs=['bsStart', 'bsPause', 'bsPrev', 'bsNext', 'bsAgain', 'bsStop', 'bsReset']; authority=1; old_single=0
nero.html: IDs=['bsStart', 'bsPause', 'bsPrev', 'bsNext', 'bsAgain', 'bsStop', 'bsReset']; authority=1; old_single=0