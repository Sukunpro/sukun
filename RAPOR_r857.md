# SÜKÛN r857 — Tefekkür Çıkış Transport Niyeti

- Tefekkürden çıkış artık yalnız görünüm değişimidir; Play/Resume komutu değildir.
- Çıkış anında direct zikir `Z.auto`, AudioLife `userPaused`, AudioSessionRegistry aggregate pause ve MINI pause durumu snapshot edilir.
- Kullanıcı çıkıştan önce Stop verdiyse, çıkışın lifecycle/recovery zinciri zikir otomatiğini yeniden kaldırırsa 0/80/260/700/1400 ms koruma pencerelerinde tekrar terminal Stop uygulanır.
- Kullanıcı çıkıştan önce Pause verdiyse kullanıcı pause niyeti korunur ve registry pause gate yeniden doğrulanır; Tefekkür çıkışı Resume'a dönüşmez.
- Zikir çıkıştan önce gerçekten çalıyorsa, Tefekkürden çıkınca çalmaya devam etme davranışı korunur.
- r857 HTML/SW/manifest/latest/build marker senkronlandı.
