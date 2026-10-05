/* Runs the shipped ownership runtime in independent VM tabs against one origin.
 * Web Locks and IndexedDB readwrite transactions are modeled atomically; browser
 * freeze, audio, and OS termination are scenarios, not physical-device evidence.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.env.SUKUN_AUDIO_SOURCE||path.join(__dirname,'../../../../..'));
const runtime=fs.readFileSync(path.join(root,'assets/runtime/tab-owner-r981.js'),'utf8');
const MIRROR='sukun.tab.owner.r981';
const protectedKeys=['sukun.total','sukun.dayZk','sukun.esmaCount','sukun.session.r470',
  'sukun.berhet.seyir.state','sukun.esma99.seyir.state','sukun.resume.policy.v1','sukun.lifecycle.checkpoint','sukun.session.player.v2'];
const results=[];
async function test(name,fn){try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}}
function target(){
  const listeners=new Map();
  return {addEventListener(type,fn,opt={}){const list=listeners.get(type)||[];list.push({fn,once:!!opt.once});listeners.set(type,list);},
    dispatchEvent(event){for(const entry of [...(listeners.get(event.type)||[])]){entry.fn(event);if(entry.once)listeners.set(event.type,listeners.get(event.type).filter(x=>x!==entry));}return true;}};
}
function element(tag,document){
  return {tagName:tag.toUpperCase(),style:{},children:[],hidden:false,textContent:'',setAttribute(){},
    appendChild(child){this.children.push(child);if(child.id)document.nodes.set(child.id,child);return child;},replaceChildren(){this.children=[];}};
}
function origin(opt={}){
  const world={tabs:[],jobs:[],storage:new Map(),locks:new Map(),lockRequests:[],messages:[],clock:0,timers:new Map(),nextTimer:0,
    allowLocks:opt.allowLocks!==false,dbPaused:!!opt.dbPaused,dbRecord:null,dbTransactions:[],dbActive:null,dbHistory:[],dbMaxActive:0,dbCreated:false};
  world.schedule=fn=>world.jobs.push(fn);
  world.flush=async()=>{
    let idle=0;
    for(let n=0;n<1000;n++){
      const fn=world.jobs.shift();if(fn){idle=0;fn();}else idle++;
      await Promise.resolve();
      if(idle>=24&&!world.jobs.length)return;
    }
    throw Error('model scheduler did not quiesce');
  };
  world.advance=async ms=>{
    world.clock+=ms;
    for(const [id,t] of [...world.timers])if(t.at<=world.clock&&!t.tab.frozen&&!t.tab.closed){world.timers.delete(id);world.schedule(t.fn);}
    await world.flush();
  };
  world.write=(tab,key,value)=>{
    const oldValue=world.storage.get(key)??null,newValue=value===null?null:String(value);
    if(oldValue===newValue)return;
    if(newValue===null)world.storage.delete(key);else world.storage.set(key,newValue);
    for(const peer of world.tabs)if(peer!==tab)world.schedule(()=>{if(!peer.closed)peer.window.dispatchEvent({type:'storage',key,oldValue,newValue});});
  };
  world.startLock=req=>{
    if(req.started)return;req.started=true;
    if(req.tab.closed){req.reject(Error('tab closed'));return;}
    const slot=world.locks.get(req.name);
    if(slot){Promise.resolve().then(()=>req.callback(null)).then(req.resolve,req.reject);return;}
    const lease={tab:req.tab,request:req};world.locks.set(req.name,lease);
    const cleanup=()=>{if(world.locks.get(req.name)===lease)world.locks.delete(req.name);};
    let held;
    try{held=req.callback({name:req.name,mode:'exclusive'});}catch(e){cleanup();req.reject(e);return;}
    Promise.resolve(held).then(value=>{cleanup();req.resolve(value);},e=>{cleanup();req.reject(e);});
  };
  world.unpauseLocks=()=>{world.allowLocks=true;for(const req of world.lockRequests)if(!req.started)world.schedule(()=>world.startLock(req));};
  world.startDB=()=>{
    if(world.dbPaused||world.dbActive||!world.dbTransactions.length)return;
    const tx=world.dbTransactions.shift();world.dbActive=tx;world.dbMaxActive=Math.max(world.dbMaxActive,1);
    world.schedule(()=>{
      tx.active=true;tx.value=world.dbRecord?{...world.dbRecord}:null;
      for(const request of tx.gets){request.result=tx.value?{...tx.value}:undefined;world.dbHistory.push({op:'get',owner:request.result?.id||null,tab:tx.tab.id});request.onsuccess?.();}
      world.schedule(()=>{
        if(tx.abortError){tx.error=tx.abortError;tx.onabort?.();}
        else{world.dbRecord=tx.value?{...tx.value}:null;tx.oncomplete?.();}
        tx.active=false;world.dbActive=null;world.startDB();
      });
    });
  };
  world.unpauseDB=()=>{world.dbPaused=false;world.startDB();};
  world.close=(tab,{abrupt=false,persisted=false}={})=>{
    if(!abrupt)tab.window.dispatchEvent({type:'pagehide',persisted});
    if(persisted){tab.frozen=true;return;}
    tab.closed=true;
    // This models the UA releasing Web Locks after the context is destroyed.
    for(const [name,lease] of world.locks)if(lease.tab===tab)world.locks.delete(name);
  };
  world.tab=(options={})=>{
    const tab={id:'tab-'+(world.tabs.length+1),closed:false,frozen:false,events:[],selected:'esma:0',calls:{prime:0,rebase:0,flush:0,stop:[],finish:0},busy:false,paused:false};
    const document={...target(),nodes:new Map(),documentElement:{lang:options.lang||'en'},readyState:'complete'};
    document.createElement=tag=>element(tag,document);document.body=element('body',document);document.getElementById=id=>document.nodes.get(id)||null;
    const window={...target(),console,document,navigator:{},crypto:{randomUUID:()=>tab.id},I18N:{lang:options.lang||'en'},
      CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
      setTimeout(fn,ms){const id=++world.nextTimer;world.timers.set(id,{tab,fn,at:world.clock+Number(ms||0)});return id;},
      clearTimeout(id){world.timers.delete(id);},confirm(){tab.confirmations=(tab.confirmations||0)+1;return options.confirm!==false;},
      localStorage:{getItem:key=>world.storage.get(String(key))??null,setItem:(key,value)=>world.write(tab,String(key),value),removeItem:key=>world.write(tab,String(key),null)}};
    if(options.locks!==false)window.navigator.locks={request(name,lockOpt,callback){
      assert.equal(lockOpt.mode,'exclusive');assert.equal(lockOpt.ifAvailable,true);
      return new Promise((resolve,reject)=>{const req={name,tab,callback,resolve,reject,started:false};world.lockRequests.push(req);if(world.allowLocks)world.schedule(()=>world.startLock(req));});
    }};
    if(options.idb!==false)window.indexedDB={open(){
      const request={};world.schedule(()=>{
        if(options.idbError){request.error=Error('IDB unavailable');request.onerror?.();return;}
        request.result={objectStoreNames:{contains:()=>world.dbCreated},createObjectStore(){world.dbCreated=true;},close(){},
          transaction(name,mode){
            assert.equal(name,'owner');assert.equal(mode,'readwrite');
            const tx={tab,gets:[],active:false,objectStore(storeName){
              assert.equal(storeName,'owner');return {
                get(key){assert.equal(key,'active');const r={};tx.gets.push(r);return r;},
                put(value,key){assert(tx.active,'put must be inside active atomic transaction');assert.equal(key,'active');tx.value={...value};world.dbHistory.push({op:'put',owner:value.id,tab:tab.id});},
                delete(key){assert(tx.active,'delete must be inside active atomic transaction');assert.equal(key,'active');tx.value=null;world.dbHistory.push({op:'delete',owner:null,tab:tab.id});}};}};
            world.dbTransactions.push(tx);world.startDB();return tx;
          }};
        if(!world.dbCreated)request.onupgradeneeded?.();request.onsuccess?.();
      });return request;
    }};
    window.BroadcastChannel=class{
      constructor(name){this.name=name;this.tab=tab;tab.channel=this;}
      postMessage(data){world.messages.push({sender:tab.id,data:{...data}});for(const peer of world.tabs)if(peer!==tab&&peer.channel?.name===this.name)world.schedule(()=>{if(!peer.closed)peer.channel.onmessage?.({data:{...data}});});}
    };
    if(options.session){window.SukunSessionState=options.session;window.SessionState=options.session;}
    Object.assign(window,options.sources||{});
    window.window=window;window.globalThis=window;tab.window=window;
    world.tabs.push(tab);vm.createContext(window);vm.runInContext(runtime,window,{filename:'tab-owner-r981.js'});tab.owner=window.SukunTabOwner;
    tab.owner.bind({identity:()=>tab.selected,prime:()=>tab.calls.prime++,rebase:()=>tab.calls.rebase++,
      flush:()=>{tab.calls.flush++;assert(tab.owner.owns(),'final flush must retain ownership');},busy:()=>tab.busy,paused:()=>tab.paused,
      finish:()=>tab.calls.finish++,stop:reason=>tab.calls.stop.push(reason)});
    window.addEventListener('sukun:tabownerchange',e=>tab.events.push(e.detail));
    tab.emit=(type,detail)=>window.dispatchEvent({type,detail});
    tab.persist=(key,value)=>{if(!tab.owner.canPersist(key))return false;window.localStorage.setItem(key,JSON.stringify(value));return true;};
    return tab;
  };
  return world;
}
async function claim(world,tab){const result=tab.owner.acquire();await world.flush();return await result;}
async function drain(world,tab){tab.busy=false;tab.emit('sukun:audioaggregatechange');await world.advance(240);}

module.exports={origin,runtime};
