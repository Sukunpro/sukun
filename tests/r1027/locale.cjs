'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('const I18N = {'),end=html.indexOf('window.I18N=I18N;',start)+'window.I18N=I18N;'.length,c={};c.window=c;vm.createContext(c);vm.runInContext(html.slice(start,end),c);
for(const m of html.matchAll(/<script\b[^>]*id="[^"]*locale[^"]*"[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);
const results=[];function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}}
c.I18N.lang='en';
const notes=JSON.parse(html.match(/<script id="surumNotlari" type="application\/json">([\s\S]*?)<\/script>/)[1]);
for(const n of notes.filter(n=>/^r\d+$/.test(n.v)&&+n.v.slice(1)>=1021))for(const [i,raw] of n.b.entries())test(n.v+' note '+(i+1)+' has English translation',()=>{assert.notEqual(c.I18N.t(raw),raw);assert(c.I18N.t(raw).length>0);});
for(const raw of ['Bir zikir çektiğinde ya da frekans dinlediğinde burada birikir.','1,5 dakikadan uzun bir seans bitince burada belirir.','SEÇILI ESMÂ','Ses ve ritim','Ses açılamadı. Yeniden dene ile sesi tekrar başlat; manuel sayım için önce Bitir düğmesine dokun.','Kayıt tamamlanmadı. Yeniden dinlemek için tekrar dene.','Kayıt deposu okunamadı · ▶ ile tekrar dene','Kayıt tamamlanmadı. Yeniden dene.','Sesi yeniden dene','Yeniden dene','Kayıt deposu okunamadı. Bu, kayıtların silindiği anlamına gelmez.','Kayıt silinemedi. Listede korundu.'])test('English helper: '+raw,()=>assert.notEqual(c.I18N.t(raw),raw));
c.I18N.lang='tr';for(const raw of notes[0].b)test('Turkish retains current release text: '+raw.slice(0,45),()=>assert.equal(c.I18N.t(raw),raw));
const report={passed:results.filter(x=>x.passed).length,total:results.length,method:'Exact shipped I18N in Node VM, current/recent release notes and known visible helper text; no full-device locale claim.',results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
