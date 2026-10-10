'use strict';
// Source/cascade contracts and conservative sRGB compositing, not browser QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const baseline=process.argv[3]&&path.resolve(process.argv[3]);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const marker='sukun-r1031-personal-centre-glass';
const full=html.match(new RegExp('<style id="'+marker+'">([\\s\\S]*?)<\\/style>\\n'));
assert(full,'Missing personal-centre style owner');
const css=full[1],clean=css.replace(/\/\*[\s\S]*?\*\//g,'');
const scope='html body.r716-shell:has(#tab-amb:not([hidden])) .wrap>#prDashboard';
const selectors=[scope,scope+' :is(.prDashTop,.prNow,.prDashActions,.prMetric)',scope+' :is(.prDashTitle,.prMetric b,.prNowText b,.prPerfBtn,.prSearchBtn)',scope+' :is(.prEyebrow,.prMetric small,.prNowText small,.prKeyHint,.prState:not(.on))',scope];
const rules=[...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({selector:m[1].trim(),body:m[2].trim()}));
const result=[];function test(name,fn){try{fn();result.push({name,passed:true})}catch(e){result.push({name,passed:false,error:e.message})}}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test('Identical index and nero entry points',()=>assert.equal(html,fs.readFileSync(path.join(root,'nero.html'),'utf8')));
test('Exactly one new personal-centre owner',()=>assert.equal(html.split('id="'+marker+'"').length-1,1));
test('Uses the existing controls layer after r1029 paint and before legacy contracts',()=>{assert.match(clean,/^\s*@layer sukun-r933-controls\s*\{/);assert.equal((clean.match(/@layer/g)||[]).length,1);assert(html.indexOf('id="sukun-r1029-surface-clarity"')<full.index);assert(full.index<html.indexOf('id="sukun-r920-contract"'))});
test('Only five explicitly panel-owned paint rules',()=>assert.deepEqual(rules.map(x=>x.selector),selectors));
test('Every selector requires the visible Ambiyans tab and direct dashboard child',()=>{for(const rule of rules)assert(rule.selector.startsWith(scope))});
test('No blanket card, scene, introduction, wheel, player or other panel selector',()=>assert(!/\.card\b|#(?:todayCard|vakitBox|tk|ns|r717Scene|r170Now|r924WheelFrame)\b|#tab-zkr|intro/i.test(clean)));
test('Only background, border colour, shadow and text colour can change',()=>{const allowed=new Set(['background','border-color','box-shadow','color']);for(const rule of rules)for(const d of rule.body.split(';').filter(x=>x.trim())){assert(allowed.has(d.split(':')[0].trim()),d);assert(d.trim().endsWith('!important'),d)}});
test('No layout, visibility, animation, pointer, filter, opacity or font mutation',()=>assert(!/(?:^|[;{])\s*(?:display|position|width|height|margin|padding|overflow|contain|transform|animation|transition|z-index|pointer-events|touch-action|opacity|filter|backdrop-filter|-webkit-backdrop-filter|font[^:]*|border-width|border-style)\s*:/m.test(clean)));
test('Outer panel uses a single modest translucent gradient',()=>assert.match(rules[0].body,/background:linear-gradient\(160deg,#071c268a,#04121c73\)!important;/));
test('Outer tint keeps 45–55% of scene light visible',()=>{for(const alpha of [0x8a/255,0x73/255]){assert(alpha>.44&&alpha<.55);assert(1-alpha>.45)}});
test('Existing border thickness is retained with a more visible 42% tint',()=>{assert.match(rules[0].body,/border-color:#badbd26b!important;/);assert(0x6b/255>.4);assert(!/border(?:-width|-style)?:/.test(clean))});
test('Reflection is static and inset, with no new overlay element',()=>{assert.match(rules[0].body,/inset 0 1px 0 #ffffff1a,inset 0 -1px 0 #03101926/);assert(!/::before|::after|content:|url\(|@import/.test(clean))});
test('Only the four dashboard text containers receive local scrims',()=>assert.match(rules[1].body,/^background:linear-gradient\(180deg,#05141d70,#030d1666\)!important;$/));
test('Muted text is explicit and active status keeps its state colour',()=>{assert.match(rules[3].body,/^color:#d8e4df!important;$/);assert(rules[3].selector.includes('.prState:not(.on)'));assert(!rules[2].selector.includes('.prState'))});
test('Reduced-transparency preference has a narrow near-opaque fallback',()=>assert.match(clean,/@media\(prefers-reduced-transparency:reduce\)\{\s*html body\.r716-shell:has\(#tab-amb:not\(\[hidden\]\)\) \.wrap>#prDashboard\{background:#071725f5!important\}/));
const oldPaint=html.match(/<style id="sukun-r1029-surface-clarity">([\s\S]*?)<\/style>/)?.[1];
test('r1029 no-blur dashboard contract remains present',()=>assert.match(oldPaint,/\.wrap>:is\(#todayCard,#prDashboard,#vakitBox\)\{\s*backdrop-filter:none!important;-webkit-backdrop-filter:none!important;/));
test('The labelled panel remains owned by dashCreate with original native controls',()=>{assert.match(html,/function dashCreate\(\)[\s\S]*?d\.id='prDashboard';d\.innerHTML=`<div class="prDashTop"><div><div class="prEyebrow">KİŞİSEL MERKEZ<\/div><div class="prDashTitle">Bugünkü Sükûn<\/div>/);for(const id of ['prPerfBtn','prState','prDz','prDm','prDf','prDNow','prDGo','prSearchOpen'])assert(html.includes('id="'+id+'"'))});
test('Simple and Focus dashboard visibility rules remain owned by existing CSS',()=>{assert.match(html,/body\.sukun-focus-mode #prDashboard,/);assert.match(html,/body\.r616-ui \.wrap > #prDashboard,/);assert(!/display:|visibility:|max-height:|opacity:/.test(clean))});
const rgb=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);
const lum=c=>c.reduce((s,v,i)=>s+(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*[.2126,.7152,.0722][i],0);
const over=(h,bg)=>{const a=parseInt(h.slice(6),16)/255;return rgb(h).map((v,i)=>v*a+bg[i]*(1-a))};
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const contrastResults=[];
for(const [name,fg] of [['Small dashboard labels','d8e4df'],['Headings, values and control text','f4ead1']])test(name+' exceed 4.5:1 on a white scene',()=>{
 const ratios=[];
 for(const outer of ['071c268a','04121c73'])for(const inner of ['05141d70','030d1666']){
  let bg=over(outer,[1,1,1]);
  // Conservatively allow a 4% white reflection over the outer panel, above
  // the inherited r747/r780 pseudo-element highlight's maximum contribution.
  bg=bg.map(v=>v*.96+.04);bg=over(inner,bg);ratios.push(ratio(rgb(fg),bg));
 }
 const minimum=Math.min(...ratios);contrastResults.push({name,minimum:+minimum.toFixed(3)});assert(minimum>=4.5,String(minimum));
});
test('Reduced-transparency fallback exceeds 4.5:1 without relying on inner scrims',()=>assert(ratio(rgb('d8e4df'),over('071725f5',[1,1,1]))>=4.5));
if(baseline){
 for(const filename of ['index.html','nero.html'])test(filename+': removing only the new style restores every original byte',()=>assert.equal(html.replace(full[0],''),fs.readFileSync(path.join(baseline,filename),'utf8')));
 test('All runtime CSS and JavaScript files are byte-identical to r1030',()=>{const dir='assets/runtime';for(const file of fs.readdirSync(path.join(baseline,dir))){const rel=path.join(dir,file);if(fs.statSync(path.join(baseline,rel)).isFile())assert.equal(sha(fs.readFileSync(path.join(root,rel))),sha(fs.readFileSync(path.join(baseline,rel))),rel)}});
}
const report={total:result.length,passed:result.filter(x=>x.passed).length,failed:result.filter(x=>!x.passed).length,scope:'Source, selector/property ownership, optional complete baseline byte comparison, and conservative sRGB compositing. Not live CSSOM, mobile rendering, hit-testing or physical Android validation.',contrastResults,results:result};
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
