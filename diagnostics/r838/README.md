# r838 doğrulama

197 otomatik kontrol: 126 regresyon, 20 DOM/CSS, 16 manuel sayaç/ayar, 8 sahne, 13 service worker, 14 ses yaşam döngüsü. Tamamı geçti.

Bunlar Node VM ve DOM simülasyonlarıdır; gerçek tarayıcı görüntü doğrulaması ve Android kilit ekranı testi yapılmamıştır. Ses testlerinde zaman, medya öğeleri ve konuşma motoru simüle edilir. Fiziksel cihazda ses motorunun veya işletim sisteminin askıya alınmadığına ilişkin garanti değildir.

Testler: `NODE_PATH=<linkedom ve css-tree içeren node_modules> node diagnostics/r838/test_background_audio.cjs` ve diğer test_*.cjs dosyaları.
