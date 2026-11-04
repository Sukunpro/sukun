/* Journey card shortcuts share the session boundary and native saved progress. */
(()=>{'use strict';
const configs={'28':{id:'berhetSeyir',api:()=>window.SukunBerhetiyyeSeyir,mode:'berhet'},'99':{id:'esmaSeyir99',api:()=>window.SukunEsma99Seyir,mode:'esma'}};
let intent=0,queued=false;
const en=()=>window.I18N?.lang==='en';
const say=(tr,eng)=>window.toast?.(en()?eng:tr);
async function act(kind,action){
 const c=configs[kind],session=window.SukunSessionState;
 if(!c||!session||kind==='28'&&!window.SukunSecretPolicy?.unlocked?.())return false;
 const state=c.api()?.state?.();if(!state)return false;
 if(action==='resume'&&state.i>=Number(kind)){say('Bu seyir tamamlandı. Yeniden okumak için Baştan başlat’a dokun.','This journey is complete. Choose Restart to read it again.');return false;}
 if(action==='restart'&&!window.confirm(en()?'Reset this entire journey and start from the first name?':'Bu seyrin tüm ilerlemesi sıfırlanıp ilk isimden başlatılsın mı?'))return false;
 const ticket=++intent;
 try{
  if(action==='stop'){
   // An inactive card must never stop the other journey or unrelated audio.
   if(session.snapshot()?.journeyKind!==kind||!(state.run||state.paused||state.systemHold))return false;
   const result=await session.command('stop');render();return !!result?.accepted&&!result?.stale;
  }
  const current=session.snapshot();
  if(current.journeyKind!==kind||current.smartSession){
   // No index argument: selection must preserve the native i/rep checkpoint.
   const selected=await session.command('select',{mode:c.mode,journeyKind:kind});
   if(ticket!==intent)return false;
   if(!selected?.accepted||selected?.stale)throw Error('selection');
  }
  if(ticket!==intent)return false;
  const result=await session.command(action==='restart'?'restart-journey':'resume',{journeyKind:kind});
  if(!result?.accepted||result?.stale)throw Error(result?.reason||'command');
  render();return true;
 }catch(error){say('Seyir başlatılamadı. Ses seçimini ve oturum durumunu kontrol et.','Could not start the journey. Check the voice selection and session state.');render();return false;}
}
function label(node,value){if(node.textContent!==value)node.textContent=value;}
function mount(kind,c){
 const panel=document.getElementById(c.id);if(!panel)return;
 let row=panel.querySelector('.r1193JourneyActions');
 if(!row){
  row=document.createElement('div');row.className='r1193JourneyActions';row.setAttribute('role','group');
  for(const action of ['resume','restart','stop']){
   const b=document.createElement('button');b.type='button';b.dataset.journeyAction=action;b.id='r1193Journey'+kind+action;
   b.onclick=()=>act(kind,action);row.append(b);
  }
  const status=panel.querySelector('.r168Status');if(status)status.before(row);else panel.querySelector('summary').after(row);
 }
 const tag=panel.querySelector('summary .r168Tag');
 if(tag&&tag.tagName!=='BUTTON'){
  const button=document.createElement('button');button.type='button';button.className='r168Tag r1193ResumeTag';
  button.onclick=e=>{e.preventDefault();e.stopPropagation();act(kind,'resume')};tag.replaceWith(button);
 }
 const state=c.api()?.state?.()||{},playing=!!state.run&&!state.paused,complete=state.i>=Number(kind);
 const resumeText=en()?(complete?'Journey complete':playing?'Journey running':'Resume where I left off'):(complete?'Seyir tamamlandı':playing?'Seyir devam ediyor':'Kaldığım yerden devam et');
 for(const b of [panel.querySelector('.r1193ResumeTag'),row.querySelector('[data-journey-action="resume"]')])if(b){label(b,resumeText);b.disabled=complete||playing;}
 label(row.querySelector('[data-journey-action="restart"]'),en()?'Restart from beginning':'Baştan başlat');
 const stop=row.querySelector('[data-journey-action="stop"]');label(stop,en()?'End journey':'Seyri bitir');
 stop.disabled=!(state.run||state.paused||state.systemHold);
 row.setAttribute('aria-label',en()?'Journey controls':'Seyir kısayolları');
}
function render(){queued=false;for(const [kind,c] of Object.entries(configs))mount(kind,c);}
function queue(){if(!queued){queued=true;requestAnimationFrame(render);}}
function start(){
 render();window.SukunSessionState?.subscribe?.(queue);
 // Panels are created lazily and recreated after unlocking. Observe additions only.
 const host=document.getElementById('tab-zkr');if(host)new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#berhetSeyir,#esmaSeyir99')||n.querySelector?.('#berhetSeyir,#esmaSeyir99')))))queue();
 }).observe(host,{childList:true,subtree:true});
 ['sukun:playbackchange','sukun:journey-advance','sukun:languagechange','pageshow'].forEach(e=>window.addEventListener(e,queue));
}
window.SukunJourneyPanelControls=Object.freeze({act});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
