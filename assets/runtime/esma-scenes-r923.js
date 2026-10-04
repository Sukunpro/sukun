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

/* r927: data-only automatic scenery. The canonical active name index supplied
 * by SceneEngine is the only input; this module never paints, plays audio,
 * reads a journey preview, or owns a timer. These are visual arrangements,
 * not religious associations between a Divine Name and a place. */
const byId=new Map(window.SukunEsmaScenes.map(s=>[s.id,s]));
const calmSequence=Object.freeze([
 'cami-avlusu','kabede-seher','kandilli-tekke','mevlevi-sema','classic'
]);
// ZIKIR.esma.items: Rahmân=0 ... Sabûr=98. Lafza-i Celâl currently lives
// in the separate temel category and must not be mistaken for Esmâ index 0.
const nameScenes=Object.freeze(Array.from({length:99},(_,index)=>{
 const selected=byId.get(calmSequence[index%calmSequence.length]);
 return Object.freeze({index,ordinal:index+1,id:selected.id,sceneId:selected.sceneId});
}));
const autoOption=Object.freeze({id:'auto',title:'İsme göre otomatik',group:'Otomatik',
 note:'İsim değiştikçe avlu, Kâbe, tekke ve Mevlevî sahneleri değişir. Eşleştirme görsel bir düzenlemedir.'});
function forIndex(index){
 if(!Number.isInteger(index)||index<0||index>=nameScenes.length)return null;
 return byId.get(nameScenes[index].id);
}
function validChoice(choice){return choice==='auto'||byId.has(choice)}
function resolve(choice,index){
 if(choice==='auto')return forIndex(index)||byId.get('classic');
 return byId.get(choice)||byId.get('classic');
}
window.SukunEsmaScenePolicy=Object.freeze({version:'r927',defaultChoice:'auto',
 autoOption,calmSequence,nameScenes,forIndex,validChoice,resolve});
})();
