/* r981: one explicit dhikr writer/voice tab per origin. No audio or count clock.
 * A Web Lock has no heartbeat deadline: hidden/frozen audible tabs retain it.
 * The IndexedDB fallback atomically claims a non-expiring record; an unclean
 * exit requires the user's explicit closed-other-tabs recovery, never autoplay.
 */
(() => {
  'use strict';
  if (window.SukunTabOwner?.version === 'r981') return;
  const LOCK='sukun.dhikr.owner.r981', MIRROR='sukun.tab.owner.r981', DB='sukun-tab-owner-r981';
  const id=globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const protectedKeys=new Set(['sukun.total','sukun.dayZk','sukun.esmaCount','sukun.session.r470',
    'sukun.berhet.seyir.state','sukun.esma99.seyir.state','sukun.resume.policy.v1','sukun.lifecycle.checkpoint','sukun.session.player.v2']);
  const safe=(fn,d=null)=>{try{return fn()??d;}catch(_){return d;}};
  let held=false, method=navigator.locks?.request?'web-locks':'indexeddb', releaseLock=null, acquirePromise=null;
  let generation=0, epoch=0, claimGeneration=0, acquireGeneration=-1, retiring=false, revoking=false, terminal=false, drainTimer=0, binding={}, remote=null, reason='idle';
  let grantedBefore='',grantedAfter='';
  let dbPromise=null, idbLease=false, maintenanceActive=false, channel=null, pendingAction=null, notice='', writesBlocked=0, wrappedSession=null;
  const readMirror=()=>safe(()=>JSON.parse(localStorage.getItem(MIRROR)||'null'));
  const owns=()=>held&&!maintenanceActive;
  const key=()=>safe(()=>binding.identity?.(),'');
  function snapshot(){return Object.freeze({version:'r981',method,protection:method==='web-locks'?'web-lock-strict':'idb-confirmed-recovery',owned:owns(),maintenance:maintenanceActive,epoch,intent:generation,pending:!!acquirePromise,
    blocked:!held&&!!remote,reason,retiring,writesBlocked,recoveryRequired:!held&&!!remote&&(remote.method==='indexeddb'||method==='indexeddb')});}
  function emit(){safe(()=>window.dispatchEvent(new CustomEvent('sukun:tabownerchange',{detail:snapshot()})));}
  function announce(type){
    // Only anonymous ownership metadata; never names, counts, text or recordings.
    const data={v:1,type,id,method};safe(()=>channel?.postMessage(data));
    if(type==='held')safe(()=>localStorage.setItem(MIRROR,JSON.stringify({v:1,id,method})));
    if(type==='released'&&readMirror()?.id===id)safe(()=>localStorage.removeItem(MIRROR));
  }
  const en=()=>window.I18N?.lang==='en'||document.documentElement?.lang==='en';
  function textFor(kind='blocked'){
    if(kind==='preparing')return en()?'Checking the active SÜKÛN tab…':'Etkin SÜKÛN sekmesi kontrol ediliyor…';
    if(kind==='unavailable')return en()?'This browser could not verify single-tab access. Try opening SÜKÛN in your browser.':'Bu tarayıcı tek sekme erişimini doğrulayamadı. SÜKÛN’ü tarayıcında açmayı dene.';
    if(kind==='finish-first')return en()?'Finish the active or paused dhikr with Finish before changing stored data.':'Saklanan veriyi değiştirmeden önce etkin veya duraklatılmış zikri Bitir ile tamamla.';
    if(kind==='maintenance')return en()?'Stored data is being updated. Wait for it to finish.':'Saklanan veri güncelleniyor. İşlem bitene kadar bekle.';
    return en()?'Dhikr is active in another SÜKÛN tab. Finish it there or close that tab, then press Start here. This keeps the voice and counter together.':'Zikir başka bir SÜKÛN sekmesinde etkin. Orada Bitir’e dokun veya o sekmeyi kapat; sonra burada Başlat’a dokun. Böylece ses ve sayaç çakışmaz.';
  }
  function render(){
    const b=document.body;if(!b)return;
    let p=document.getElementById('r981TabOwnerNotice');
    if(!p&&notice){p=document.createElement('div');p.id='r981TabOwnerNotice';p.setAttribute('role','status');p.setAttribute('aria-live','polite');
      p.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom));z-index:9999;width:min(88vw,550px);padding:14px;border:1px solid #ad956a;border-radius:16px;background:#071a22;color:#f7eed7;box-shadow:0 6px 22px #0009;line-height:1.45;font-size:14px';b.appendChild(p);}
    if(!p)return;p.hidden=!notice;if(!notice)return;
    p.replaceChildren();const t=document.createElement('span');t.textContent=notice;p.appendChild(t);
    if(remote?.method==='indexeddb'||method==='indexeddb'&&remote){
      const btn=document.createElement('button');btn.type='button';btn.textContent=en()?'I closed the other tabs · Clear lock':'Diğer sekmeleri kapattım · Kilidi temizle';
      btn.style.cssText='display:block;margin-top:10px;padding:8px 12px;border-radius:9px;border:1px solid #ad956a;background:#183a43;color:#f7eed7';
      btn.onclick=()=>recoverClosedTabs();p.appendChild(btn);
    }
    const close=document.createElement('button');close.type='button';close.textContent=en()?'Close':'Kapat';close.setAttribute('aria-label',en()?'Close message':'Mesajı kapat');
    close.style.cssText='margin-top:10px;margin-left:8px;background:transparent;color:inherit;border:0;text-decoration:underline';close.onclick=()=>{notice='';render();};p.appendChild(close);
  }
  function warn(kind='blocked'){reason=kind;notice=textFor(kind);render();emit();return false;}
  function bind(value){binding={...binding,...value};return true;}
  function openDB(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(Error('idb-unavailable'));return;}
      const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('owner'))r.result.createObjectStore('owner');};
      r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};r.onerror=()=>reject(r.error||Error('idb-error'));r.onblocked=()=>reject(Error('idb-blocked'));
    }).catch(e=>{dbPromise=null;throw e;});return dbPromise;
  }
  async function idbClaim(expected,remove=false){
    const db=await openDB();return await new Promise((resolve,reject)=>{
      const tx=db.transaction('owner','readwrite'),store=tx.objectStore('owner');let result=false;
      const r=store.get('active');r.onsuccess=()=>{
        const existing=r.result;
        if(remove){if(existing?.id===expected){store.delete('active');result=true;}return;}
        // An exclusive Web Lock proves a prior Web Lock callback has ended.
        // It cannot prove that a fallback owner is silent.
        if(existing&&existing.id!==id&&!(method==='web-locks'&&existing.method==='web-locks')){remote=existing;return;}
        store.put({v:1,id,method},'active');result=true;
      };
      tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('claim-error'));tx.onabort=()=>reject(tx.error||Error('claim-aborted'));
    });
  }
  function grant(token){
    if(token!==generation)return false;
    held=true;epoch++;claimGeneration=token;remote=null;reason='owned';notice='';retiring=false;terminal=false;clearTimeout(drainTimer);drainTimer=0;
    grantedBefore=key();safe(()=>binding.rebase?.());grantedAfter=key();announce('held');render();emit();return true;
  }
  function acquire(){
    if(held)return Promise.resolve(true);
    if(revoking){warn('preparing');return Promise.resolve(false);}
    if(acquirePromise)return acquireGeneration===generation?acquirePromise:acquirePromise.then(()=>acquire());
    acquireGeneration=generation;
    const token=generation;reason='preparing';notice=textFor('preparing');render();emit();
    const work=method==='web-locks'?new Promise(resolve=>{
      let settled=false;const done=v=>{if(!settled){settled=true;resolve(v);}};
      try{
        const request=navigator.locks.request(LOCK,{mode:'exclusive',ifAvailable:true},async lock=>{
          if(!lock){remote=readMirror()||{id:'unknown',method:'web-locks'};warn();done(false);return;}
          // A shared atomic record also serializes a context lacking Web Locks.
          // The mirror is messaging only, never the winner of a claim race.
          if(window.indexedDB){
            try{if(!await idbClaim()){warn();done(false);return;}idbLease=true;}
            catch(_){warn('unavailable');done(false);return;}
          }else{warn('unavailable');done(false);return;}
          if(token!==generation){if(idbLease){await idbClaim(id,true);idbLease=false;}done(false);return;}
          const holding=new Promise(release=>{releaseLock=release;});grant(token);done(true);return holding;
        });
        Promise.resolve(request).catch(()=>{if(held&&claimGeneration===token)revoke('web-lock-error');warn('unavailable');done(false);});
      }catch(_){warn('unavailable');done(false);}
    }):(async()=>{
      const mirror=readMirror();if(mirror?.method==='web-locks'&&mirror.id!==id){remote=mirror;warn();return false;}
      try{
        const ok=await idbClaim();if(!ok){warn();return false;}
        if(token!==generation){await idbClaim(id,true);return false;}
        idbLease=true;return grant(token);
      }catch(_){warn('unavailable');return false;}
    })();
    acquirePromise=Promise.resolve(work).finally(()=>{acquirePromise=null;emit();});return acquirePromise;
  }
  function prime(){safe(()=>binding.prime?.());}
  async function run(kind,action,opt={}){
    if(typeof action!=='function')return false;
    if(maintenanceActive)return warn('maintenance');
    if(revoking)return warn('preparing');
    retiring=false;terminal=false;clearTimeout(drainTimer);drainTimer=0;
    if(held)return action();prime();const token=generation,selected=key();
    if(!await acquire()||token!==generation||selected!==grantedBefore||key()!==grantedAfter||opt.keepSelection&&selected!==key()||typeof opt.isCurrent==='function'&&!opt.isCurrent()){
      if(held&&claimGeneration===token)retire('cancelled-acquire');return false;
    }
    const lease=epoch;let value,failed=true;
    try{value=await action();failed=false;return value;}finally{
      if(held&&!maintenanceActive&&epoch===lease&&(opt.releaseAfter||failed||value===false||value===undefined||value?.accepted===false))retire(kind+'-settled');
    }
  }
  function defer(kind,action,opt={}){
    if(maintenanceActive)return warn('maintenance');
    if(held)return action();if(pendingAction)return false;
    const token=generation;pendingAction={token,kind};
    Promise.resolve(run(kind,action,opt)).catch(()=>warn('unavailable')).finally(()=>{
      if(pendingAction?.token===token)pendingAction=null;
      if(kind==='manual'&&!maintenanceActive&&claimGeneration===token)retire('manual-drained');
    });return false;
  }
  function cancelPending(why='cancelled'){generation++;pendingAction=null;reason=why;notice='';render();emit();return true;}
  function canPersist(k){if(!protectedKeys.has(String(k)))return true;if(held&&!maintenanceActive)return true;writesBlocked++;return false;}
  function allowed(){if(owns())return true;warn(maintenanceActive?'maintenance':'blocked');return false;}
  async function release(why='released',opt={}){
    if(!held&&!revoking)return false;
    if(held&&!maintenanceActive&&!opt.skipFlush)safe(()=>binding.flush?.());held=false;epoch++;revoking=true;retiring=false;terminal=false;clearTimeout(drainTimer);drainTimer=0;reason=why;generation++;
    announce('released');const unlock=releaseLock;releaseLock=null;
    if(idbLease||method==='indexeddb')try{await idbClaim(id,true);}catch(_){}
    idbLease=false;revoking=false;if(unlock)unlock();
    emit();return true;
  }
  function checkDrain(){
    drainTimer=0;if(!retiring||(!held&&!revoking))return;
    // User pause keeps the writer reservation. Terminal Stop is the only
    // operation allowed to release a paused session's ownership.
    if(!terminal&&safe(()=>binding.paused?.(),false)){retiring=false;reason='paused-owned';emit();return;}
    // This retry only observes requested cleanup. It never expires a live
    // owner's lock, schedules a reading, or credits a repeat.
    if(safe(()=>binding.busy?.(),true)){drainTimer=setTimeout(checkDrain,180);return;}
    release('drained');
  }
  function retire(why='stop',isTerminal=false){
    if(maintenanceActive&&!revoking)return false;
    if(!held&&!revoking)return false;retiring=true;terminal=terminal||isTerminal;reason=why;
    if(!drainTimer)drainTimer=setTimeout(checkDrain,60);emit();return true;
  }
  function revoke(why='revoked'){
    if(!held||revoking)return false;
    // Fence every subsequent credit/write before calling asynchronous cleanup.
    held=false;epoch++;revoking=true;generation++;pendingAction=null;clearTimeout(drainTimer);drainTimer=0;
    // Keep the physical Web Lock until cleanup drains, while all progress
    // writes/late completions have already lost their authority.
    safe(()=>binding.stop?.(why));retire(why,true);notice=textFor();render();emit();
  }
  async function recoverClosedTabs(){
    if(held)return false;const old=remote||readMirror();if(!old?.id)return false;
    const message=en()?'Close every other SÜKÛN tab first. If another tab is still playing, clearing this lock may allow two voices. Clear the abandoned lock? Playback will stay stopped.':'Önce diğer tüm SÜKÛN sekmelerini kapat. Başka sekmede ses hâlâ çalıyorsa kilidi temizlemek iki ses açılmasına izin verebilir. Sahipsiz kilit temizlensin mi? Zikir kendiliğinden başlamaz.';
    if(!safe(()=>window.confirm(message),false))return false;
    cancelPending('explicit-recovery');
    try{if((old.method==='indexeddb'||method==='indexeddb')&&!await idbClaim(old.id,true))return warn();}catch(_){return warn('unavailable');}
    if(readMirror()?.id===old.id)safe(()=>localStorage.removeItem(MIRROR));
    safe(()=>channel?.postMessage({v:1,type:'revoked',id:old.id,method:old.method}));
    remote=null;reason='recovered-stopped';notice=en()?'Lock cleared. Press Start when ready.':'Kilit temizlendi. Hazır olduğunda Başlat’a dokun.';render();emit();return true;
  }
  function observe(data){
    if(data?.v!==1||typeof data.id!=='string'||!['web-locks','indexeddb'].includes(data.method))return;
    if(data.type==='revoked'&&data.id===id){revoke('explicit-recovery-in-another-tab');return;}
    if(data.id===id)return;
    if(data.type==='held'){remote={v:1,id:data.id,method:data.method};emit();}
    if(data.type==='released'&&remote?.id===data.id){remote=null;emit();}
  }
  safe(()=>{channel=new BroadcastChannel('sukun-tab-owner-r981');channel.onmessage=e=>observe(e.data);});
  window.addEventListener('storage',e=>{
    if(e.key!==MIRROR)return;const data=safe(()=>JSON.parse(e.newValue||'null'));
    if(data)observe({...data,type:'held'});else{
      const prior=safe(()=>JSON.parse(e.oldValue||'null'));
      if(method==='indexeddb'&&held&&prior?.id===id)revoke('fallback-claim-cleared');
      if(remote?.id===prior?.id)remote=null;emit();
    }
  });
  function wrapCommands(){
    const api=window.SukunSessionState;if(!api||api===wrappedSession||api.__r981Owner)return;
    const command=(action,opt={})=>{
      const a=String(action||'').toLowerCase();
      if(maintenanceActive&&a!=='stop')return Promise.resolve(Object.freeze({accepted:false,reason:'data-maintenance',snapshot:api.snapshot()}));
      if(['pause','stop','select','next','previous','restart'].includes(a))cancelPending('command:'+a);
      if(['start','play','resume','retry','adjust','restart'].includes(a)&&!held){
        return Promise.resolve(run(a,()=>api.command(action,opt),{releaseAfter:a==='adjust'||a==='restart'})).then(value=>value===false?Object.freeze({accepted:false,reason:'cross-tab-held',snapshot:api.snapshot()}):value);
      }
      const result=api.command(action,opt);
      if(a==='stop')Promise.resolve(result).finally(()=>retire('command-stop',true));
      return result;
    };
    wrappedSession=Object.freeze({...api,command,__r981Owner:true});window.SukunSessionState=wrappedSession;
    if(window.SessionState===api)window.SessionState=wrappedSession;
  }
  function wrapSources(){
    // Install around final resolver/arbiter wrappers after synchronous app
    // scripts finish, so the first explicit Listen claims before any source.
    for(const [api,name,optionIndex] of [[window.SukunVoiceResolver,'playItem',3],[window.SukunVoiceResolver,'playCurrentZikir',0],
      [window.AudioResolver,'play',3],[window.SukunTerkipVoice,'play',1],[window.SukunSourcePolicy,'play',0]]){
      const previous=api?.[name];if(typeof previous!=='function'||previous.__r981Owner)continue;
      const wrapped=async function(...args){
        if(maintenanceActive)return {ok:false,cancelled:true,source:'tab-held',reason:'data-maintenance'};
        const opt=args[optionIndex]||{},parent=typeof opt.isCurrent==='function'?opt.isCurrent:()=>true;
        const play=()=>{const lease=epoch;args[optionIndex]={...opt,isCurrent:()=>held&&lease===epoch&&parent()};return previous.apply(this,args);};
        const value=held?play():await run('listen',play,{isCurrent:parent,keepSelection:true,releaseAfter:true});
        return value===false?{ok:false,cancelled:true,source:'tab-held',reason:'cross-tab-held'}:value;
      };
      Object.assign(wrapped,previous);wrapped.__r981Owner=true;api[name]=wrapped;
    }
  }
  function wrapPlayer(){
    const player=window.R170?.Player,previous=player?.play;
    if(typeof previous!=='function'||previous.__r981Owner)return;
    const wrapped=function(...args){if(maintenanceActive)return false;return held?previous.apply(this,args):run('smart',()=>previous.apply(this,args));};
    Object.assign(wrapped,previous);wrapped.__r981Owner=true;player.play=wrapped;
  }
  async function maintenance(kind,action){
    if(typeof action!=='function'||maintenanceActive)return warn('maintenance');
    if(held&&(safe(()=>binding.busy?.(),true)||safe(()=>binding.paused?.(),false)))return warn('finish-first');
    cancelPending('data-maintenance');const requestToken=generation;maintenanceActive=true;retiring=false;terminal=false;clearTimeout(drainTimer);drainTimer=0;emit();
    let lease=-1;
    try{
      if(!held&&!await acquire())return false;
      lease=epoch;const token=generation;
      if(token!==requestToken)return false;
      // A merely restored paused suggestion in a previously unowned tab is
      // not a live audio reservation. Owned pauses were rejected above.
      if(safe(()=>binding.busy?.(),true))return warn('finish-first');
      const current=()=>held&&maintenanceActive&&epoch===lease&&generation===token;
      const assertCurrent=()=>{if(!current())throw Error('data-maintenance-cancelled');return true;};
      assertCurrent();reason='data-maintenance';emit();return await action(Object.freeze({current,assertCurrent}));
    }finally{
      // Imported/deleted progress is authoritative. Never flush the old local
      // counter/session over it when releasing this silent maintenance claim.
      if(held&&(lease<0||epoch===lease))await release('maintenance-finished',{skipFlush:true});
      maintenanceActive=false;emit();
    }
  }
  window.SukunTabOwner=Object.freeze({version:'r981',bind,owns,snapshot,acquire,run,defer,prime,allowed,
    canPersist,cancelPending,retire,maintenance,release:()=>{cancelPending('explicit-release');safe(()=>binding.finish?.());return retire('explicit-release',true);},recoverClosedTabs,warn});
  remote=readMirror();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{wrapCommands();wrapSources();wrapPlayer();render();},{once:true});else{wrapCommands();wrapSources();wrapPlayer();}
  ['sukun:sessionchange','sukun:playbackchange','sukun:audioaggregatechange','sukun:currentzikirchange','sukun:terkipvoicechange'].forEach(event=>window.addEventListener(event,()=>{wrapCommands();wrapSources();wrapPlayer();if(retiring&&!drainTimer)drainTimer=setTimeout(checkDrain,60);},{passive:true}));
  window.addEventListener('sukun:sessioncommand',e=>{if(['stop','pause','select','next','previous','restart'].includes(e.detail?.action))cancelPending('session:'+e.detail.action);},{passive:true});
  window.addEventListener('pagehide',e=>{
    cancelPending('pagehide');
    if(e.persisted)return; // BFCache/freeze is not evidence that native audio ended.
    if(!held)return;safe(()=>binding.stop?.('pagehide'));retire('pagehide-drained',true);
    // IndexedDB removal is best effort on a genuine close; abrupt OS termination
    // remains the explicit recovery case. Web Locks are released by the browser.
    if(!safe(()=>binding.busy?.(),true))release('pagehide');
  },{passive:true});
})();
