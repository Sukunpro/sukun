'use strict';
// Independent content conservation properties against the shipped splitter.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const start=html.indexOf('function ttsTemizle('),end=html.indexOf('function dlParcala(',start);assert(start>=0&&end>start,'Production splitter boundaries');
const c={};vm.createContext(c);vm.runInContext(html.slice(start,end),c,{filename:'shipped-inline-arabic-splitter.js'});
const tests=[],normal=text=>String(text).replace(/\s+/gu,' ').trim();
function test(name,work){try{work();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.stack||String(e)})}}
function conserve(text,limit=190){const chunks=Array.from(c.ttsBol(text,limit));assert(chunks.length>0);assert.equal(normal(chunks.join(' ')),normal(text),'Every Arabic letter, mark and boundary must survive chunking in original order');assert(chunks.every(x=>/\p{L}/u.test(x)),'No decorative-only chunk');return chunks}
test('Arabic-only long supplication survives repeated splitting without dropped chunks',()=>{const text=Array(90).fill('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ').join(' ');assert(conserve(text).length>20)});
test('Arabic diacritics, Quran marks and Uthmani spelling remain unchanged',()=>{const text=Array(35).fill('فَسُبْحَـٰنَ ٱلَّذِى بِيَدِهِۦ مَلَكُوتُ كُلِّ شَىْءٍ وَإِلَيْهِ تُرْجَعُونَ').join(' ');assert(conserve(text,95).length>20)});
test('Arabic punctuation and paragraph order survive sentence, comma and word splits',()=>{const text=Array(18).fill('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ، الرَّحْمَٰنِ الرَّحِيمِ؛ مَالِكِ يَوْمِ الدِّينِ.').join('\n\n');conserve(text,90)});
test('Mixed original and transliteration fragments do not erase Arabic',()=>{const text=Array(30).fill('اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ. Allâhümme salli alâ Muhammed.').join(' ');conserve(text,85)});
test('Boundary-only Arabic honorific signs are not silently discarded',()=>{for(const mark of ['ﷺ','ﷻ']){const text='ا'.repeat(190)+' '+mark,chunks=Array.from(c.ttsBol(text,190));assert.equal(normal(chunks.join(' ')),normal(text))}});
test('Short canonical dhikr keeps its exact extent',()=>{const short='سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',combined='سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ';assert.equal(Array.from(c.ttsBol(short)).join(' '),short);assert.equal(Array.from(c.ttsBol(combined)).join(' '),combined);assert.notEqual(short,combined)});
test('Empty input yields no fabricated utterance',()=>assert.equal(Array.from(c.ttsBol('')).length,0));
console.log(JSON.stringify({suite:'r1064 Arabic chunk content conservation',root,total:tests.length,passed:tests.filter(x=>x.passed).length,method:'Production inline functions executed; independent expected full strings. No speech-device, Android or audibility claim.',tests},null,2));if(tests.some(x=>!x.passed))process.exitCode=1;
