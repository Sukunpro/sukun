'use strict';
// Production UI, disposable profile, mobile Chromium; screenshots supplement
// geometry checks against the actual border-image width, not just the box.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const dir=path.resolve(process.argv[3]||'/tmp/r1149-backup');fs.mkdirSync(dir,{recursive:true});
const results=[];let f;
function save(){fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({results,passed:results.filter(r=>r.passed).length,total:results.length,limitations:['Headless Chromium at mobile viewports; not a physical phone or OS font scaling test.','Screenshots require visual inspection.']},null,2)+'\n')}
async function tap(p,s){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(s).first().click();await p.waitForTimeout(150)}
async function inspect(p,selector){return p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{
 const r=n.getBoundingClientRect(),s=getComputedStyle(n),tokens=(s.borderImageWidth.match(/(?:min|max|clamp)\([^)]*\)|[^\s]+/g)||[]);
 function inset(v,side){const basis=/top|bottom/.test(side)?r.height:r.width;const f=x=>{x=x.trim();if(x.endsWith('%'))return parseFloat(x)*basis/100;if(x.endsWith('px'))return parseFloat(x);return (parseFloat(x)||0)*(parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0)};if(v?.startsWith('min('))return Math.min(...v.slice(4,-1).split(',').map(f));if(v?.startsWith('max('))return Math.max(...v.slice(4,-1).split(',').map(f));return f(v||'0')}
 const insets={top:inset(tokens[0],'top'),right:inset(tokens[1]||tokens[0],'right'),bottom:inset(tokens[2]||tokens[0],'bottom'),left:inset(tokens[3]||tokens[1]||tokens[0],'left')};
 const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),lines=[];while(w.nextNode()){const t=w.currentNode,e=t.parentElement;if(!t.textContent.trim()||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden'||e.closest('[aria-hidden="true"],.ico'))continue;const range=document.createRange();range.selectNodeContents(t);for(const b of range.getClientRects())if(b.width>.5&&b.height>.5)lines.push({text:t.textContent.trim(),left:b.left-r.left,right:b.right-r.left,top:b.top-r.top,bottom:b.bottom-r.top})}
 return{id:n.id,text:n.textContent.trim().replace(/\s+/g,' '),rect:r.toJSON(),insets,lines,scroll:[n.scrollWidth,n.clientWidth,n.scrollHeight,n.clientHeight],disabled:n.disabled};
 }));}
function validate(rows,count,width){assert.equal(rows.length,count,'wrong visible count');for(const row of rows){const r=row.rect,i=row.insets;assert(r.left>=-1&&r.right<=width+1,'outside viewport '+JSON.stringify(row));assert(row.lines.length,'missing visible text '+JSON.stringify(row));assert(row.scroll[0]<=row.scroll[1]+1&&row.scroll[2]<=row.scroll[3]+1,'content clipped '+JSON.stringify(row));for(const t of row.lines)assert(t.left>=i.left-1&&t.right<=r.width-i.right+1&&t.top>=i.top-1&&t.bottom<=r.height-i.bottom+1,'text crosses decorated frame '+JSON.stringify({row,t}));}}
async function check(width,name,fn){try{results.push({width,name,passed:true,evidence:await fn()})}catch(e){results.push({width,name,passed:false,error:e.stack||String(e)})}save()}
(async()=>{try{for(const width of [360,393]){
 const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(fs.readFileSync(path.join(root,'version.txt'),'utf8').trim())};
 f=await fixture(root,{width,height:852,voices:'tr',seed});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState);if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('r1149-backup-disposable')),true);assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
 await p.evaluate(()=>{document.querySelector('#bakBox').open=true});await p.waitForTimeout(400);
 await check(width,'backup-summary',async()=>{const rows=await inspect(p,'#bakBox>summary');validate(rows,1,width);return rows});
 await check(width,'backup-buttons-and-layout',async()=>{const rows=await inspect(p,'#bakExportBtn,#bakSettingsExportBtn,#bakImportBtn');validate(rows,3,width);const [a,b,c]=rows;assert(Math.abs(a.rect.width-b.rect.width)<=1&&Math.abs(a.rect.height-b.rect.height)<=1,'download buttons not equal '+JSON.stringify(rows));assert(Math.abs(a.rect.top-b.rect.top)<=1&&c.rect.top>=a.rect.bottom-1,'unexpected rows '+JSON.stringify(rows));assert(c.rect.width>a.rect.width*1.7&&c.disabled,'restore must be full-width and disabled '+JSON.stringify(rows));return rows});
 await p.locator('#bakBox').screenshot({path:path.join(dir,`${width}-backup.png`),timeout:15000});await f.close();f=null;
 }}catch(e){results.push({name:'fatal',passed:false,error:e.stack||String(e)})}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,report:path.join(dir,'report.json')}));if(results.length!==4||results.some(r=>!r.passed))process.exitCode=1}})();
