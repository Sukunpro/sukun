# r875 FLASH ROOTFIX

Gerçek flashing sebebi kaynakta bulundu:

1. `sukun-r798-jewel-bindings` içindeki `scrubLegacyInline()` #berhetSeyir altındaki
inline `!important` görsel stilleri MutationObserver tetiklendikçe siliyordu.
2. `sukun-r875-jewel-stability-authority` style etiketi kaynakta iki kez iç içe yazılmıştı.
3. Son hotfix runtime'ları da aynı düğmeleri tekrar boyuyordu.

Düzeltme:
- #berhetSeyir r798 scrub listesinden çıkarıldı.
- malformed/duplicate r875 stability bloğu kaldırıldı.
- journey paint runtime'ları kaldırıldı.
- tek CSS-only journey authority bırakıldı.
- SW/manifest/sürüm zinciri değişmedi.

index.html: single_authority=1, journey_once=0, OWNED_has_berhetSeyir=False, duplicate_stability=0
nero.html: single_authority=1, journey_once=0, OWNED_has_berhetSeyir=False, duplicate_stability=0