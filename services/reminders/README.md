# Günlük Web Push göndericisi

Node 24 ve SQLite ile uygulama sahibinin HTTPS sunucusunda çalışır. Bildirim verisi kişisel kayıt içermez. Abonelik uç noktaları ve yerel saat dilimi özel veritabanında kalır. Veritabanını ve VAPID özel anahtarını web kökünün dışında saklayın.

1. Bu dizinde `npm ci --omit=dev` çalıştırın. VAPID anahtarlarını sunucuda `npx web-push generate-vapid-keys` ile oluşturun. Özel anahtarı sunucunun gizli ayarlarına koyun.
2. `VAPID_CONTACT` (mailto: adresi), `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `DATABASE_PATH` (kalıcı, özel SQLite dosyası) ve `APP_ORIGIN=https://sukunpro.github.io` ayarlayın. `npm start` çalıştırın. Yerel portu TLS sonlandıran ve istek hızını sınırlayan ters vekil üzerinden sunun.
3. Web girişinde `sukun-push-endpoint` alanına HTTPS /subscriptions adresini, `sukun-push-public-key` alanına yalnız açık anahtarı koyun. Gerekirse yalnız göndericinin kaynağını connect-src listesine ekleyin. Depodaki sürüm aracıyla iki giriş dosyası, SRI ve manifestleri tekrar üretin.
4. Bildirimler sekmesinde cihaz hatırlatmasını açın. İzin verilince abonelik kaydolur. Gönderici, cihazın bildirdiği yerel saat diliminde 09.00–09.59 arasında her gün en çok bir boş Web Push iletisi yollar. Açılınca öneri içeride gösterilir. Saat dilimi uygulama yeniden odaklandığında yenilenir. Kapatmak tarayıcı aboneliğini iptal eder. Süresi dolan uç noktalar 404/410 yanıtında kaldırılır.

Chrome, Firefox veya Safari'nin desteklenen push hizmeti gerekir. Android paketindeki çevrimdışı WebView bu tarayıcı aboneliğini kullanamaz.
