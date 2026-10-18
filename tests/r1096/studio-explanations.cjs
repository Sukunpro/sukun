'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const window={I18N:{lang:'tr'}};
const document={documentElement:{lang:'tr'}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../assets/runtime/studio-preparation-r982.js'),'utf8'),{window,document});
const api=window.SukunStudioPreparation;
const cases=[
 ['PREP_DURATION_LIMIT',/60 saniyelik/,/60 seconds/],
 ['PREP_SOURCE_LIMIT',/8 MiB dosya sınırını/,/8 MiB file limit/],
 ['PREP_MEMORY_LIMIT',/bellek bütçesini/,/memory budget/],
 ['PREP_QUEUE_FULL',/sırası dolu/,/queue is full/],
 ['PREP_DECODE_BUSY',/çözümleme işlemi henüz bitmedi/,/decoding operation has not finished/],
 ['PREP_WORKER_TIMEOUT',/ayrılan süre içinde/,/allowed time/],
 ['PREP_TIMEOUT',/ayrılan süre içinde/,/allowed time/],
 ['PREP_INVALID_HEADER',/başlık bilgileri doğrulanamadı/,/header could not be verified/],
 ['PREP_UNKNOWN_DURATION',/süresi doğrulanamadı/,/duration could not be verified/],
 ['PREP_UNKNOWN_LAYOUT',/kanal yapısı doğrulanamadı/,/channel layout could not be verified/],
 ['PREP_WORKER_FAILED',/Ses örnekleri işlenemedi/,/audio samples could not be processed/],
 ['PREP_FAILED',/Ses işleme tamamlanamadı/,/Audio processing could not be completed/]
];
for(const lang of ['tr','en']){
 window.I18N.lang=lang;document.documentElement.lang=lang;
 for(const [code,tr,en]of cases){
  const text=api.explain({code});
  assert.match(text,lang==='tr'?tr:en,`${lang}: ${code}`);
  assert.match(text,lang==='tr'?/Asıl kayıt korundu\.|asıl kayıt korundu\./:/Your original recording was kept\.|your original recording was kept\./);
  assert.doesNotMatch(text,/PREP_|STUDIO_/);
 }
 const generic=api.explain(new Error('native failure'));
 assert.match(generic,lang==='tr'?/Asıl kayıt korundu/:/original recording was kept/);
 assert.doesNotMatch(generic,/native failure/);
 assert.equal(api.explain({code:'PREP_FUTURE_CODE'}),api.explain({code:'PREP_FAILED'}));
 assert.match(api.explain({code:'STUDIO_SOURCE_CHANGED'}),lang==='tr'?/Daha yeni kayıt korundu/:/newer recording was kept/);
 for(const code of [...cases.map(([code])=>code),'PREP_CANCELLED','STUDIO_STALE','STUDIO_SOURCE_CHANGED','PREP_FUTURE_CODE',undefined]){
  const text=api.explain({code},{saved:true});
  assert.match(text,lang==='tr'?/Kayıt kaydedildi; güncel kaydın analizi tamamlanamadı/:/The recording was saved; analysis of the current recording could not finish/);
  assert.match(text,lang==='tr'?/Güncel kayıt saklandı\./:/The current recording is saved\./);
  assert.doesNotMatch(text,/korundu|kaydedilmedi|kept|no changes|edit was cancelled|PREP_|STUDIO_/i);
 }
 assert.match(api.explain({code:'PREP_MEMORY_LIMIT'},{saved:true}),lang==='tr'?/bellek bütçesini/:/memory budget/);
 assert.match(api.explain({code:'PREP_UNKNOWN_DURATION'},{saved:true}),lang==='tr'?/süresi doğrulanamadı/:/duration could not be verified/);
 assert.match(api.explain({code:'PREP_UNKNOWN_LAYOUT'},{saved:true}),lang==='tr'?/kanal yapısı doğrulanamadı/:/channel layout could not be verified/);
}
console.log('Studio explanations: 24 reason-specific checks, 34 saved-context checks and fallback/source-change checks passed.');
