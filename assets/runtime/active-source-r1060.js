/* Passive playback presentation. A selected dhikr is not an active sound. */
(()=>{'use strict';
 if(window.SukunActiveSource)return;
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
 const number=v=>v!=null&&Number.isFinite(Number(v))?Number(v):null;
 const activeState=v=>/^(playing|paused|preparing|starting|buffering|interrupted|recovering)$/i.test(clean(v));
 const name=v=>clean(v).replace(/^[^\p{L}\p{N}]+/u,'');
 const hz=v=>{const n=number(v);return n==null?'—':String(Math.round(n*1000)/1000);};
 function resolve(flow={},session={},raw=[],lang){
  const en=(lang||window.I18N?.lang)==='en',t=(tr,eng)=>en?eng:tr;
  const p=flow.playback||{},z=flow.zikir||{},fr=flow.frequency||{},s=flow.session||{};
  const entries=(Array.isArray(raw)?raw:[]).filter(x=>x&&clean(x.ad||x.name||x.title)).map(x=>({...x,name:name(x.name||x.ad||x.title)}));
  const amb=entries.filter(x=>/^(ambiyans|ambience|ambient)$/.test(x.tur||x.type||''));
  const readers=entries.filter(x=>/^(okuyucu|reader|tekke)$/.test(x.tur||x.type||''));
  const frequency=!!(fr.playing||fr.secondary?.playing||entries.some(x=>/^(frekans|frequency)$/.test(x.tur||x.type||'')));
  const queue=/^(smart-session|global-queue|global-flow|queue)$/.test(p.id||'')&&activeState(p.state);
  const provider=activeState(p.state)&&!!clean(p.id)&&! /^(mix|ambient|ambience|frequency|frekans|zikir|auto-zikir|journey28|journey99|berhetiyye|hatim)$/.test(p.id);
  const running=!!(session.playing||session.paused||session.preparing||activeState(session.phase));
  const owner=/^(auto-zikir|journey28|journey99)$/.test(session.owner||'');
  const queueDhikr=queue&&p.stepType==='zikir'&&(running||s.playing||s.paused);
  const dhikr=!!(queueDhikr||z.auto||session.journey?.active||session.journeyRunning||session.journeyPaused||
   running&&(owner||!provider&&!readers.length)||z.session?.active&&(z.session.playing||z.session.paused)&&!queue);
  let kind='idle',title='SÜKÛN',current='',type='—',progressPolicy='none';
  if(queue&&!dhikr){kind='session';title=clean(p.moduleTitle||s.name)||t('Akış','Flow');current=clean(p.sectionTitle);type=t('Akış','Flow');progressPolicy='provider';}
  else if((provider&&!queue||readers.length)&&!(owner&&running)&&!session.journey?.active){kind='reader';title=provider?clean(p.moduleTitle)||readers[0]?.name||t('Okuyucu','Reader'):readers[0].name;current=provider?clean(p.sectionTitle):readers[0].name;type=t('Okuyucu','Reader');progressPolicy='provider';}
  else if(dhikr){kind='zikir';title=clean(session.activeName||z.name||p.sectionTitle)||t('Zikir','Dhikr');current=title;type=(session.activeMode||z.cat)==='berhet'?'Berhetiyye':(session.activeMode||z.cat)==='esma'?t('Esmâ','Asma'):clean(z.kind)||t('Zikir','Dhikr');progressPolicy='dhikr';}
  else if(amb.length||frequency){
   kind=amb.length&&frequency?'background':amb.length?'ambience':'frequency';
   title=type=kind==='background'?t('Ambiyans ve frekans','Ambience and frequency'):kind==='ambience'?t('Ambiyans','Ambience'):t('Frekans','Frequency');
   const parts=amb.map(x=>x.name);
   if(frequency){const modes={bin:'Binaural',iso:t('İzokronik','Isochronic'),mono:'Monaural',mix:t('Karma','Mixed')};
    if(fr.playing)parts.push((modes[fr.mode]||t('Frekans','Frequency'))+' · '+hz(fr.carrier)+' Hz · '+hz(fr.beat)+' Hz');
    if(fr.secondary?.playing)parts.push(t('İkinci binaural','Second binaural')+' · '+hz(fr.secondary.carrier??fr.secondary.c)+' Hz · '+hz(fr.secondary.beat??fr.secondary.b)+' Hz');
    if(!fr.playing&&!fr.secondary?.playing)parts.push(...entries.filter(x=>/^(frekans|frequency)$/.test(x.tur||x.type||'')).map(x=>x.name));
   }
   current=parts.join(' · ');
  }
  const isDhikr=kind==='zikir',background=['ambience','frequency','background'].includes(kind);
  const timed=!background&&kind!=='idle'&&number(p.remaining)!=null&&number(p.remaining)>=0;
  const listedFrequency=entries.some(x=>/^(frekans|frequency)$/.test(x.tur||x.type||''));
  const layerCount=entries.length+(fr.playing&&!listedFrequency?1:0)+(fr.secondary?.playing?1:0)||((isDhikr||provider)?1:0);
  return Object.freeze({version:'r1060',kind,title,current,item:current||'—',type,dhikr:isDhikr,background,
   progressPolicy,timed,volumeScope:isDhikr?'zikir':'master',navigation:kind!=='idle'&&!background,
   layerCount,frequency:Object.freeze({...fr}),layers:Object.freeze(entries.map(x=>clean(x.ad||x.name||x.title)+(clean(x.ek)?' · '+clean(x.ek):'')))});
 }
 const safe=(fn,fallback)=>{try{return fn()??fallback}catch(_){return fallback}};
 function read(flow){
  flow=flow||safe(()=>window.currentFlowState?.snapshot?.(),{});
  const session=safe(()=>window.SukunSessionState?.snapshot?.(),{});
  const entries=safe(()=>typeof miniPlayingInfo==='function'?miniPlayingInfo().tam:[],[]);
  const queued=safe(()=>flow.playback?.id==='smart-session'?window.R170?.Player:flow.playback?.id==='global-queue'?window.GlobalQueue?.state:null,null);
  if(queued)flow={...flow,playback:{...flow.playback,state:queued.playing?'playing':queued.paused?'paused':'idle',stepType:queued.playing||queued.paused?queued.queue?.[queued.i]?.type:null}};
  const frequency=safe(()=>typeof FR!=='undefined'?{playing:!!FR.playing,carrier:FR.c,beat:FR.b,mode:FR.mode,volume:FR.vol}:flow.frequency,flow.frequency||{});
  const secondary=safe(()=>typeof FR2!=='undefined'&&FR2.E?{playing:true,carrier:FR2.c,beat:FR2.b}:null,null);
  const value=resolve({...flow,frequency:{...frequency,secondary:secondary||frequency?.secondary}},session,entries);
  const permitted=!value.dhikr||session.activeMode!=='berhet'||safe(()=>window.SukunSecretPolicy?.unlocked?.(),false);
  return permitted?Object.freeze({...value,permitted:true}):Object.freeze({...value,title:'SÜKÛN',current:'',item:'—',permitted:false});
 }
 window.SukunActiveSource=Object.freeze({version:'r1060',resolve,read});
})();
