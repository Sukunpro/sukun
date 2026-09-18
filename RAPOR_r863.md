# SÜKÛN r863 — Berhetiyye Layout & Completion Park

- Berhetiyye Hedef/Kalan kartlarında ikonlar ayrı grid hücresine alındı; yazı ve sayı ile çakışma kaldırıldı.
- Berhetiyye Atlası başlığı mücevher uçlarından güvenli iç alana çekildi; başlık ve etiket ortalandı.
- Berhetiyye Zikir Ayarları başlığı gerçek merkeze alındı; chevron bağımsız sağ konumda tutuldu.
- `Bitir` için capture-level tek güvenli giriş eklendi; doğrudan `SukunBerhetiyyeSeyir.stop()` çağrılır.
- Tekil Berhetiyye zikri hedefini tamamladığında (28 İsim Seyri içindeki ara tamamlanmalar hariç) ses otomatik başlatılmadan Esmâü’l-Hüsnâ kategorisine park edilir ve Mevlevî/normal görsel context tetiklenir.
- Park işlemi Esmâ zikrini kendiliğinden başlatmaz.
- HTML build meta, manifest, SW, latest/build/cache marker r863 olarak senkronlandı.
- Yeni asset yoktur.
