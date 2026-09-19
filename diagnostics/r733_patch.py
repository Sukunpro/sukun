from pathlib import Path
p=Path(__file__).resolve().parents[1]/'nero.html'
s=p.read_text()
def replace(old,new,count=1):
 global s
 n=s.count(old)
 if n!=count: raise RuntimeError(f'Expected {count}, found {n}: {old[:100]}')
 s=s.replace(old,new)
# Preserve the return value throughout the original logging and mini-player decorators.
s=s.replace("const _autoStart=autoStart; autoStart=()=>{_autoStart();try{LOG.touch('zikir','📿 '+(($('#zTr')&&$('#zTr').textContent)||'Zikir'));}catch(e){}};", "const _autoStart=autoStart; autoStart=()=>{const result=_autoStart();if(result!==false)try{LOG.touch('zikir','📿 '+(($('#zTr')&&$('#zTr').textContent)||'Zikir'));}catch(e){};return result;};")
s=s.replace("const _autoStop=autoStop; autoStop=()=>{_autoStop();LOG.maybeEnd();};", "const _autoStop=autoStop; autoStop=()=>{const result=_autoStop();LOG.maybeEnd();return result;};")
s=s.replace("const _mAuS=autoStart;  autoStart=()=>{miniClearPause();_mAuS();miniSync();};", "const _mAuS=autoStart;  autoStart=()=>{miniClearPause();const result=_mAuS();miniSync();return result;};")
s=s.replace("const _mAuP=autoStop;   autoStop=()=>{_mAuP();miniSync();};", "const _mAuP=autoStop;   autoStop=()=>{const result=_mAuP();miniSync();return result;};")
# A pending niyet or voice promise is not a failed start. The existing scheduler
# waits for it and the counter gate still rejects any unspoken cycle.
replace("  if(ilk===false){autoStop();return false;}\n  try{zUI()}catch(e){}", "  if(ilk===false){\n    /* r733: a pending niyet/recording is a legitimate wait, not a terminal\n       failure. Keep the scheduler alive; no count is credited until rep succeeds. */\n    try{window.SukunR733Restart?.record?.('initial-voice-wait',{cat:Z.cat,idx:Z.idx,count:Z.count})}catch(e){}\n  }\n  try{zUI()}catch(e){}")
# Prevent false success and preserve in-flight startup state exposed to UI.
replace("  version:'r698',start:()=>autoStart(),stop:()=>autoStop(),", "  version:'r733',start:()=>autoStart(),stop:()=>autoStop(),\n  primeGesture:()=>{try{ac();if(ctx?.state==='suspended')ctx.resume().catch(()=>{});return true}catch(e){return false}},")
# Do not silently discard a new explicit Start after Stop. The shared transport
# owns duplicate and stop/start ordering instead of a wall-clock debounce.
replace("  const now=Date.now();\n  // A rapid Stop/Pause must never be discarded by the start debounce.\n  const live=Z.auto||window.SukunR698Transport?.hasJourney?.()||window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused;\n  if(!live&&now-_r477AutoTapAt<620)return;\n  _r477AutoTapAt=now;\n  const t=window.SukunR698Transport;", "  const t=window.SukunR698Transport;")
# The older foreground wrapper must preserve the actual result and claim only
# successful or pending starts. Existing queue arbitration remains unchanged.
replace("      const r=prevAutoStart.apply(this,args);if(!Z.auto)clearOwner('auto-zikir','auto-start-failed');return r;", "      const r=prevAutoStart.apply(this,args);if(r===false||!Z.auto)clearOwner('auto-zikir','auto-start-failed');return r;")
# Shared transport: all-stop is asynchronous. A fresh Play must wait for its
# physical cleanup, and an intervening Stop must invalidate the pending start.
start=s.index('<script id="r698-transport-authority">')
end=s.index('</script>',start)
block=s[start:end]
block=block.replace("let commandSeq=0,lastCommand='',lastAt=0,stopping=false;", """let commandSeq=0,lastCommand='',lastAt=0,stopping=false;
let pendingStop=null,pendingStart=null,intentEpoch=0;
const restartTrace=[];let restartSeq=0;
function record(type,detail={}){
 const entry={seq:++restartSeq,at:Date.now(),type,...detail};
 restartTrace.push(entry);if(restartTrace.length>48)restartTrace.shift();return entry;
}
function directState(){return safe(()=>direct()?.state?.(),{})||{}}
function primeGesture(){safe(()=>direct()?.primeGesture?.());}
function freshDirectStart(source){
 const d=direct();if(!d)return false;
 if(journey())return false;
 const before=directState();
 if(before.auto||before.starting)return true;
 d.clearStale?.();
 const result=d.start();
 const after=directState();
 record('direct-start-result',{source,result:result===false?'rejected':result===true?'accepted':'pending',auto:!!after.auto,starting:!!after.starting,cat:after.cat,idx:after.idx,count:after.count});
 return result!==false;
}
function startAfterStop(source){
 if(pendingStart)return true;
 const epoch=intentEpoch;
 primeGesture();
 record('start-after-stop-request',{source,epoch});
 const finish=()=>{
   if(epoch!==intentEpoch||journey()){
     record('start-after-stop-cancelled',{source,epoch});return false;
   }
   try{return freshDirectStart(source)}catch(e){safe(()=>window.sukunReport?.('r733-restart',e,source));record('start-after-stop-error',{source,message:String(e?.message||e)});return false}
 };
 const work=Promise.resolve(pendingStop).catch(e=>{safe(()=>window.sukunReport?.('r733-stop-settle',e,source));return false}).then(finish);
 pendingStart=work;
 work.finally(()=>{if(pendingStart===work){pendingStart=null;scheduleUI()}});
 scheduleUI();return true;
}
""")
block=block.replace("  mark('play-pause',source);", "  mark('play-pause',source);\n  record('play-pause',{source,epoch:intentEpoch,pendingStop:!!pendingStop,pendingStart:!!pendingStart});\n  if(pendingStart)return true;")
block=block.replace("    d.clearStale?.();return d.start()!==false;", "    if(pendingStop)return startAfterStop(source);\n    return freshDirectStart(source);")
old="""  const seq=mark('stop',source);
  if(stopping)return true;
  stopping=true;
  try{
    safe(()=>window.SukunJourneyAudioMachine?.intent?.('stop','r698-'+source));
    safe(()=>window.SukunSessionMemory?.cancelPending?.());
    safe(()=>window.SukunForegroundArbiter?.clearQueue?.('r698-stop'));
    const AR=window.SukunAudioSessionRegistry;
    if(AR?.stopAll)AR.stopAll();else legacy('r170Stop');
    // Even an already idle mix must release a stale independent auto source.
    safe(()=>direct()?.stop?.());
  }catch(e){safe(()=>window.sukunReport?.('r698-stop',e,source))}
  finally{stopping=false}
  return true;
"""
new="""  mark('stop',source);
  ++intentEpoch;
  record('stop',{source,epoch:intentEpoch});
  if(stopping)return true;
  stopping=true;
  try{
    safe(()=>window.SukunJourneyAudioMachine?.intent?.('stop','r698-'+source));
    safe(()=>window.SukunSessionMemory?.cancelPending?.());
    safe(()=>window.SukunForegroundArbiter?.clearQueue?.('r698-stop'));
    const AR=window.SukunAudioSessionRegistry;
    const work=AR?.stopAll?AR.stopAll():(legacy('r170Stop'),true);
    // Even an already idle mix must release a stale independent auto source.
    safe(()=>direct()?.stop?.());
    const settled=Promise.resolve(work).catch(e=>{safe(()=>window.sukunReport?.('r733-stop',e,source));return false});
    pendingStop=settled;
    settled.finally(()=>{if(pendingStop===settled){pendingStop=null;scheduleUI()}});
  }catch(e){safe(()=>window.sukunReport?.('r698-stop',e,source))}
  finally{stopping=false}
  return true;
"""
if old not in block:raise RuntimeError('stop not found')
block=block.replace(old,new)
# A pending fresh start is still preparing, not an idle or paused legacy mix.
block=block.replace(" const preparing=!paused&&!!(d.starting||(running&&['recovering','loading','preparing'].includes(v.kind)));", " const preparing=!paused&&!!(pendingStart||d.starting||(running&&['recovering','loading','preparing'].includes(v.kind)));")
block=block.replace(" const label=paused?'Devam et':preparing?'Hazırlanıyor'", " const label=preparing?'Hazırlanıyor':paused?'Devam et'")
block=block.replace("const snapshot=()=>Object.freeze({version:'r702',commandSeq,lastCommand,lastAt,stopping,journey:journey()?.kind||'',direct:direct()?.state?.()||null});", "const snapshot=()=>Object.freeze({version:'r733',commandSeq,lastCommand,lastAt,stopping,pendingStop:!!pendingStop,pendingStart:!!pendingStart,intentEpoch,journey:journey()?.kind||'',direct:directState(),restartTrace:restartTrace.map(x=>({...x}))});")
block=block.replace("window.SukunR698Transport=Object.freeze({version:'r702'", "window.SukunR698Transport=Object.freeze({version:'r733'")
block=block.replace("renderUI();\n})();", "window.SukunR733Restart=Object.freeze({version:'r733',snapshot,record});\nrenderUI();\n})();")
s=s[:start]+block+s[end:]
p.write_text(s)
print('Patched',p,'bytes',p.stat().st_size)
