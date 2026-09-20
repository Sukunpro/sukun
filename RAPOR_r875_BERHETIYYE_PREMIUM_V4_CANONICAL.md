# r875 BERHETİYYE PREMIUM V4 — CANONICAL DOM

Kök düzeltme:
- Yeni CSS katmanı eklemek yerine mevcut gerçek bs* düğmeleri kanonik sıraya alınır.
- Düğmeler clone edilmez; mevcut click handler'lar korunur.
- Grid ve premium background'lar aynı gerçek node'lara inline !important olarak uygulanır.
- bsReset her durumda gerçek grid satırına geri konur.
- Panel ve button container height:auto/min-height:0 ile dev boşluk üretmez.
- r866 detached jewel helper parçaları kaldırılır.
- r433DockPeek Premium jewel ailesinden çıkarılır ve koyu cam player peek olur.
- seyirCreate yeni panel oluşturduğunda V4 apply çağrısı doğrudan yapılır.
- MutationObserver / setInterval yoktur.
- r798 #berhetSeyir scrub ownership dışında kalır; flashing fix korunur.
- SW / manifest değiştirilmedi.

Yükleme:
ZIP'i klasör yapısını bozmadan komple yükleyin.
