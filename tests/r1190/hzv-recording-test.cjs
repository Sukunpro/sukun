const fs=require('fs'), vm=require('vm'), assert=require('assert');
const src=fs.readFileSync(process.argv[2] || 'nero.html','utf8');
const extract=src.slice(src.indexOf('let HZV_REC=null,HZV_REC_I=-1'),src.indexOf('async function hzvKayitSil(i){'));
const elements={b:{textContent:''},audio:{pause(){}},save:{disabled:false},cancel:{disabled:false},status:{textContent:''}};
const panel={hidden:true,set innerHTML(v){this._html=v;elements.save.disabled=false;elements.cancel.disabled=false},querySelector(q){return q==='b'?elements.b:q==='audio'?elements.audio:q.includes('save')?elements.save:q.includes('cancel')?elements.cancel:elements.status},replaceChildren(){},scrollIntoView(){}};
let timeoutFn; let old=new Blob(['old'],{type:'audio/webm'}),saved=[],current=old,alerts=[],rec;
const track={addEventListener(n,fn){this.fn=fn},stop(){}};
class MR{constructor(){this.mimeType='audio/webm';this.state='inactive';rec=this}start(){this.state='recording'}stop(){this.state='inactive';this.onstop()}emit(){this.ondataavailable({data:new Blob(['x'.repeat(1200)],{type:'audio/webm'})})}}
const env={Blob,Uint8Array,Promise,console,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},document:{getElementById:()=>panel},navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track]})}},MediaRecorder:MR,window:{MediaRecorder:MR,SukunStudioBatch:{fingerprint:async b=>b.text()}},HZV_KISIM:[{ad:'test'}],hzvKey:i=>'key'+i,REC_DB:{get:async()=>current,compareAndSwap:async(entries,opt)=>{if(!current||await current.text()!==opt.expectedHashes.get(entries[0][0])){const e=new Error('BATCH_CONFLICT');e.code='BATCH_CONFLICT';throw e}saved.push(entries[0][1]);current=entries[0][1]},mergeMissing:async(entries)=>{if(current)return {added:0};saved.push(entries[0][1]);current=entries[0][1];return {added:1}}},RECKEYS:new Set(),alert:s=>alerts.push(s),toast:()=>{},hardStopAll(){},micKisit(){},micHazirla:async()=>{},recSessionBegin:(label,seconds,fn)=>{timeoutFn=fn;return {bitir(){}}},hzvKisimYaz(){},skRecordingCatalogPublish(){}};
vm.createContext(env);vm.runInContext(extract+'\nthis.start=hzvKayitCevir; this.cancelRecording=()=>HZV_REC_CANCEL();',env);
async function record(){await env.start(0);rec.emit();await env.start(0)}
(async()=>{
 await record();assert.equal(saved.length,0,'record must not overwrite');assert.equal(elements.save.disabled,false,'save available before full playback');await elements.save.onclick();assert.equal(saved.length,1,'only explicit save writes');
 current=old;saved=[];await record();elements.cancel.onclick();assert.equal(saved.length,0,'draft cancel preserves old');
 await env.start(0);rec.emit();track.fn();assert.equal(saved.length,0,'track interruption preserves old');assert(alerts.some(s=>s.includes('kesildi')));
 await record();elements.audio.onended();current=new Blob(['different'],{type:'audio/webm'});await elements.save.onclick();assert.equal(saved.length,0,'changed recording is not overwritten');assert(elements.status.textContent.includes('başka yerde değişti'));elements.cancel.onclick();current=null;saved=[];await record();await elements.save.onclick();assert.equal(saved.length,1,'new recording added');current=null;saved=[];await record();current=old;await elements.save.onclick();assert.equal(saved.length,0,'new record conflict preserves other tab recording');
 elements.cancel.onclick();current=old;saved=[];await env.start(0);rec.emit();timeoutFn();assert.equal(panel.hidden,false,'time limit yields draft');assert(elements.status.textContent.includes('Süre sınırına'));await elements.save.onclick();assert.equal(saved.length,1,'time limit draft can be approved');
 console.log('PASS: approval, cancel, interruption and changed-recording scenarios');
})().catch(e=>{console.error(e);process.exit(1)});
