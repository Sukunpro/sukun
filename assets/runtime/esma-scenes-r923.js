/* Approved Esmâ artwork catalog. SceneEngine remains the only painter. */
(()=>{'use strict';
const folder='./assets/scenes/esma-r923/';
const scene=(id,title,group,note='',sources=[])=>Object.freeze({id,sceneId:'esma-'+id,title,group,note,
 asset:folder+id+'.webp',lite:folder+id+'-lite.webp',sources:Object.freeze(sources.map(Object.freeze))});
window.SukunEsmaScenes=Object.freeze([
 Object.freeze({id:'classic',sceneId:'esma-classic',title:'Klasik Mevlevî',group:'Sükûnet',note:'Mevcut Mevlevî sahnesi.',asset:'./assets/scenes/mobile-r918/mevlevi.webp',lite:'./assets/sukun-nur-sanctuary-r757.png',sources:Object.freeze([])}),
 scene('mevlevi-sema','Mevlevî Semâ','Sükûnet','Kandiller, semâ ve gece mavisi.'),
 scene('kandilli-tekke','Kandilli Tekke','Sükûnet','Ahşap, yağmur ve sıcak kandil ışığı.'),
 scene('cami-avlusu','Cami Avlusu','Sükûnet','Seher ışığında mermer avlu ve su yansımaları.'),
 scene('kabede-seher','Kâbe’de Seher','Sükûnet','Mavi seher ve sakin mermer zemin; sanatsal tasvir.'),
 scene('kuduste-seher','Kudüs’te Seher','Kudüs anlatıları','Türk bayraklarıyla hayal edilen Kudüs. Sembolik gelecek tasviri; bir hadisin birebir betimlemesi değildir.'),
 scene('aksada-ayni-saf','Aksâ’da Aynı Saf','Kudüs anlatıları','Kompozisyonda Mehdî imam, Îsâ arkasındaki ilk safta tasvir edilir. Müslim 156, Îsâ’nın imamlık teklifini geri çevirdiğini anlatır; imamı Mehdî diye adlandırmaz ve Kudüs’ü belirtmez. Yer, askerler ve bayraklar sanatsal yorumdur.',[{title:'Sahîh-i Müslim 156',url:'https://sunnah.com/muslim:156'}]),
 scene('lud-kapisi','Lüd Kapısında Fitnenin Sonu','Kudüs anlatıları','Müslim 2937a, Îsâ’nın Deccal’i Lüd kapısında öldürmesini anlatır. Kılıcın biçimi, bayraklar ve görsel ayrıntılar sanatsal yorumdur.',[{title:'Sahîh-i Müslim 2937a',url:'https://sunnah.com/muslim:2937a'}]),
 scene('nur-mucadelesi-catalli','Nur Mücadelesi · Çatallı Zülfikar','Sembolik sahneler','Sağda yeşil-beyaz nur, solda kırmızı-siyah atmosfer. Havada mücadele, ifrit ordusu ve Îsâ’nın elindeki Zülfikar fantastik yorumdur. Çatallı uç geleneksel ikonografiyi izler; doğrulanmış tarihî kopya değildir.',[{title:'TDV · Zülfikar',url:'https://islamansiklopedisi.org.tr/zulfikar'}]),
 scene('nur-mucadelesi-yivli','Nur Mücadelesi · Yivli Kılıç','Sembolik sahneler','Aynı sembolik karşılaşmanın tek uçlu kılıç yorumu. İki keskin kenar ve orta yiv, TDV’de aktarılan tariften esinlenir; aslına ait kesin bir rekonstrüksiyon değildir. Havada mücadele ve ifrit ordusu fantastik yorumdur.',[{title:'TDV · Zülfikar',url:'https://islamansiklopedisi.org.tr/zulfikar'}])
]);
})();
