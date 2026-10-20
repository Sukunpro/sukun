'use strict';
// Reconstructed reviewed adapters. Hash gates reopen review on ANY source change.
// Application JavaScript is never evaluated, executed, imported or fetched.
const crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const BASELINES={esma:'dc97cdaa6f31f63593f1576ad9ec7d3b206f0f55ff1b2aced8f43b0202d44854',portal:'0048e2a9cac8416faa0102b1cc10ff8d262693f09be89e4ad663c170e9c077c9',consumer:'01d6df44216978e711ef01c65ce00c86cc93e188712e3d01227d790b20aa0004',atlas:'1b15e95d0d1fd002f37d3cd03c26dbae7f56017e7a400293bd145b5d585f2fde'};
function mapDynamicVisuals({esma='',portal='',consumer='',atlas=''}){
 const source={esma,portal,consumer,atlas},coverage={},aliases=[],unresolved=[];
 for(const [key,value]of Object.entries(source)){coverage[key]={present:!!value,sha256:hash(value),reviewedSha256:BASELINES[key],verified:!!value&&hash(value)===BASELINES[key]};if(value&&!coverage[key].verified)unresolved.push({code:'DYNAMIC_REVIEW_SOURCE_CHANGED',producer:key,sha256:hash(value)});}
 const add=(alias,target,producer,role)=>aliases.push({alias,target:target.replace(/^\.\//,''),producer,role,proof:'Exact reviewed producer/consumer SHA-256; source is never executed.'});
 if(coverage.esma.verified&&coverage.consumer.verified){
  const ids=[...esma.matchAll(/^ scene\('([a-z-]+)'/gm)].map(m=>m[1]);
  for(const id of ids){add('esma-scene:'+id,'assets/scenes/esma-r923/'+id+'.webp','esma','main');add('esma-scene:'+id+':lite','assets/scenes/esma-r923/'+id+'-lite.webp','esma','fallback');}
  add('esma-scene:classic','assets/scenes/mobile-r918/mevlevi.webp','esma','main');add('esma-scene:classic:lite','assets/sukun-nur-sanctuary-r757.png','esma','fallback');
  coverage.esma.catalogChoices=ids.length+1;coverage.esma.automaticPolicy='99 name indexes use the reviewed five-item calmSequence modulo; invalid indexes and unknown choices fall back to classic. These are visual assignments, not religious associations.';
 }
 if(coverage.portal.verified){for(const name of portal.match(/\['portal', 'dormant', 'guardian', 'welcome', 'lockwheel', 'palace'\]/)[0].match(/[a-z]+/g))add('portal:'+name,'assets/berhetiyye-gate/'+name+'.webp','portal','main');coverage.portal.base='Relative to currentScript URL, with document-relative assets/berhetiyye-gate/ fallback; mapped paths assume the shipped script URL.';}
 if(coverage.atlas.verified&&coverage.consumer.verified){
  const rows=JSON.parse(atlas.match(/nameScenes:Object\.freeze\((\[[\s\S]*?\])\.map\(Object\.freeze\)\)/)[1]);
  for(const row of rows){add('berhet-scene:'+row.sceneId+':original',row.asset,'atlas','fallback');add('berhet-scene:'+row.sceneId+':thumbnail','assets/scenes/thumb-r949/'+row.runtimeAsset.split('/').pop().replace(/\.[^.]+$/,'.webp'),'atlas','thumbnail');}
  const table=consumer.match(/const files=\{((?:[a-z]+:'[\w.-]+\.png',?)+)\};/)[1];
  for(const m of table.matchAll(/([a-z]+):'([\w.-]+\.png)'/g)){add('berhet-fixed:'+m[1]+':original','assets/berhetiyye-premium/'+m[2],'atlas','fallback');add('berhet-fixed:'+m[1]+':thumbnail','assets/scenes/thumb-r949/'+m[2].replace(/\.png$/,'.webp'),'atlas','thumbnail');}
 }
 return{coverage,aliases,unresolved};
}
module.exports={mapDynamicVisuals,BASELINES};
