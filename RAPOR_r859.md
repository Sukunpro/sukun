# SÜKÛN r859 — Regression Shield / Authority Cleanup

- Bildirim merkezi saklama ve sayfalama görünürlüğü 30 kayıttan 300 kayda çıkarıldı; 5 kart/sayfa korunur.
- `SukunContext` tek canonical normal/Berhetiyye context API olarak eklendi; mevcut güvenilir `data-r853-berhet` sinyalini normalize eder.
- `SukunAuthorityRegistry` context, audio ve notification authority durumunu tek snapshot altında toplar.
- Tarihsel `SukunR853Scene` ve `SukunR855UI` diagnostik sürüm değerleri r859 ile hizalandı.
- Çalışan audio motorları sökülmedi; regresyon riski yaratmadan tek diagnostik authority üzerinden izlenebilir hale getirildi.
- HTML, SW, manifest, latest ve build marker r859 ile senkronlandı.
