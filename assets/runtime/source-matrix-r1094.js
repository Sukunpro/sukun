/* Exact canonical recording coverage. No playback, decode, network request,
 * source-preference change, recording write, or counter operation is performed. */
(function(w){
 'use strict';if(w.SukunSourceMatrixR1094)return;
 const VERSION='r1094',TIMEOUT=4000,MAX_ITEMS=5000,MAX_KEYS=20000;
 const CATEGORIES={esma:['Esmâü’l-Hüsnâ','Divine names'],tevhid:['Tevhid','Tawhid'],temel:['Temel zikirler','Basic dhikr'],arinma:['İstiğfar ve arınma','Forgiveness and purification'],salavat:['Salavat','Salawat'],tesbih:['Tesbihat','Tasbih'],berhet:['Berhetiyye','Berhetiyye'],terkip:['Esmâ terkipleri','Name combinations'],koruma:['Koruyucu sûreler','Protective surahs']};
 const FIELDS=['tr','t','nm','a','ar','aya','ya','oku','translit','nt','_src','_i'];
 let environmentEpoch=0;
 const safe=(fn,fallback=null)=>{try{return fn()??fallback}catch(_){return fallback}};
 const text=value=>typeof value==='string'?value.trim():'';
 const zikirs=()=>typeof ZIKIR!=='undefined'?ZIKIR:w.ZIKIR;
 const db=()=>typeof REC_DB!=='undefined'?REC_DB:null;
 const recordingCatalog=()=>typeof SK_RECORDING_CATALOG!=='undefined'?SK_RECORDING_CATALOG:null;
 const knownKeys=()=>typeof RECKEYS!=='undefined'?RECKEYS:null;
 const access=()=>w.SukunSecretPolicy?.unlocked?.()===true;
 const privateKey=key=>/^berhet:|^mzbz:|berhetiy/i.test(String(key||''));
 function allowedKey(key){return typeof key==='string'&&(!privateKey(key)||access())&&safe(()=>w.SukunSecretPolicy?.secretRecKey?.(key)!==true||access(),false)}
 function visible(cat,index){
  if(cat==='fav'||cat==='berhet'&&!access())return false;
  return safe(()=>{
   const step={type:'zikir',cat,idx:index};
   if(cat==='terkip'&&w.SukunTerkipAllowed?.(step)!==true)return false;
   return w.SukunSessionPreflightR1092?.isVisible?.(step)===true;
  },false);
 }
 function describeTarget(id){
  if(typeof id!=='string'||typeof w.SukunReadingSourcesR1064?.forZikir!=='function')return null;const match=id.match(/^zikir:([a-z][a-z0-9_-]{0,30}):(0|[1-9]\d*)(?::(nida|tev))?$/);if(!match)return null;
  const cat=match[1],index=Number(match[2]),form=cat==='esma'?(match[3]||'nida'):'default';
  if(!Number.isSafeInteger(index)||!visible(cat,index)||cat!=='esma'&&match[3])return null;
  const item=zikirs()?.[cat]?.items?.[index];if(!item||cat==='esma'&&form==='tev'&&item.nt)return null;
  const record=safe(()=>w.SukunReadingSourcesR1064?.forZikir?.(cat,index,form==='default'?'nida':form));
  const title=cat==='esma'?text(record?.latin)||text(item.ya)||text(item.t):text(item.tr)||text(item.t)||text(item.nm)||text(item.oku)||text(item.translit);
  if(!title)return null;
  const key=cat==='esma'?`esma:${index}:${form}`:text(record?.recordingKeys?.[0])||`${cat}:${index}`,sourceLocked=!allowedKey(key);
  const category=CATEGORIES[cat]||['Diğer okumalar','Other readings'];
  return{id:cat==='esma'?`zikir:${cat}:${index}:${form}`:`zikir:${cat}:${index}`,cat,index,form,key:sourceLocked?null:key,sourceLocked,title,titleEn:title,formLabel:form==='nida'?'Nidâ':form==='tev'?'Tevhid':'Okuma',formLabelEn:form==='nida'?'Vocative':form==='tev'?'Tawhid':'Reading',categoryTitle:category[0],categoryTitleEn:category[1]};
 }
 const isVisible=value=>!!describeTarget(typeof value==='string'?value:value?.id);
 const contentStamp=item=>JSON.stringify([FIELDS.map(key=>item?.[key]),Array.isArray(item?.esmaIndices)?item.esmaIndices:[]]);
 function collect(){
  const all=zikirs();if(!all||typeof all!=='object'||typeof w.SukunReadingSourcesR1064?.forZikir!=='function'||typeof w.SukunSessionPreflightR1092?.isVisible!=='function'||typeof w.SukunSecretPolicy?.secretStep!=='function')return null;
  const rows=[],items=[],categories=[];let unsupportedForms=0;
  for(const [cat,category]of Object.entries(all)){
   if(cat==='fav'||!Array.isArray(category?.items))continue;const list=category.items;categories.push({cat,list,length:list.length});
   if(categories.reduce((sum,item)=>sum+item.length,0)>MAX_ITEMS)throw Error('catalog-limit');
   for(let index=0;index<list.length;index++){
    if(!visible(cat,index))continue;const item=list[index];if(!item)continue;
    const forms=cat==='esma'?['nida',...(item.nt?[]:['tev'])]:['default'];let included=false;
    for(const form of forms){const target=describeTarget(`zikir:${cat}:${index}`+(cat==='esma'?':'+form:''));if(target){rows.push(target);included=true}}
    if(included){items.push({cat,index,item,stamp:contentStamp(item)});if(cat==='esma'&&item.nt)unsupportedForms++}
   }
  }
  return{rows,items,categories,unsupportedForms};
 }
 function catalogCurrent(captured){
  const all=zikirs(),cats=Object.keys(all||{}).filter(cat=>cat!=='fav'&&Array.isArray(all[cat]?.items));
  return cats.length===captured.categories.length&&captured.categories.every(entry=>all?.[entry.cat]?.items===entry.list&&entry.list.length===entry.length)&&captured.items.every(entry=>all?.[entry.cat]?.items?.[entry.index]===entry.item&&contentStamp(entry.item)===entry.stamp);
 }
 function catalogStamp(){const value=recordingCatalog();return JSON.stringify([value?.sequence||0,value?.verified===true,value?.pending===true,String(value?.error||''),Array.from(knownKeys()||[]).map(String).sort()])}
 function voiceStamp(){return JSON.stringify(['ar','tr'].map(lang=>{const voice=safe(()=>w.SukunVoiceCatalog?.peek?.(lang));return voice?[voice.name,voice.voiceURI,voice.lang,voice.localService]:null}))}
 function fallbackKeys(target){
  if(target.sourceLocked)return[];
  if(target.cat==='esma')return[`esma:${target.index}:${target.form==='nida'?'tev':'nida'}`,`esma:${target.index}`].filter(allowedKey);
  // The shared Mezcelin/Bezcelin slot also has an older category-index alias.
  const legacy=`${target.cat}:${target.index}`;return target.key!==legacy&&allowedKey(legacy)?[legacy]:[];
 }
 const validBlob=blob=>typeof Blob!=='undefined'&&blob instanceof Blob&&blob.size>0&&(!blob.type||/^audio\//i.test(blob.type));
 const unavailable=reason=>({state:'unavailable',reason});
 function emptyCounts(){return{countScope:'visible-canonical-zikir',canonicalReadings:0,uniqueNames:0,validSlots:0,unsupportedForms:0,personal:{files:0,present:0,missing:0,unavailable:0,unknown:0,coveredNames:0,coveredReadings:0},generic:{files:0,present:0,missing:0,unavailable:0,unknown:0,coveredNames:0,coveredReadings:0,enabled:false}}}
 function count(rows,unsupportedForms,personalFiles,genericFiles){
  const counts=emptyCounts(),readings=new Set(rows.map(row=>`${row.cat}:${row.index}`)),names=new Set(rows.filter(row=>['esma','berhet'].includes(row.cat)).map(row=>`${row.cat}:${row.index}`));
  counts.canonicalReadings=readings.size;counts.uniqueNames=names.size;counts.validSlots=rows.length;counts.unsupportedForms=unsupportedForms;
  for(const source of['personal','generic']){
   const values=rows.filter(row=>row[source].state==='present');for(const row of rows)counts[source][row[source].state]++;
   counts[source].files=(source==='personal'?personalFiles:genericFiles).size;counts[source].coveredReadings=new Set(values.map(row=>`${row.cat}:${row.index}`)).size;counts[source].coveredNames=new Set(values.filter(row=>['esma','berhet'].includes(row.cat)).map(row=>`${row.cat}:${row.index}`)).size;
  }
  counts.generic.enabled=rows.some(row=>row.generic.enabled);return counts;
 }
 function device(target,language){
  const item=zikirs()?.[target.cat]?.items?.[target.index],policy=w.SukunReadingPolicy;
  if(typeof policy?.plan!=='function'||typeof w.SukunVoiceCatalog?.peek!=='function')return{state:'unknown',reason:'device-policy-unavailable',metadataOnly:true};
  const plan=safe(()=>policy.plan(item,{cat:target.cat,index:target.index,form:target.form==='default'?'nida':target.form,source:language==='ar'?'arabic':'turkish',content:language==='ar'?'arabic':'legacy',readOnly:true}));
  if(!plan)return{state:'unknown',reason:'device-policy-unavailable',metadataOnly:true};
  return{state:plan.ok?'available':'unavailable',reason:plan.ok?'device-metadata-only':String(plan.reason||'device-unavailable'),metadataOnly:true,offline:plan.voice?.localService===false?'network-needed':'device-dependent',lang:plan.lang||''};
 }
 async function inspect(opt={}){
  let captured;try{captured=collect()}catch(_){return{version:VERSION,status:'attention',rows:[],counts:emptyCounts(),personalStatus:'unavailable',genericStatus:'unavailable',reason:'catalog-limit'}}
  if(!captured)return{version:VERSION,status:'attention',rows:[],counts:emptyCounts(),personalStatus:'unavailable',genericStatus:'unavailable',reason:'catalog-unavailable'};
  const database=db(),generic=w.SukunGenericRecordings,epoch=environmentEpoch,initialAccess=access(),initialCatalog=catalogStamp(),initialVoices=voiceStamp(),preferences=safe(()=>w.SukunVoiceSettings?.epoch?.(),0),genericEpoch=safe(()=>generic?.epoch?.(),0),revisions=new Map();
  const keys=[...new Set(captured.rows.flatMap(target=>target.key?[target.key,...fallbackKeys(target)]:[]))];for(const key of keys)revisions.set(key,database?.revision?.(key)||0);
  const current=()=>safe(()=>!opt.signal?.aborted&&(typeof opt.isCurrent!=='function'||opt.isCurrent()===true)&&environmentEpoch===epoch&&access()===initialAccess&&db()===database&&catalogCurrent(captured)&&catalogStamp()===initialCatalog&&voiceStamp()===initialVoices&&preferences===(w.SukunVoiceSettings?.epoch?.()||0)&&genericEpoch===(generic?.epoch?.()||0)&&[...revisions].every(([key,revision])=>(database?.revision?.(key)||0)===revision),false);
  const check=()=>{if(!current())throw Object.assign(Error('matrix-stale'),{code:'matrix-stale'})};
  const progress=value=>{check();try{opt.onProgress?.(value)}catch(_){};check()};
  const own=new Map(),archive=new Map(),personalFiles=new Set(),genericFiles=new Set();let personalStatus='ok',genericStatus='ok',archiveResult=null;
  try{
   check();progress({current:0,total:captured.rows.length,phase:'personal'});
   let presentKeys=null;
   try{
    if(typeof database?.keys!=='function'||typeof database?.get!=='function')throw Error('recording-storage-unavailable');
    const value=await database.keys({signal:opt.signal,timeoutMs:TIMEOUT});check();if(!Array.isArray(value)||value.length>MAX_KEYS||value.some(key=>typeof key!=='string'))throw Error('recording-index-unavailable');presentKeys=new Set(value);
    if(!presentKeys.size&&Array.from(knownKeys()||[]).length)throw Error('recording-catalog-unconfirmed');
   }catch(error){check();presentKeys=null;personalStatus='unavailable';for(const key of keys)own.set(key,unavailable(error?.message==='recording-catalog-unconfirmed'?'recording-catalog-unconfirmed':'recording-storage-unavailable'))}
   if(presentKeys){
    for(let index=0;index<keys.length;index++){
     check();const key=keys[index];
     if(!presentKeys.has(key)){own.set(key,knownKeys()?.has?.(key)?unavailable('recording-catalog-unconfirmed'):{state:'missing',reason:'exact-slot-missing'});}
     else{
      try{const blob=await database.get(key,{signal:opt.signal,timeoutMs:TIMEOUT});check();if(validBlob(blob)){own.set(key,{state:'present',reason:'recording-blob-observed'});personalFiles.add(key)}else own.set(key,unavailable('recording-listed-unavailable'))}
      catch(_){check();own.set(key,unavailable('recording-read-unavailable'))}
     }
     progress({current:index+1,total:keys.length,phase:'personal'});
    }
    if([...own.values()].some(value=>value.state==='unavailable'))personalStatus='unavailable';
   }
   if(typeof generic?.inspectStored==='function'){
    try{
     archiveResult=await generic.inspectStored(keys,{signal:opt.signal,isCurrent:current,onProgress:progress});check();
     if(archiveResult?.status==='stale')throw Object.assign(Error('matrix-stale'),{code:'matrix-stale'});
     genericStatus=archiveResult?.status==='ok'?'ok':'unavailable';for(const row of archiveResult?.rows||[])if(keys.includes(row.key)){archive.set(row.key,row);if(row.state==='present')genericFiles.add(row.key)}
    }catch(error){check();if(error?.code==='matrix-stale')throw error;genericStatus='unavailable'}
   }else genericStatus='unavailable';
   const rows=[];
   for(let index=0;index<captured.rows.length;index++){
    check();const target=captured.rows[index],key=target.key,personal=key?(own.get(key)||unavailable('recording-source-unavailable')):{state:'unknown',reason:'source-locked'},stored=key?(archive.get(key)||unavailable('archive-source-unavailable')):{state:'unknown',reason:'source-locked'},fallback=fallbackKeys(target);
    const alternate=target.cat==='esma'&&fallback.some(candidate=>candidate.includes(':')&&candidate.split(':').length===3&&own.get(candidate)?.state==='present'),legacy=fallback.some(candidate=>(target.cat!=='esma'||candidate.split(':').length===2)&&own.get(candidate)?.state==='present');
    rows.push({...target,target:{key},personal:{...personal,exact:true,alternate,legacy},generic:{...stored,enabled:archiveResult?.enabled===true},device:{ar:device(target,'ar'),tr:device(target,'tr')}});
    progress({current:index+1,total:captured.rows.length,phase:'matrix'});
   }
   // A foreign tab's persisted bank revision is authoritative even if its
   // storage notification has not reached this tab yet.
   if(archiveResult?.revision!==null&&archiveResult?.revision!==undefined&&typeof generic?.describeBank==='function'){
    const final=await generic.describeBank({signal:opt.signal,isCurrent:current});check();if(final.bankId!==archiveResult.bankId||final.revision!==archiveResult.revision)throw Object.assign(Error('matrix-stale'),{code:'matrix-stale'});
   }
   if(presentKeys){
    const finalKeys=await database.keys({signal:opt.signal,timeoutMs:TIMEOUT});check();if(!Array.isArray(finalKeys)||finalKeys.length>MAX_KEYS||finalKeys.some(key=>typeof key!=='string'))throw Object.assign(Error('matrix-stale'),{code:'matrix-stale'});
    const finalSet=new Set(finalKeys);if(keys.some(key=>presentKeys.has(key)!==finalSet.has(key)))throw Object.assign(Error('matrix-stale'),{code:'matrix-stale'});
   }
   check();const counts=count(rows,captured.unsupportedForms,personalFiles,genericFiles);
   return{version:VERSION,status:personalStatus==='ok'&&genericStatus==='ok'?'ready':'attention',rows,counts,personalStatus,genericStatus};
  }catch(error){return{version:VERSION,status:!current()||error?.code==='matrix-stale'?'stale':'attention',rows:[],counts:emptyCounts(),personalStatus:'unavailable',genericStatus:'unavailable',reason:!current()||error?.code==='matrix-stale'?'matrix-stale':'matrix-unavailable'}}
 }
 for(const event of['sukun:secretaccesschange','sukun:recordingcatalog','sukun:itemrecordingchange','sukun:genericrecordingschange','sukun:genericrecordingsstatus','sukun:voicesettingschange','sukun-voice-catalog-changed','storage'])w.addEventListener?.(event,()=>{environmentEpoch++});
 w.SukunSourceMatrixR1094=Object.freeze({version:VERSION,inspect,describeTarget,isVisible});
})(window);
