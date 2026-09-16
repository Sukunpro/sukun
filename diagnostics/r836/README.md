r836 doğrulama

172/172 kaynak, DOM ve Service Worker kontrolü geçti. Tarayıcı çizimi ve fiziksel cihaz sesi ölçülmedi.

node diagnostics/r836/test_regression.cjs
node diagnostics/r836/test_worker.cjs
node diagnostics/r836/test_ui.cjs
node diagnostics/r836/test_manual_settings.cjs

Son iki test için geliştirme ortamında linkedom@0.18.12 ve css-tree@3.2.1, Node çözümleme yolunda (veya NODE_PATH altında) olmalıdır. Uygulamanın bunlara bağımlılığı yoktur.
manual-settings-results.json gerçek nero.html işaretlemesinin ve ilgili canlı giriş işlevlerinin testlerini içerir; tam uygulama tarayıcı başlangıcı değildir.
Önceki diagnostics klasörleri tarihî sürüm kontrolleridir.
