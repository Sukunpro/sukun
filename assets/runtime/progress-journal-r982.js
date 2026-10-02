/* r982: a bounded, versioned atomic progress record. This is not an audio clock.
 * Confirmed counters are captured after synchronous transactions; recovery is
 * always paused. Checksums detect accidental corruption, not malicious edits.
 */
(() => {
  'use strict';
  if(window.SukunProgressJournal?.version==='r982')return;
  const KEY='sukun.progress.journal.v1',MAX=192*1024,MAX_COUNT=1e12;
  const keys=['sukun.total','sukun.dayZk','sukun.esmaCount','sukun.session.r470','sukun.berhet.seyir.state','sukun.esma99.seyir.state','sukun.session.player.v2','sukun.resume.policy.v1','sukun.lifecycle.checkpoint'];
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const safe=(fn,d=null)=>{try{return fn()??d}catch(_){return d}};
  const integer=(x,max=MAX_COUNT)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
  const num=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
  const text=(x,n)=>typeof x==='string'&&x.length<=n&&!/[\u0000-\u001f\u007f]/.test(x);
  const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619)}return(n>>>0).toString(16).padStart(8,'0')};
  const clone=x=>JSON.parse(JSON.stringify(x));
  let adapter=null,applying=false,queued=false,sequence=0,last=null,lastRaw=null,lastNotice='' ,writes=0,error='',diverged=false,invalid=false,notice=null,smartBaseline='',smartDraft=false;
  function map(v,pattern,limit){
    if(!obj(v)||Object.keys(v).length>limit)return null;
    const out={};for(const [k,n]of Object.entries(v)){if(!pattern.test(k)||!integer(n))return null;out[k]=n}return out;
  }
  function direct(v){
    if(!obj(v)||!text(v.cat,40)||!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v.cat)||!integer(v.idx,1999)||!integer(v.count)||!integer(v.devir)||!integer(v.target,99999)||!integer(v.total)||!['','nida','tev'].includes(v.form||'')||!/^(fixed|manual|ebced)$/.test(v.targetMode)||typeof v.auto!=='boolean')return null;
    return {cat:v.cat,idx:v.idx,form:v.form||'',count:v.count,devir:v.devir,target:v.target,targetMode:v.targetMode,total:v.total,auto:v.auto};
  }
  function journey(v,max){
    if(v===null)return null;
    if(!obj(v)||!integer(v.i,max)||!integer(v.rep)||!integer(v.totalDone)||!text(v.mode,16)||! /^(?:[1-9]\d{0,4}|ebced|custom)$/.test(v.mode)||!integer(v.custom,99999)||!num(v.gap,0,30000)||typeof v.active!=='boolean')throw Error('journey-invalid');
    return {i:v.i,rep:v.rep,totalDone:v.totalDone,mode:v.mode,custom:v.custom,gap:v.gap,active:v.active};
  }
  function step(v){
    if(!obj(v)||!['zikir','silence','frequency'].includes(v.type))return null;
    const o={type:v.type};
    if(v.type==='zikir'){
      if(!text(v.cat,40)||!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v.cat)||!integer(v.idx,1999)||!integer(v.reps,99999)||v.reps<1||!num(v.gap,0,30000))return null;
      Object.assign(o,{cat:v.cat,idx:v.idx,reps:v.reps,gap:v.gap});
      if(v._r472SourceMode!=null){if(!['auto','recording','tts-default','tts-m','tts-f'].includes(v._r472SourceMode))return null;o._r472SourceMode=v._r472SourceMode;}
      o.repeatMode=v.repeatMode||'fixed';if(!['fixed','duration','manual'].includes(o.repeatMode))return null;
      o.repeatForMs=v.repeatForMs??60000;if(!num(o.repeatForMs,5000,6*3600000))return null;
      // Labels are plain text; source annotations, URLs, TTS and audio are not saved.
      if(v.label!=null){if(!text(v.label,200))return null;o.label=v.label;}
    }else{
      if(!num(v.ms,200,24*3600000))return null;o.ms=v.ms;
      if(v.type==='frequency'){
        if(!num(v.c,1,20000)||!num(v.b,0,2000)||!['bin','iso','mono','mix','binaural','monaural','isochronic'].includes(v.mode)||typeof(v.stop??true)!=='boolean')return null;
        Object.assign(o,{c:v.c,b:v.b,mode:v.mode,stop:v.stop??true});
      }
    }
    o.vol=v.vol??1;o.advance=v.advance||'auto';
    if(!num(o.vol,.2,1)||!['auto','wait'].includes(o.advance))return null;
    return o;
  }
  function smart(v){
    if(!obj(v)||!Array.isArray(v.queue)||v.queue.length>128||!integer(v.i,128)||v.i>v.queue.length||!text(v.name,200)||typeof v.active!=='boolean'||typeof v.unfinished!=='boolean'||!integer(v.completedReps,99999))return null;
    if(v.unfinished&&(!v.queue.length||v.i>=v.queue.length))return null;
    const queue=v.queue.map(step);if(queue.some(x=>!x))return null;
    const at=queue[v.i];if(v.completedReps&&(!at||at.type!=='zikir'||at.repeatMode!=='fixed'||v.completedReps>at.reps))return null;
    return {queue,i:v.i,name:v.name,active:v.active,unfinished:v.unfinished,completedReps:v.completedReps};
  }
  function resume(v){
    if(!obj(v)||Object.keys(v).length>16)return null;
    const out={};for(const[k,r]of Object.entries(v)){
      if(!/^[a-zA-Z0-9_-]{1,40}$/.test(k)||!obj(r)||!['new','continue','completed'].includes(r.status)||!integer(r.updatedAt,Date.now()+60000)||!text(r.reason||'',80))return null;
      const meta={};for(const key of ['cat','idx','count','devir','stepIndex','stepTotal','index','surface','action','name']){
        const x=r.meta?.[key];if(x===undefined)continue;if(typeof x==='number'&&integer(x))meta[key]=x;else if(text(x,200))meta[key]=x;else return null;
      }
      out[k]={status:r.status,updatedAt:r.updatedAt,reason:r.reason||'',meta};
    }return out;
  }
  function normalize(x){
    try{
      if(!obj(x)||!integer(x.total)||!obj(x.direct)||x.direct.total!==x.total)return null;
      const z=direct(x.direct),days=map(x.days,/^\d{4}-\d{2}-\d{2}$/,3000),names=map(x.names,/^[^\u0000-\u001f\u007f]{1,120}$/,2000),s=smart(x.smart),r=resume(x.resume);
      if(!z||!days||!names||!s||!r||!obj(x.canonical)||!text(x.canonical.context,40)||!['IDLE','PAUSED','COMPLETED','PLAYING','PREPARING','ERROR','INTERRUPTED'].includes(x.canonical.phase)||!['single','28','99'].includes(x.canonical.journeyKind))return null;
      return {total:x.total,days,names,direct:z,journey28:journey(x.journey28,28),journey99:journey(x.journey99,99),smart:s,resume:r,canonical:{context:x.canonical.context,phase:x.canonical.phase,journeyKind:x.canonical.journeyKind}};
    }catch(_){return null}
  }
  function mirrors(){const out={};for(const k of keys){const raw=localStorage.getItem(k);if(raw!=null&&raw.length>4*1024*1024)throw Error('mirror-too-large');out[k]=raw===null?null:hash(raw)}return out;}
  function decode(raw,checkMirrors=true){
    if(typeof raw!=='string'||raw.length>MAX)return null;
    try{
      const record=JSON.parse(raw),body=record?.body;
      if(!obj(body)||body.v!==1||!integer(body.rev)||body.rev<1||!integer(body.at,Number.MAX_SAFE_INTEGER)||body.at>Date.now()+60000||!obj(body.mirrors)||Object.keys(body.mirrors).length!==keys.length||typeof record.sum!=='string'||record.sum!==hash(JSON.stringify(body)))return null;
      for(const k of keys)if(!own(body.mirrors,k)||!(body.mirrors[k]===null||/^[0-9a-f]{8}$/.test(body.mirrors[k])))return null;
      const progress=normalize(body.progress);if(!progress)return null;
      if(checkMirrors){const m=mirrors();diverged=keys.some(k=>m[k]!==body.mirrors[k]);}
      return {body:{v:1,rev:body.rev,at:body.at,mirrors:body.mirrors,progress},sum:record.sum};
    }catch(_){return null}
  }
  function read(force=true){
    const raw=safe(()=>localStorage.getItem(KEY));if(!force&&raw===lastRaw)return last;lastRaw=raw;diverged=false;invalid=false;
    if(!raw){last=null;return null}const record=decode(raw);if(!record){error='journal-invalid';invalid=true;last=null;return null}last=record;return record;
  }
  function legacy(key,fallback){
    // Owned runtime state wins while a synchronous count transaction settles.
    if(!keys.includes(key)||applying||window.SukunTabOwner?.owns?.())return undefined;
    const r=read(false);if(invalid)return fallback;if(!r||diverged)return undefined;const p=r.body.progress;
    if(key==='sukun.total')return p.total;
    if(key==='sukun.dayZk')return clone(p.days);
    if(key==='sukun.esmaCount')return clone(p.names);
    if(key==='sukun.session.r470')return {version:'r470',_journal:true,updatedAt:r.body.at,z:clone(p.direct),tef:false};
    if(key==='sukun.resume.policy.v1')return clone(p.resume);
    if(key==='sukun.session.player.v2')return {...clone(p.smart),playing:false,paused:p.smart.unfinished,_journal:true,t:r.body.at};
    if(key==='sukun.berhet.seyir.state'||key==='sukun.esma99.seyir.state'){const v=p[key.includes('berhet')?'journey28':'journey99'];return v?{...clone(v),t:r.body.at}:fallback;}
    return undefined;
  }
  function stepIdentity(v){const x=step(v);return x?JSON.stringify({type:x.type,cat:x.cat||'',idx:x.idx??null,reps:x.reps??null,repeatMode:x.repeatMode||'',source:x._r472SourceMode||'auto',ms:x.ms??null,c:x.c??null,b:x.b??null,mode:x.mode||''}):'';}
  function smartSig(v){const s=smart(v);return s?JSON.stringify({queue:s.queue,name:s.name}):'';}
  function baseline(v){smartBaseline=smartSig(v);smartDraft=false;}
  function noteSmart(v){if(applying||window.SukunTabOwner?.owns?.())return;const sig=smartSig(v);if(smartBaseline&&sig!==smartBaseline)smartDraft=true;}
  function show(kind){
    lastNotice=kind;if(!document.body)return;
    if(!notice){notice=document.createElement('div');notice.id='r982JournalNotice';notice.dataset.i18nOwned='r982';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.style.cssText='position:fixed;z-index:9998;left:50%;bottom:calc(102px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(88vw,550px);padding:14px;border:1px solid #ad956a;border-radius:16px;background:#071a22;color:#f7eed7;line-height:1.45';document.body.appendChild(notice)}
    const en=window.I18N?.lang==='en';notice.replaceChildren();notice.hidden=false;
    const t=document.createElement('span');t.textContent=kind==='recovery'?(en?'Progress could not be recovered. The saved record was kept. Export a backup and try again.':'İlerleme kurtarılamadı. Kayıtlı ilerleme korundu. Yedek indirip tekrar dene.'):kind==='diverged'&&invalid?(en?'The saved progress could not be verified. Use the checked local progress to recover with playback stopped.':'Kayıtlı ilerleme doğrulanamadı. Kontrol edilen yerel ilerlemeyi kullanarak zikir durmuş halde kurtarabilirsin.'):kind==='diverged'?(en?'Local progress changed in another version. Close the other SÜKÛN tabs, then use the updated local progress. Playback stays stopped.':'İlerleme başka bir sürümde değişmiş. Diğer SÜKÛN sekmelerini kapat, sonra güncel yerel ilerlemeyi kullan. Zikir kendiliğinden başlamaz.'):(en?'Progress could not be saved. Keep this tab open and export a backup before closing.':'İlerleme kaydedilemedi. Bu sekmeyi açık tut ve kapatmadan önce yedek indir.');notice.appendChild(t);
    if(kind==='diverged'){const b=document.createElement('button');b.type='button';b.textContent=en?'Use updated local progress':'Güncel yerel ilerlemeyi kullan';b.style.cssText='display:block;padding:8px;margin-top:8px;background:#183a43;color:inherit;border:1px solid #ad956a;border-radius:9px';b.onclick=()=>reconcile();notice.appendChild(b);if(last&&!invalid){const saved=document.createElement('button');saved.type='button';saved.textContent=en?'Use last verified progress':'Son doğrulanan ilerlemeyi kullan';saved.style.cssText=b.style.cssText;saved.onclick=()=>reconcile(true);notice.appendChild(saved)}}
    const close=document.createElement('button');close.type='button';close.textContent=en?'Close':'Kapat';close.onclick=()=>{notice.hidden=true};notice.appendChild(close);
  }
  function commit(reason='progress',lease=null,override=null){
    queued=false;sequence++;
    if(!adapter||applying||(!lease&&!window.SukunTabOwner?.owns?.()))return false;
    if(lease){lease.assertCurrent();if(!window.SukunTabOwner?.snapshot?.()?.maintenance)return false;}
    try{
      const progress=normalize(override||adapter.capture());if(!progress||adapter.validate?.(progress)===false)throw Error('snapshot-invalid');
      const oldRaw=safe(()=>localStorage.getItem(KEY)),old=oldRaw?decode(oldRaw,false):null;if((oldRaw&&!old||invalid)&&!lease){error='journal-invalid';show('diverged');return false;}
      const at=Date.now(),projected=adapter.projectMirrors?.(progress,at)||{},mirrorMap=mirrors();
      for(const[k,v]of Object.entries(projected)){if(!keys.includes(k)||typeof v!=='string'||v.length>4*1024*1024)throw Error('mirror-invalid');mirrorMap[k]=hash(v);}
      const body={v:1,rev:(old?.body.rev||0)+1,at,mirrors:mirrorMap,progress};
      const record={body,sum:hash(JSON.stringify(body))},raw=JSON.stringify(record);if(raw.length>MAX)throw Error('journal-too-large');
      if(lease)lease.assertCurrent();else if(!window.SukunTabOwner?.owns?.())return false;
      for(const[k,v]of Object.entries(projected))localStorage.setItem(k,v);
      localStorage.setItem(KEY,raw);last=record;lastRaw=raw;writes++;error='';diverged=false;
      safe(()=>window.dispatchEvent(new CustomEvent('sukun:progressjournal',{detail:{version:'r982',revision:body.rev,reason}})));return true;
    }catch(e){error=String(e?.message||e?.name||'storage-error').slice(0,100);show('storage');return false;}
  }
  function schedule(reason='progress'){
    if(!adapter||applying||queued||!window.SukunTabOwner?.owns?.())return false;
    queued=true;const token=sequence,owner=window.SukunTabOwner.snapshot();
    queueMicrotask(()=>{if(!queued||sequence!==token)return;queued=false;const n=window.SukunTabOwner.snapshot();if(!n.owned||n.epoch!==owner.epoch||n.intent!==owner.intent)return;commit(reason)});return true;
  }
  function notify(key){if(keys.includes(key))schedule('legacy:'+key);}
  function bind(a){adapter=a;baseline(safe(()=>a.capture().smart));read();return true;}
  function rebase(kind='single'){
    if(!window.SukunTabOwner?.owns?.()||window.SukunTabOwner.snapshot().maintenance)return true;
    if(!adapter){if(safe(()=>localStorage.getItem(KEY))){error='journal-not-ready';return false}return true;}
    const r=read();if(diverged||invalid){error='legacy-diverged';show('diverged');return false;}
    if(!r)return true;const p=r.body.progress;if(adapter.validate?.(p)===false){error='catalog-invalid';return false;}
    applying=true;try{const ok=adapter.apply(clone(p),{kind,smartDraft});if(ok===false)throw Error('hydrate-invalid');return true}catch(e){error=String(e?.message||'hydrate-failed');return false}finally{applying=false;}
  }
  function invalidate(lease){
    lease?.assertCurrent?.();if(!lease||!window.SukunTabOwner?.snapshot?.()?.maintenance)throw Error('maintenance-required');
    sequence++;queued=false;localStorage.removeItem(KEY);last=null;lastRaw=null;diverged=false;invalid=false;error='';smartDraft=false;return true;
  }
  function finalizeImport(lease){
    lease?.assertCurrent?.();if(!lease||!window.SukunTabOwner?.snapshot?.()?.maintenance)throw Error('maintenance-required');
    sequence++;queued=false;const raw=localStorage.getItem(KEY),deleted=[];
    if(raw){
      const record=decode(raw,false);if(!record)throw Error('import-journal-invalid');
      const body={...record.body,rev:record.body.rev+1,at:Date.now(),mirrors:mirrors()},encoded=JSON.stringify({body,sum:hash(JSON.stringify(body))});
      if(encoded.length>MAX)throw Error('journal-too-large');lease.assertCurrent();localStorage.setItem(KEY,encoded);
    }else{
      for(const k of ['sukun.session.r470','sukun.session.player.v2','sukun.lifecycle.checkpoint']){lease.assertCurrent();localStorage.removeItem(k);deleted.push(k);}
    }
    lastRaw=null;read();return {deleted};
  }
  async function reconcile(verified=false){
    try{return await window.SukunTabOwner?.maintenance?.('journal-reconcile',lease=>{
      const oldRecord=localStorage.getItem(KEY),oldMirrors=new Map(keys.map(k=>[k,localStorage.getItem(k)]));
      const before=normalize(adapter?.capture?.()),record=oldRecord?decode(oldRecord,false):null,p=normalize(verified?record?.body.progress:adapter?.legacyCapture?.());if(!p||adapter?.validate?.(p)===false)throw Error('legacy-invalid');
      sequence++;queued=false;applying=true;
      try{
        if(adapter.apply(clone(p),{kind:'restore',smartDraft:false})===false)throw Error('hydrate-invalid');
      }finally{applying=false}
      const ok=commit(verified?'explicit-verified-recovery':'explicit-legacy-recovery',lease,p);
      if(!ok){
        lease.assertCurrent();for(const[k,v]of oldMirrors){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}
        if(localStorage.getItem(KEY)!==oldRecord){if(oldRecord===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,oldRecord);}
        if(before){applying=true;try{adapter.apply(clone(before),{kind:'restore',smartDraft:false})}finally{applying=false}}
        lastRaw=null;read();show('recovery');return false;
      }
      if(notice)notice.hidden=true;return true;
    })}catch(e){error=String(e?.message||e?.name||'recovery-failed').slice(0,100);show('recovery');return false;}
  }
  ['sukun:currentzikirchange','sukun:currentflowchange','sukun:sessionchange','sukun:resumestate','sukun:zikirtransaction'].forEach(ev=>window.addEventListener(ev,()=>schedule(ev),{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)commit('hidden')},{passive:true});
  document.addEventListener('freeze',()=>commit('freeze'),{passive:true});
  window.addEventListener('pagehide',()=>commit('pagehide'),{passive:true});
  window.SukunProgressJournal=Object.freeze({version:'r982',key:KEY,isApplying:()=>applying,stepIdentity,bind,legacy,notify,commit,schedule,rebase,baseline,noteSmart,markSmartDraft:()=>{if(!applying&&!window.SukunTabOwner?.owns?.())smartDraft=true},invalidate,finalizeImport,reconcile,
    validate:raw=>!!decode(raw,false),snapshot:()=>({version:'r982',revision:last?.body.rev||0,writes,error,diverged,invalid,queued,smartDraft,atomicRecord:true,autoplay:false}),read:()=>{const r=read();return r&&!diverged?clone(r.body.progress):null}});
window.addEventListener('storage',e=>{if(e.key===KEY||keys.includes(e.key)){lastRaw=null;read();if(invalid||diverged)show('diverged')}},{passive:true});
  window.addEventListener('sukun:languagechange',()=>{if(lastNotice&&notice&&!notice.hidden)show(lastNotice)},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{read();if(invalid||diverged)show('diverged')},{once:true});
})();
