'use strict';
// Shipped worker algorithms, synthetic network/cache and media fixtures. No
// browser timing, audible playback or physical-device claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),source=fs.readFileSync(path.join(root,'sw.js'),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const build=source.match(/const SURUM = '([^']+)'/)[1],base='https://sukun.test/app/sw.js',key=x=>new URL(typeof x==='string'?x:x.url,base).href;
const tests=[];async function check(name,fn){await fn();tests.push(name);console.log('PASS '+name)}
function fixture(){
 const files=new Map(),stores=new Map(),handlers=new Map(),calls=[];let fail='',rejectWrites=false,network=false;
 const core={url:'./assets/runtime/fixture.js?v='+build,sha256:hash('core-code')};
 const audio=[{url:'./assets/audio/fixture-a.mp3?v='+build,sha256:hash('abcdef'),bytes:6,packageId:'short'},{url:'./assets/audio/fixture-b.mp3?v='+build,sha256:hash('ghijkl'),bytes:6,packageId:'short'}];
 const html='<meta name="sukun-build" content="'+build+'"><script src="'+core.url+'" integrity="sha256-'+Buffer.from(core.sha256,'hex').toString('base64')+'"></script>';
 const marker={build,runtime:[core],shell:{sha256:hash(html)},optionalAudio:audio};
 for(const[p,value]of [[core.url,'core-code'],[audio[0].url,'abcdef'],[audio[1].url,'ghijkl'],['./nero.html',html],['./manifest.webmanifest',JSON.stringify({short_name:'SÜKÛN',start_url:'./nero.html?v='+build})],['./sukun-build-'+build+'.json',JSON.stringify(marker)],['./sukun-latest.json',JSON.stringify({v:build})]])files.set(key(p),value);
 function store(name){if(!stores.has(name))stores.set(name,new Map());return stores.get(name)}
 const caches={keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),open:async name=>({keys:async()=>[...store(name).keys()].map(u=>new Request(u)),match:async(input,options={})=>{const u=key(input),entry=options.ignoreSearch?[...store(name)].find(([p])=>new URL(p).pathname===new URL(u).pathname):[u,store(name).get(u)];return entry?.[1]?.clone()},put:async(input,response)=>{if(rejectWrites&&name==='sukun-audio-persistent-v1')throw Error('quota');store(name).set(key(input),response.clone())},delete:async input=>store(name).delete(key(input))})};
 const client={id:'one',type:'window',url:'https://sukun.test/app/nero.html',postMessage:()=>{}};
 const c={console,URL,Promise,Math,Number,String,Object,Set,Map,Array,Uint8Array,TextEncoder,Response,Headers,AbortController,DOMException,crypto:crypto.webcrypto,btoa,Date,setTimeout,clearTimeout,caches,
 Request:class extends Request{constructor(input,init){super(typeof input==='string'?key(input):input,init)}},
 fetch:async request=>{const u=key(request);calls.push(u);if(network||u===fail)throw Error('offline');return new Response(files.get(u)||'missing',{status:files.has(u)?200:404,headers:{'Content-Type':u.includes('.mp3')?'audio/mpeg':'application/octet-stream'}})},
 self:{location:new URL(base),registration:{scope:'https://sukun.test/app/'},navigator:{storage:{estimate:async()=>({quota:1e9,usage:0})}},clients:{get:async id=>id==='one'?client:null,matchAll:async()=>[client],claim:async()=>{}},addEventListener:(type,handler)=>handlers.set(type,handler)}};
 const fixtureSource=source.replace(/const REQUIRED_RUNTIME = \[[\s\S]*?\];/,'const REQUIRED_RUNTIME = '+JSON.stringify([core])+';').replace(/const OPTIONAL_AUDIO = \[[\s\S]*?\];/,'const OPTIONAL_AUDIO = '+JSON.stringify(audio)+';');vm.createContext(c);vm.runInContext(fixtureSource,c);
 const run=code=>vm.runInContext(code,c);
 async function message(type,extra={}){const replies=[],waits=[];handlers.get('message')({data:{type,build,packageId:'short',...extra},source:{id:'one'},ports:[{postMessage:value=>replies.push(value)}],waitUntil:p=>waits.push(p)});await Promise.all(waits);return{replies,last:replies.at(-1)}}
 return{run,message,c,caches,files,audio,core,calls,stores,fail:url=>fail=key(url),online:()=>{network=false;fail=''},offline:()=>network=true,rejectAudioWrites:()=>rejectWrites=true};
}

module.exports={fixture,source,key,build};
