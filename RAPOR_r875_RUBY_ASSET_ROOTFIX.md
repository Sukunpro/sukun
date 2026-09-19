# r875 RUBY ASSET ROOTFIX

Kaynak incelemesinde iki somut problem bulundu:

1. Eski sürümlerden r798/r811/r812/r829/r831/r833/r835 aynı `#bsStop`
   için birbirinden farklı `background` / `background-image !important` kuralları taşıyordu.
   Bu pakette `bsStop/es99Stop` hedefleyen eski görsel CSS kuralları temizlendi.

2. Ruby kaynak PNG 1744×830 idi ve gerçek jewel yaklaşık y=194..654 bölgesindeydi.
   Yani asset'in üst/altında çok büyük şeffaf alan vardı. Yeni dosya gerçek görünür
   jewel alanına kırpıldı ve mobil için küçültüldü.

Yeni asset:
`assets/berhetiyye-premium/btn-stop-ruby-r875.png`
Boyut: 1000×265

Flashing'i çözen r798 scrub değişikliği korunmuştur.
Yeni MutationObserver/runtime repaint yoktur.
SW/manifest/version değiştirilmemiştir.
