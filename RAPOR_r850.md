# SÜKÛN r850 — Zikir Ayarları kök düzeltmesi

- r830, r848 ve r849 ayar runtime katmanları kaynak HTML'den fiziksel olarak kaldırıldı.
- Zikir Ayarları artık ayrı bir buton + JS click bridge ile açılmıyor.
- Gerçek `details#r679ZikirAyarBox` doğrudan sayaç kontrollerinin altına taşınıyor ve kendi native `summary` davranışıyla açılıp kapanıyor.
- Eski `r836CounterSettings`, r848 portalı ve dialog görünümü devre dışı.
- `r829QuickSettings .qOpen` gizlendi; ikinci/bozuk açma otoritesi bırakılmadı.
- Görünen başlık: `⚙ Tempo · Bendir · Zikir ayarları`.
- Kullanıcıya görünen `ZİKİR SAYAÇ / Zikir Sayacı` terminolojisi `ZİKİR ÇARKI` olarak sabitlendi.
- SW/cache sürümü r850'ye yükseltildi.
