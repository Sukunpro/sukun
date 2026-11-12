const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('assets/runtime/reading-audio-r1064.js','utf8'),a=code.indexOf('function makeQueue('),b=code.indexOf('function clearUtterance',a);
const c={window:null,state:{content:'legacy'},ttsBol:s=>[s]};c.window=c;c.w=c;vm.createContext(c);vm.runInContext(code.slice(a,b)+';this.queue=makeQueue;',c);
vm.runInContext(fs.readFileSync('assets/runtime/surah-data-r1250.js','utf8'),c);
let count=0;
for(const key of ['abese','tarik']){const d=c.SukunSurahDataR1250[key],entry={...d,basmalaLatin:'Bismillâhirrahmânirrahîm.'};
 for(const content of ['arabic','meaning','legacy']){c.state.content=content;
 const q=c.queue(entry,{}, {text:entry.verses.map(v=>v.latin).join(' ')}),field={arabic:'arabicTts',meaning:'meaning',legacy:'latin'}[content];
 assert.equal(q[0].text,content==='arabic'?d.basmalaTts:content==='meaning'?d.basmalaMeaning:entry.basmalaLatin);
 for(const v of d.verses)assert.equal(q.find(x=>x.verse===v.number).text,v[field]);count++;
 const last=c.queue(entry,{startVerse:999,onlyVerse:true},{text:'ignored'});assert.equal(last.length,1);assert.equal(last[0].verse,d.verses.length);count++;
 }}
c.state.content='legacy';assert.equal(c.queue({id:'reading:old',verses:[{number:1,meaning:'not Latin'}]},{},{text:'legacy policy text'})[0].text,'legacy policy text');count++;
console.log(JSON.stringify({passed:count,total:count,scope:'Arabic, meaning and Latin stay distinct; exact verse boundaries and legacy policy fallback'}));
