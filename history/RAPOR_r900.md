# SÜKÛN r900 — Yatay İsim Şeridi

- Esmâü’l-Hüsnâ tek-sıra isim görünümü artık parmakla sağa/sola kaydırılabilir.
- Kasem-i Berhetiyye 28 isim tek-sıra görünümü de aynı yatay kaydırma davranışını kullanır.
- `overflow:hidden` kaldırıldı; `overflow-x:auto`, momentum scroll ve `touch-action:pan-x` eklendi.
- Aktif ismin `position:sticky; left:0` davranışı kaldırıldı; bu davranış Android’de yatay sürüklemeyi engelleyebiliyordu.
- İsim değiştiğinde aktif isim şeritte otomatik olarak merkeze alınır.
- Tam liste (`showAllNames`) davranışı değiştirilmedi.
