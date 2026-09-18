# SÜKÛN r849

- Görünür ana başlık `ZİKİR SAYAÇ` -> `ZİKİR ÇARKI` olarak hem statik DOM'da hem başlığı yeniden üreten eski runtime kodunda değiştirildi.
- r848'deki ayar açma zincirinin birbirini ezdiği doğrulandı: r830 capture/stopImmediatePropagation ve r848 portal/clone katmanları aynı kontrol üzerinde otorite kuruyordu.
- r849'da Zikir Ayarları erişimi için güvenli mod uygulandı: gerçek `#r679ZikirAyarBox` ve gerçek `.r679SettingsBody` açık ve görünür tutuluyor; sahte dialog/portal gizleniyor. Böylece açma olayının engellenmesi ayarlara erişimi engelleyemiyor.
- Service Worker `SURUM=r849`, cache `sukun-r849-20260918b`, manifest/start_url r849 ve HTML build meta r849 olarak eşitlendi. SW kayıt URL'si build metadan `sw.js?v=r849` üretir.
