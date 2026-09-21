# SÜKÛN r888 — Berhetiyye Hard Render Fix
- r887 regresyonu: Berhetiyye aktifliği yalnız Journey target üzerinden okunabildiği için gerçek Berhetiyye zikrinde çark/scene tetiklenmiyordu.
- r888 aktifliği Journey + BerhetiyyeSeyir + VisualContext + r811/r886 authority üzerinden birleştirir.
- Çark pseudo-element yerine doğrudan #zCountVisual içine IMG olarak monte edilir.
- Yanlış .png kontrol asset referansları mevcut .webp dosyalarına çevrildi.
- Berhetiyye sahnesi #r717Scene üzerinde zorlanır.
- Başlat / Duraklat / Sürdür metni gerçek runtime durumundan üretilir.
