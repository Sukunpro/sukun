'use strict';
// Engineering browser fixture. App/static files are served byte-for-byte.
// Only device speech voices/completion and optional native media observation
// are controlled. No user browser/profile, microphone or private audio is used.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2'};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function fixture(root,{width=390,height=844,voices='both',seed={}}={}){
 root=path.resolve(root);const served=new Map(),errors=[],consoleErrors=[],failed=[],external=[],serverRejectedRequests=[];let networkAvailable=true;
 const server=http.createServer((req,res)=>{
  // Context offline emulation may leave service-worker target fetches online.
  // An opt-in server gate makes offline tests deny real network responses too.
  if(!networkAvailable){serverRejectedRequests.push(req.url);req.socket.destroy();return}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400).end();return}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(error,bytes)=>{if(error){failed.push({name,error:error.code});res.writeHead(404).end();return}
   served.set(path.relative(root,file),{sha256:hash(bytes),bytes:bytes.length});res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  });
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/sukun-browser/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-gpu']});
 const context=await browser.newContext({viewport:{width,height},locale:'tr-TR',serviceWorkers:'block'});
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/')||/^(data|blob):/.test(url))return route.continue();external.push(url);return route.abort()});
 await context.addInitScript(({voices,seed})=>{
  for(const [key,value] of Object.entries({'sukun.ui.shellMode':'classic','sukun.shell.r716':'1',...seed}))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);
  const eventTarget=new EventTarget(),log=[],cancelLog=[],mediaLog=[];let active=null,queue=[],auto=false;
  let available=(voices==='none'?[]:voices==='tr'?[{name:'Tolga',lang:'tr-TR',voiceURI:'synthetic-tr-male',localService:true,default:true}]:voices==='unknown'?[{name:'Google العربية',lang:'ar-SA',voiceURI:'synthetic-ar-unknown',localService:true,default:false},{name:'Tolga',lang:'tr-TR',voiceURI:'synthetic-tr-male',localService:true,default:true}]:[{name:'Maged',lang:'ar-SA',voiceURI:'synthetic-ar-male',localService:true,default:false},{name:'Tolga',lang:'tr-TR',voiceURI:'synthetic-tr-male',localService:true,default:true}]);
  class ControlledUtterance extends EventTarget{constructor(text=''){super();this.text=String(text);this.lang='';this.voice=null;this.rate=1;this.pitch=1;this.volume=1}}
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:ControlledUtterance});
  function notify(u,type,extra={}){const e=new Event(type);Object.assign(e,{utterance:u,charIndex:0,elapsedTime:0,...extra});try{u.dispatchEvent(e);u['on'+type]?.(e)}catch(_){} }
  function start(){if(active||!queue.length)return;active=queue.shift();const u=active;setTimeout(()=>{if(active!==u)return;notify(u,'start');if(auto)setTimeout(()=>finish(),5)},0)}
  function finish(){if(!active)return false;const u=active;active=null;notify(u,'end',{charIndex:u.text.length});start();return true}
  const api={getVoices:()=>available.slice(),get speaking(){return !!active},get pending(){return !!queue.length},get paused(){return false},speak(u){log.push({text:String(u.text),lang:u.lang,voice:u.voice?{name:u.voice.name,lang:u.voice.lang,voiceURI:u.voice.voiceURI}:null,rate:u.rate,pitch:u.pitch});queue.push(u);start()},cancel(){cancelLog.push({at:Date.now(),text:active?.text||''});active=null;queue=[]},pause(){},resume(){},addEventListener:eventTarget.addEventListener.bind(eventTarget),removeEventListener:eventTarget.removeEventListener.bind(eventTarget),dispatchEvent:eventTarget.dispatchEvent.bind(eventTarget)};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:api});
  window.__r1064SpeechFixture={log,cancelLog,mediaLog,finish,error(){if(!active)return false;const u=active;active=null;notify(u,'error',{error:'synthesis-failed'});start();return true},setAuto(value){auto=!!value},reset(){log.length=0;cancelLog.length=0;mediaLog.length=0},setVoices(value){available=value;eventTarget.dispatchEvent(new Event('voiceschanged'))},snapshot:()=>({active:active?.text||null,queued:queue.map(u=>u.text),log:log.slice(),cancelLog:cancelLog.slice(),mediaLog:mediaLog.slice()})};
  const originalPlay=HTMLMediaElement.prototype.play,originalPause=HTMLMediaElement.prototype.pause;
  const observedSource=el=>{const s=el.currentSrc||el.src;return s.startsWith('data:')?s.slice(0,s.indexOf(','))+',(synthetic bytes omitted)':s};
  const mediaIdentity=el=>{let silent=false;try{silent=el.dataset.sukSilentCarrier==='1'&&!!_r476SilentUrl&&el.src===_r476SilentUrl}catch(_){}return{src:observedSource(el),requestedSrc:el.src.startsWith('data:')?'data: (bytes omitted)':el.src,key:el.dataset.sukLockKey||'',silentCarrier:silent}};
  HTMLMediaElement.prototype.play=function(...args){mediaLog.push({op:'play',...mediaIdentity(this),at:Date.now()});return originalPlay.apply(this,args)};
  HTMLMediaElement.prototype.pause=function(...args){mediaLog.push({op:'pause',...mediaIdentity(this),at:Date.now()});return originalPause.apply(this,args)};
 },{voices,seed});
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 page.on('requestfailed',r=>{if(r.url().startsWith(origin))failed.push({url:r.url(),error:r.failure()?.errorText})});
 await page.goto(origin+'/nero.html',{waitUntil:'load',timeout:60000});
 try{await page.waitForFunction(()=>!!window.SukunVoiceSettings&&!!window.SukunVoiceResolver&&!!window.SukunSessionState,null,{timeout:15000})}
 catch(error){const state=await page.evaluate(()=>({ready:document.readyState,voice:!!window.SukunVoiceSettings,resolver:!!window.SukunVoiceResolver,session:!!window.SukunSessionState}));await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));throw Error(error.message+'; '+JSON.stringify({state,errors,consoleErrors,failed}))}
 await page.waitForTimeout(2200);
 if(await page.locator('#obSkip').isVisible())await page.locator('#obSkip').click();
 return{root,origin,browser,context,page,served,errors,consoleErrors,failed,external,
  setNetworkAvailable(value){networkAvailable=!!value},
  evidence(){return{root,served:Object.fromEntries(served),pageErrors:errors.slice(),consoleErrors:consoleErrors.slice(),failedRequests:failed.slice(),externalBlocked:external.slice(),serverRejectedRequests:serverRejectedRequests.slice()}},
  async close(){await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}};
}
function wav(seconds=0.6,frequency=330){const rate=8000,count=Math.round(seconds*rate),out=Buffer.alloc(44+count*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(count*2,40);for(let i=0;i<count;i++)out.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*frequency/rate)*500),44+i*2);return out}
module.exports={fixture,wav,hash};
