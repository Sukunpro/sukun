# SÜKÛN r855 — Skin Authority Fix

- Kök neden: r798 global jewel CSS, normal Zikir ekranındaki zBar ve kategori kartlarına Berhetiyye assetlerini zorla uyguluyordu.
- r854 ayrımı data-r835-theme üzerine kurulmuştu; bu attribute aktif runtime tarafından güvenilir biçimde yönetilmiyordu.
- r855 ayrımı mevcut sahne otoritesinin gerçek zamanlı `data-r853-berhet` bayrağına bağlandı.
- Normal Ya Rahmân / Esmâ ekranında Mevlevî-Sükûn cam/neon kontroller kullanılır.
- Berhetiyye aktifken kristal/jewel butonlar korunur.
- 28 İsim Seyri Berhetiyye kimliğini korur; 99 İsim Seyri ve normal kategori kartları jewel skin almaz.
- Hedef/Kalan siyah asset ikonları kaldırıldı; altın çizgi hedef ve kum saati SVG ikonları kullanıldı.
- −1/+1 metin görünürlüğü iki skin için de zorlandı.
