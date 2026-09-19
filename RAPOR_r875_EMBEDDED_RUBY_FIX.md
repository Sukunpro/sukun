# r875 EMBEDDED RUBY FIX

Önceki paketlerde Bitir için harici `ruby-r872` dosya yolu kullanılıyordu.
Canlı ekrandaki davranış, bu asset'in güvenilir biçimde yüklenmediğini gösteriyor.

Bu sürümde:
- Ruby jewel PNG doğrudan HTML/CSS içine base64 data URI olarak gömüldü.
- Bitir artık ağ/cache/GitHub asset yoluna bağlı değil.
- Diğer butonlar canlıda zaten çalışan mevcut `.png` asset adlarına döndürüldü
  (`btn-primary-wide.png`, sapphire.png, emerald.png, amethyst.png).
- Runtime/MutationObserver eklenmedi.
- r798 flashing düzeltmesi korunuyor.
- SW/manifest/version değişmedi.
Embedded ruby bytes: 274164
