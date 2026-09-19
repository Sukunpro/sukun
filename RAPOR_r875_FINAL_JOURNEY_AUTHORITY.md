# r875 FINAL JOURNEY AUTHORITY

Yeni kök neden:
Önceki temiz CSS `<head>` içine eklenmişti. Fakat dosyanın en sonunda bulunan
`sukun-r864-approved-journey-mockup` daha sonra parse edildiği ve daha yüksek
specificity kullandığı için özellikle `#bsStop` arka planını tekrar
`btn-secondary-ruby-r864.png` dosyasına çeviriyordu. Sunucudaki o eski asset
yolu başarısız olduğunda Bitir çıplak kalıyordu.

Düzeltme:
- r864'ün sadece journey görsel override bölümü kaldırıldı.
- r864 runtime korundu; sadece Başlat/Duraklat durum class'ını yönetiyor.
- temiz 7-button DOM korundu.
- final journey authority `</body>` öncesine, r864'ten SONRA yerleştirildi.
- r798 flashing düzeltmesi korunuyor.
- MutationObserver/repaint eklenmedi.
- SW/manifest/version değişmedi.

index.html: final_after_r864=True; IDs=['bsStart', 'bsPause', 'bsPrev', 'bsNext', 'bsAgain', 'bsStop', 'bsReset']; old_r864_ruby_rule=False
nero.html: final_after_r864=True; IDs=['bsStart', 'bsPause', 'bsPrev', 'bsNext', 'bsAgain', 'bsStop', 'bsReset']; old_r864_ruby_rule=False