# r891

- Kök neden: r890 görünür sayaç olan `#r819CounterStage/#r819CounterDisc` yerine alttaki `#zCountVisual` katmanını boyuyordu.
- Daha kritik olarak r890 senkronu `#r819CounterDisc` öğesini siliyordu. Bu yüzden kristal çarkın görünmesi yapısal olarak imkânsızdı.
- r891 silmeyi kaldırır ve Berhetiyye görselini doğrudan ekranda gerçekten görünen `#r819CounterDisc` üzerine uygular.
- Berhetiyye bağlamında `data-r819-counter=berhet` zorlanır; tek sayı/yüzde otoritesi `#r819CounterNums` olur.
- r888/r889 geçici img katmanları temizlenir; çift çark/sayı önlenir.
