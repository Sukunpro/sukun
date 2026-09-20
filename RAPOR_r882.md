# SÜKÛN r882 — Unified JourneyController

- r881 / r872 stable çekirdeği korunur.
- 99 Esmâ ve 28 Berhetiyye için tek ortak mücevher kumandası eklendi.
- İki seyir state/motoru ayrı kalır; kumanda yalnız mevcut API butonlarına delegasyon yapar.
- Başlat → Duraklat → Sürdür state görseli gerçek seyir stateinden okunur.
- Berhetiyye zikir çarkı ve SceneManager görünürlük sahipliğine dokunulmaz.
- Eski seyir buton satırları yalnız ortak kumanda hazır olduğunda gizlenir; motor/handler DOM'u korunur.
- SW/manifest/build/cache r882 olarak güncellendi.
