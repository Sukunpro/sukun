'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const file=process.argv[2]||require('node:path').resolve(__dirname,'../../nero.html');
const source=fs.readFileSync(file,'utf8');
const routerSource=source.slice(source.indexOf('const SukunAIRouter=(()=>{'),source.indexOf('\n\n/* r320 — AI'));
const tests=[];
function test(name,fn){tests.push([name,fn]);}
function response(status=200,body={candidates:[{content:{parts:[{text:'TAMAM'}]}}]}){return {ok:status>=200&&status<300,status,headers:{get(){return null}},json:async()=>body}}
function harness(opts={}){
 const saved=new Map(Object.entries(opts.saved||{})),calls=[],confirmations=[];
 const context={RX_API_KEY:'',window:{dispatchEvent(){}},document:{getElementById(){return null}},navigator:{onLine:opts.online!==false},S:{get:(k,f)=>saved.has(k)?saved.get(k):f,set:(k,v)=>saved.set(k,v)},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},AbortController,TextDecoder,URL,CustomEvent:class{constructor(name,options){this.name=name;this.detail=options.detail}},setTimeout:opts.setTimeout||setTimeout,clearTimeout,confirm:s=>(confirmations.push(s),opts.consent!==false),fetch:async(url,init)=>{calls.push({url,init});return opts.fetch?opts.fetch(url,init,calls.length):response()},console};
 context.window.I18N={t:s=>s};vm.createContext(context);vm.runInContext(routerSource,context);
 return{r:context.window.SukunAIRouter,saved,calls,confirmations,context};
}
const key='DUMMY_LOCAL_TEST_NEVER_TRANSMITTED';
function gemini(opts={}){const x=harness(opts);x.r.setKey('gemini',key);return x}
function run(x){return x.r.complete({provider:'gemini',system:'Test',user:'Synthetic test only',maxTokens:128})}
test('Current picker and router model lists agree',()=>{const x=harness();assert.deepEqual([...x.r.MODELS.gemini],['gemini-4-hydrogen','gemini-3.8-flash','gemini-3.5-flash-lite','gemini-3.6-flash']);const picker=source.match(/<select id="aiModel-gemini">([\s\S]*?)<\/select>/)[1];for(const m of x.r.MODELS.gemini)assert(picker.includes(`value="${m}"`));assert(!picker.includes('gemini-2.5-flash'));});
test('Missing key never calls network',async()=>{const x=harness();await assert.rejects(run(x),{code:'MISSING_KEY'});assert.equal(x.calls.length,0);});
test('Offline known key does not prompt consent or fetch',async()=>{const x=gemini({online:false});await assert.rejects(run(x),{code:'OFFLINE'});assert.equal(x.calls.length,0);assert.equal(x.confirmations.length,0);assert.equal(x.r.snapshot().busy,false);});
test('Consent refusal never calls network',async()=>{const x=gemini({consent:false});await assert.rejects(run(x),{code:'CONSENT_REQUIRED'});assert.equal(x.calls.length,0);});
test('Default Gemini path, payload and secret isolation',async()=>{const x=gemini();const r=await run(x);assert.equal(r.model,'gemini-4-hydrogen');assert.equal(r.text,'TAMAM');assert.equal(x.calls.length,1);const {url,init}=x.calls[0],body=JSON.parse(init.body);assert(url.endsWith('/gemini-4-hydrogen:generateContent'));assert(!url.includes(key));assert.equal(init.headers['x-goog-api-key'],key);assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert(!('temperature' in body.generationConfig));assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'LOW');assert(!('maxOutputTokens' in body.generationConfig));assert(!JSON.stringify(x.r.snapshot()).includes(key));assert.equal(x.saved.get('sukun.ai.key.gemini'),'');});
test('3.8 Flash explicit selection works in controlled response',async()=>{const x=gemini({saved:{'sukun.ai.model.gemini':'gemini-3.8-flash'}});assert.equal((await run(x)).model,'gemini-3.8-flash');});
test('Legacy explicit 2.5 choice maps only to 3.5 Lite',async()=>{const x=gemini({saved:{'sukun.ai.model.gemini':'gemini-2.5-flash'},fetch:()=>response(404,{error:{message:'Model not found'}})});await assert.rejects(run(x),{code:'MODEL_UNAVAILABLE'});assert.equal(x.calls.length,1);assert(x.calls[0].url.includes('gemini-3.5-flash-lite'));});
test('Unavailable auto model falls back to 3.8',async()=>{const x=gemini({fetch:(_u,_i,n)=>n===1?response(404,{error:{message:'Model not found'}}):response()});const r=await run(x);assert.equal(r.model,'gemini-3.8-flash');assert.equal(x.calls.length,2);});
test('Rate limit does not fan out across Gemini models',async()=>{const x=gemini({fetch:()=>response(429,{error:{message:'quota'}})});await assert.rejects(run(x),{code:'QUOTA'});assert.equal(x.calls.length,1);assert(x.r.snapshot().providers.find(p=>p.id==='gemini').cooldownMs>0);});
test('401 rejected key is not retried',async()=>{const x=gemini({fetch:()=>response(401,{error:{message:'bad key'}})});await assert.rejects(run(x),{code:'AUTH'});await assert.rejects(run(x),{code:'AUTH'});assert.equal(x.calls.length,1);});
test('Invalid JSON/text response is rejected',async()=>{const x=gemini({fetch:()=>response(200,{candidates:[]})});await assert.rejects(run(x),{code:'INVALID_RESPONSE'});assert.equal(x.calls.length,1);});
test('Thinking content never becomes user answer',async()=>{const x=gemini({fetch:()=>response(200,{candidates:[{content:{parts:[{thought:true,text:'hidden reasoning'},{text:'Visible answer'}]}}]})});assert.equal((await run(x)).text,'Visible answer');});
test('Cancel stops active request and unlocks router',async()=>{const x=gemini({fetch:()=>new Promise(()=>{})});const pending=run(x);x.r.cancel();await assert.rejects(pending,{code:'CANCELLED'});assert.equal(x.r.snapshot().busy,false);});
test('Duplicate call is blocked while request active',async()=>{let finish;const x=gemini({fetch:()=>new Promise(resolve=>finish=resolve)});const pending=run(x);await assert.rejects(run(x),{code:'AI_BUSY'});finish(response());await pending;assert.equal(x.calls.length,1);});
test('Offline to online recovery needs a fresh explicit request',async()=>{const x=gemini({online:false});await assert.rejects(run(x),{code:'OFFLINE'});x.context.navigator.onLine=true;assert.equal(x.calls.length,0);await run(x);assert.equal(x.calls.length,1);});
test('Timeout becomes actionable TIMEOUT and releases busy state',async()=>{const x=gemini({fetch:()=>new Promise(()=>{}),setTimeout:(fn)=>setTimeout(fn,1)});await assert.rejects(run(x),{code:'TIMEOUT'});assert.equal(x.r.snapshot().busy,false);});
const freeModel='inclusionai/ling-3.2-flash:free';
const ernie='baidu/ernie-5.5-flash-preview:free';
function chat(){return response(200,{choices:[{message:{content:'Yanıt'}}]})}
test('Automatic mode cannot use a billing-enabled provider key',async()=>{
 const x=gemini();
 x.r.setKey('anthropic',key);
 assert.equal(x.r.hasAnyKey(),true);
 assert.equal(x.r.hasSelectedKey(),false);
 await assert.rejects(x.r.complete({user:'Synthetic'}),{code:'MISSING_KEY'});
 assert.equal(x.calls.length,0);
});
test('Default uses current free model, then free pool on unavailability',async()=>{
 const x=harness({fetch:(_u,_i,n)=>n===1?response(503,{}):chat()});
 x.r.setKey('openrouter',key);
 x.r.setKey('moonshot',key);
 const r=await x.r.complete({user:'Synthetic'});
 assert.deepEqual(x.calls.map(c=>JSON.parse(c.init.body).model),[freeModel,'openrouter/free']);
 assert.equal(r.fallbacks,1);
 assert.equal(x.r.snapshot().providers.find(p=>p.id==='openrouter').code,'OK');
});
test('OpenRouter quota stops the request even with other keys',async()=>{
 const x=harness({fetch:()=>response(429,{})});
 for(const id of ['openrouter','groq','gemini','moonshot','anthropic'])x.r.setKey(id,key);
 await assert.rejects(x.r.complete({user:'Synthetic'}),{code:'QUOTA'});
 x.r.setKey('openrouter',key);
 await assert.rejects(x.r.complete({user:'Synthetic'}),{code:'QUOTA'});
 assert.equal(x.calls.length,1);
});
test('Explicit free ERNIE model uses the selected variant only',async()=>{
 const x=harness({saved:{'sukun.ai.model.openrouter':ernie},fetch:()=>chat()});
 x.r.setKey('openrouter',key);
 const r=await x.r.complete({user:'Synthetic'});
 assert.equal(r.model,ernie);
 assert.deepEqual([...x.r.MODELS.openrouter],[freeModel,'openrouter/free',ernie]);
 const picker=source.match(/<select id="aiModel-openrouter">([\s\S]*?)<\/select>/)[1];
 for(const model of x.r.MODELS.openrouter)assert(picker.includes('value="'+model+'"'));
});
test('Connection test permission cannot authorize subsequent personal text',async()=>{
 const x=gemini({saved:{'sukun.aiConsent.r310':1,'sukun.ai.consent.r1272.gemini':1}});
 await x.r.test('gemini');
 assert.equal(x.calls.length,1);
 assert(x.confirmations[0].includes('test metni'));
 x.context.confirm=message=>{x.confirmations.push(message);return false};
 await assert.rejects(run(x),{code:'CONSENT_REQUIRED'});
 assert.equal(x.calls.length,1);
 assert(x.confirmations[1].includes('Bu istekteki'));
 assert(x.confirmations.every(message=>message.includes('Gemini')));
});
test('NVIDIA only sends to the exact endpoint confirmed for each request',async()=>{
 const original='https://first.owner.workers.dev/nvidia',changed='https://second.owner.workers.dev/nvidia';
 const x=harness({fetch:(_url,_init,n)=>{
   if(n===1){x.r.setProxy(changed);return response(404,{error:{message:'model unavailable'}})}
   return chat();
 }});
 x.r.setKey('nvidia',key);
 x.r.setProxy(original);
 await x.r.complete({provider:'nvidia',user:'Synthetic'});
 assert.deepEqual(x.calls.map(call=>call.url),[original,original]);
 assert(x.confirmations[0].includes(original));
 x.context.confirm=message=>{x.confirmations.push(message);return false};
 await assert.rejects(x.r.complete({provider:'nvidia',user:'Synthetic'}),{code:'CONSENT_REQUIRED'});
 assert.equal(x.calls.length,2);
 assert(x.confirmations[1].includes(changed));
});
test('Gemini API_KEY_INVALID is an authentication error',async()=>{
 const x=gemini({fetch:()=>response(400,{error:{details:[{reason:'API_KEY_INVALID'}]}})});
 await assert.rejects(run(x),{code:'AUTH'});
});
test('Offline guide matches exact TR/EN choices, spelling variants and negative evidence',()=>{
 const block=source.slice(source.indexOf('const RX_PROFILES=['),source.indexOf('/* Envanterden bir frekans'));
 const c=vm.createContext({});
 vm.runInContext(block+';this.quick=RX_CHIPS.map(chip=>rxMatch(chip.q).id);this.match=q=>rxMatch(q).id;',c);
 assert.deepEqual([...c.quick],['uzgun','yorgun','uyku','enerji','odak','kaygi','tefekkur','uretken','ofke','sukran','yalniz','kaygi','uyku','tefekkur']);
 const cases={'ÜZGÜNÜM':'uzgun','uyuyamiyorum':'uyku','I feel lonely':'yalniz','I cannot focus':'odak',
  'I am not tired, I feel anxious':'kaygi','uykulu değilim, öfkeliyim':'ofke','kaygım yok':'genel','hayır':'genel',
  'yoldaki tabelada yazılım yazıyor':'genel','restaurant':'genel','xxxyyyzzz':'genel','İLHAM':'uretken','grateful':'sukran'};
 for(const [query,id] of Object.entries(cases))assert.equal(c.match(query),id,query);
});
test('General arrangements persist and repeated use keeps favorite status',()=>{
 let history=[];const c=vm.createContext({S:{get:()=>history,set:(_k,v)=>{history=v}},rxHistRender(){}});
 const catalog=source.slice(source.indexOf('const RX_PROFILES=['),source.indexOf('/* Envanterden bir frekans'));
 const helpers=source.slice(source.indexOf('function rxHistNorm(a)'),source.indexOf('function rxHistRender()'));
 vm.runInContext(catalog+helpers,c);
 c.rxHistAdd('test','genel');assert.equal(history[0].pid,'genel');
 history[0].fav=true;c.rxHistAdd('test','genel');
 assert.equal(history.length,1);assert.equal(history[0].fav,true);
 assert.equal(c.rxHistNorm([{pid:'unknown'}]).length,0);
});
test('Every offline arrangement resolves a breathing mode before NeuroSync opens',()=>{
 const profiles=source.slice(source.indexOf('const RX_PROFILES=['),source.indexOf('/* Envanterden bir frekans'));
 const start=source.indexOf('const BREATH_MODES = ['),end=source.indexOf('/* ════ İçsel Reçete profil sembolleri',start);
 assert(start>0&&end>start&&end<source.indexOf('window.__neuroFabrika=function()'));
 const c=vm.createContext({});
 vm.runInContext(profiles+source.slice(start,end)+';this.modes=[...RX_PROFILES,RX_FALLBACK].map(p=>[p.breath,rxBreath(p.breath)?.id]);',c);
 for(const [requested,actual] of c.modes)assert.equal(actual,requested);
 assert.equal(c.rxBreath('unknown'),null);
});
test('The NeuroSync fallback applies the selected preset through its native button',()=>{
 const card={dataset:{pid:'relax'}},preset={id:'relax',name:'Relax',icon:'',desc:'',hz:'10 Hz'};
 const result={querySelector:()=>null,querySelectorAll:()=>[card]};let applied;
 const c=vm.createContext({document:{getElementById:id=>id==='aiInput'?{value:'xyzxyz'}:result},
  findBestRules:()=>[],PRESETS:[preset],hesc:String,applyPreset:p=>{applied=p},showToast(){}});
 const block=source.slice(source.indexOf('function sendAI() {'),source.indexOf('// ─── TOAST ───',source.indexOf('function sendAI() {')));
 vm.runInContext(block,c);c.sendAI();assert.match(result.innerHTML,/<button[^>]+class="ai-result-preset"/);
 card.onclick();assert.equal(applied,preset);
});
test('AI planning sends the public inventory and keeps personal entries and adaptive history on-device',async()=>{
 const prompts=[],stop=Error('captured');
 const c=vm.createContext({
  AMBIENT_DEFS:[{id:'ocean',name:'Okyanus'},{id:'me',name:'PRIVATE_AUDIO',custom:true}],
  ZIKIR:{esma:{items:[{t:'Selâm'}]},terkip:{items:[{tr:'Public terkip'},{tr:'PRIVATE_TERKIP',kay:'kendi'}]},
   fav:{items:[{t:'PRIVATE_FAVORITE'}]},berhet:{gizli:true,items:[{t:'PRIVATE_VAULT'}]}},
  window:{SukunSecretPolicy:{unlocked:()=>true},SukunAdaptiveMemory:{summary:()=>'PRIVATE_MEMORY'},
   SukunAIRouter:{complete:async({user})=>{prompts.push(user);throw stop}}}
 });
 const start=source.indexOf('const SukunAIPlan='),end=source.indexOf('window.SukunAIPlan=SukunAIPlan;',start)+'window.SukunAIPlan=SukunAIPlan;'.length;
 vm.runInContext(source.slice(start,end),c);
 for(const type of ['generate','generateSession'])await assert.rejects(c.window.SukunAIPlan[type]('test'),e=>e===stop);
 assert.equal(prompts.length,2);
 for(const prompt of prompts){assert.match(prompt,/Okyanus/);assert.match(prompt,/Selâm/);assert.match(prompt,/Public terkip/);assert.doesNotMatch(prompt,/PRIVATE_/);}
});
test('Unusable frequency responses cannot become a verified or default AI plan',async()=>{
 const c=vm.createContext({AMBIENT_DEFS:[],ZIKIR:{},document:{querySelector:()=>null},window:{}});
 const plan=source.slice(source.indexOf('const SukunAIPlan='),source.indexOf('window.SukunAIPlan=SukunAIPlan;')+'window.SukunAIPlan=SukunAIPlan;'.length);
 vm.runInContext(plan,c);
 const api=c.window.SukunAIPlan;
 for(const invalid of [null,[],{}, {error:'unavailable'}, {carrier_hz:null,beat_hz:6}, {carrier_hz:180,beat_hz:' '}, {carrier_hz:true,beat_hz:6}, {carrier_hz:'abc',beat_hz:6}]){
  c.window.SukunAIRouter={complete:async()=>({text:JSON.stringify(invalid)})};
  await assert.rejects(api.generate('Synthetic'),/frekans/);
  assert.equal(api.last,null);
 }
 const verified=api.validate({carrier:'240',vurus:8,minutes:12});
 assert.equal(verified.carrier,240);assert.equal(verified.beat,8);assert.equal(verified.minutes,12);
 const good={type:'frequency',carrier_hz:240,beat_hz:8},silence={type:'silence',duration_min:2};
 const session=api.validateSession({steps:[{type:'frequency'},good,silence]});
 assert.equal(session.steps.length,2);assert.equal(session.steps[0].carrier,240);assert.equal(session.warnings.length,1);
 assert.throws(()=>api.validateSession({steps:[{type:'frequency'},silence]}));
});
test('An offline adaptive session uses the local queue action with and without a configured key',async()=>{
 const engine=source.match(/<script id="r340-adaptive-engine">([\s\S]*?)<\/script>/)[1];
 for(const hasKey of [true,false]){
  const before=[{type:'silence',ms:60000},{type:'frequency',c:180,b:10,ms:120000,mode:'bin'}];
  let items=before, settings=0, posts=0;
  const c=vm.createContext({
   navigator:{onLine:false},document:{readyState:'loading',addEventListener(){},getElementById:()=>null},
   window:{GlobalQueue:{getState:()=>({items,index:0,title:'Synthetic'}),replaceRemaining:next=>{items=[items[0],...next];return true}},
    SukunAIRouter:{hasSelectedKey:()=>hasKey,openSettings:()=>settings++,complete:async()=>{posts++;throw Error('Offline')}}}
  });
  vm.runInContext(engine,c);assert.equal(await c.window.SukunAdaptiveSession.adaptText('Daha sakin'),true);
  assert.equal(settings,0);assert.equal(posts,0);assert.equal(items[0],before[0]);assert.equal(items[1].b,7.8);
 }
});
test('Online adaptation sends user feedback and bounded step settings without personal labels or identifiers',async()=>{
 const engine=source.match(/<script id="r340-adaptive-engine">([\s\S]*?)<\/script>/)[1];
 const feedback='Kalan bölümü koşullarıma göre uyarla.';
 const items=[
  {type:'silence',ms:60000},
  {type:'frequency',b:7.8,ms:120000,label:'PRIVATE_FREQUENCY'},
  {type:'ambience',ids:['PRIVATE_AUDIO_ID'],label:'PRIVATE_AUDIO_NAME'},
  {type:'zikir',cat:'terkip',idx:3,label:'PRIVATE_TERKIP_NAME',reps:33},
  {type:'zikir',cat:'berhet',idx:0,label:'PRIVATE_VAULT',reps:99},
  {type:'PRIVATE_UNKNOWN_TYPE',label:'PRIVATE_TEXT'},
  {type:'breath',breathId:'PRIVATE_BREATH',ms:'PRIVATE_DURATION'},
  {type:'frequency',b:9999,ms:99999999}
 ];
 for(const unlocked of [false,true]){
  let request;
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){},getElementById:()=>null},navigator:{onLine:true},
   window:{GlobalQueue:{getState:()=>({items,index:0})},SukunSecretPolicy:{unlocked:()=>unlocked,containsSecretText:text=>text==='PRIVATE_VAULT'},
    SukunAIRouter:{hasSelectedKey:()=>true,complete:async value=>{request=value;return {text:'{"action":"keep"}'}}}}});
  vm.runInContext(engine,c);
  assert.equal(await c.window.SukunAdaptiveSession.adaptText(feedback),true);
  assert.ok(request.user.includes(feedback));
  assert.doesNotMatch(request.user,/PRIVATE_|berhet/);
  const summary=request.user.split('Kalan seans:\n')[1].split('\nJSON:')[0].split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(summary,[{type:'frequency',duration_min:2,beat_hz:7.8},{type:'ambience'},{type:'zikir',reps:33},{type:'breath'},{type:'frequency'}]);
 }
});
test('Keep, unknown and ambiguous feedback preserves the exact session; action labels match in TR/EN',async()=>{
 const engine=source.match(/<script id="r340-adaptive-engine">([\s\S]*?)<\/script>/)[1];
 const queue=[{type:'silence',ms:5000},{type:'frequency',c:180,b:10,ms:10000,mode:'bin'}];
 const w={writes:0,posts:0,settings:0};
 const c=vm.createContext({document:{readyState:'loading',addEventListener(){},getElementById:()=>null},navigator:{onLine:false},
  window:{GlobalQueue:{getState:()=>({items:queue,index:0}),replaceRemaining:()=>{w.writes++;return true}},
   SukunAIRouter:{hasSelectedKey:()=>true,openSettings:()=>w.settings++,complete:async()=>{w.posts++;return {text:'{"action":"keep","duration_scale":0.6}'}}}}});
 vm.runInContext(engine,c);const api=c.window.SukunAdaptiveSession;
 for(const query of ['Aynen kalsın','HİÇBİR ŞEYİ DEĞİŞTİRME','No change','Do not change anything']){
  assert.equal(await api.adaptText(query),true,query);
 }
 for(const query of ['Merhaba','Yoğun değil','Uykum gelmiyor','Daha sakin istemiyorum','I am not sleepy','too intense and scattered']){
  assert.equal(await api.adaptText(query),false,query);
 }
 assert.equal(w.writes,0);assert.equal(w.posts,0);assert.equal(w.settings,0);assert.equal(api.lastAction,null);
 for(const [query,kind] of [['Too intense','intense'],['ÇOK YOĞUN','intense'],['UyKuM GeLiYoR','sleepy'],['I feel scattered','scattered'],['Daha sakin','calmer']]){
  assert.equal(await api.adaptText(query),true);
  assert.equal(api.lastAction.kind,kind,query);
 }
 c.navigator.onLine=true;
 await api.adaptText('Aynen kalsın');assert.equal(w.posts,0);
 await api.adaptText('Synthetic provider test');
 assert.equal(w.posts,1);assert.equal(w.writes,5);
 assert.deepEqual(JSON.parse(JSON.stringify(api.validateAI({action:'keep',duration_scale:0.6,beat_scale:1.25},queue).out)),queue);
});
test('All classic inline JavaScript bodies compile',()=>{let n=0;const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;for(const m of source.matchAll(re)){if(/\bsrc\s*=/.test(m[1])||(/type\s*=\s*["']([^"']+)["']/i.test(m[1])&&!/type\s*=\s*["'](?:text|application)\/javascript["']/i.test(m[1])))continue;if(!m[2].trim())continue;new vm.Script(m[2],{filename:'inline-'+(++n)+'.js'});}assert(n>100);console.log('  Compiled '+n+' inline script bodies');});
(async()=>{let pass=0;for(const[name,fn]of tests){try{await fn();pass++;console.log('PASS '+name)}catch(e){console.error('FAIL '+name,e);process.exitCode=1;}}console.log(JSON.stringify({passed:pass,total:tests.length,actualProviderCalls:0,credentials:'synthetic only',file}));})();
