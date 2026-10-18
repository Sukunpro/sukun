# SÜKÛN r1105 — Okunaklı metinler ve uzun kayıt dalgası

Frekanslar yardım satırı, mod ve frekans etiketleri; ortak rutinler; Düzen,
Bildirimler ve Zikir yardımcı metinleri yerel koyu zemin ve açık yazıyla
belirginleştirilir. Stüdyo açıklamaları ile süre/tepe/boyut etiketleri de aynı
paleti kullanır. Gizli bölümler, seçili durumlar, bildirim tür renkleri ve
okundu görünümü kendi kurallarını korur. Ambiyansın yuvarlak bilgi düğmeleri
ve kompakt kontrol ölçüleri korunur.

Kayıt Stüdyosu, 60 saniyeyi aşan kayıtlarda ses dalgasını doğrudan atlamaz.
Salt okunur analiz, doğrulanmış en çok 180 saniye ve 8 MiB kaynak için mevcut
32 MiB bellek bütçesine sığıyorsa gerçek örneklerden dalga, tepe ve RMS
hesaplar. Bellek yetmezse yalnız süre ve boyut gösterildiği açıkça belirtilir.
Analiz özgün kaydı değiştirmez ve oynatmayı başlatmaz. Normalize ve sessizlik
kırpma işlemlerinin 60 saniyelik sınırı korunur.

Salt okunur tarama, yerel PCM örneklerini kopyalamadan okur ve küçük parçalar
arasında arayüze zaman bırakır. Mevcut iptal, sıra, süre aşımı ve kayıt seçimi
korumaları geçerlidir. Sarı grafik yalnız gerçek analiz sonucu çizilir.

Sağlık kontrolü, r1101 ve sonrasında eklenen sekiz zorunlu CSS/JS yolunu
açık listeyle tanır. Yalnız bu dosyalar kabul edilir; aynı kaynak, SHA-256,
dosya boyutu ve toplam bütçe doğrulamaları korunur. Böylece geçerli sürüm
dosyaları yanlışlıkla bozuk sürüm olarak raporlanmaz.
