'use strict';
// Independent browser smoke test. Main app scripts are intentionally removed
// in the test server response to model broken main JS without personal data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const broken=html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,(whole,attrs)=>attrs.includes('recovery-entry-r1027.js')?whole:'').replace(/<link\b[^>]*>/gi,'');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'||url.pathname==='/index.html'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(broken);}
 const target=path.join(root,url.pathname);
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(target));
});
const checks=[];async function check(name,fn){await fn();checks.push(name);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();
  await check('Real Chromium: no legacy tap curtain or tap label with all app scripts broken',async()=>{await page.goto(origin+'/index.html');assert.equal(await page.locator('#acilisPerde,#apDokun,#acilisTgl').count(),0);await page.locator('[data-sukun-recovery-title]').waitFor({state:'visible'});assert.equal(await page.locator('#sukun-rescue-link').isVisible(),true);assert.equal(await page.locator('#sukun-heart-intention #sukun-rescue-link').count(),1);});
  await check('CSS watchdog removes automatic logo even when all intro/main scripts are missing',async()=>{await page.waitForTimeout(1400);assert.equal(await page.locator('#sukun-auto-intro').evaluate(el=>getComputedStyle(el).visibility),'hidden');});
  await check('Keyboard focus stays in intention row; Enter opens independent page',async()=>{await page.locator('#sukun-rescue-link').focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'sukun-rescue-link');const box=await page.locator('#sukun-rescue-link').boundingBox();assert(box.width>=44&&box.height>=44);await page.keyboard.press('Enter');await page.waitForURL('**/rescue.html?lang=tr');assert.equal(await page.locator('[data-language=tr]').isVisible(),true);assert.equal(await page.locator('#worker-tr').isVisible(),false);});
  await check('Static rescue is usable with no controlling worker and no main script',async()=>{assert.match(await page.locator('#status-tr').textContent(),/etkin bir SÜKÛN/);assert.equal(await page.locator('[data-language=tr] a[href="./index.html"]').count(),1);assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller),null);});
  await check('Language link shows English without main app code',async()=>{await page.getByRole('link',{name:'English',exact:true}).click();await page.waitForURL('**/rescue.html?lang=en');assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.getByRole('heading',{name:'SÜKÛN · Recovery'}).isVisible(),true);assert.equal(await page.locator('[data-language=tr]').isVisible(),false);});
  await check('Short real mouse click does not navigate or activate recovery',async()=>{await page.goto(origin+'/index.html');await page.locator('[data-sukun-recovery-title]').click();assert.equal(page.url(),origin+'/index.html');});
  await check('Long real mouse press and release opens rescue despite broken main JS',async()=>{const b=await page.locator('[data-sukun-recovery-title]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(1300);assert.equal(page.url(),origin+'/index.html');await page.mouse.up();await page.waitForURL('**/rescue.html?lang=tr');});
  await check('Scrolling cancels a real held pointer',async()=>{await page.goto(origin+'/index.html');const b=await page.locator('[data-sukun-recovery-title]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.evaluate(()=>window.scrollTo(0,300));await page.waitForTimeout(1300);await page.mouse.up();assert.equal(page.url(),origin+'/index.html');});
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const native=await noJS.newPage();
  await check('JavaScript disabled: bilingual static page and app links remain available',async()=>{await native.goto(origin+'/rescue.html');assert(await native.getByRole('heading',{name:'SÜKÛN · Kurtarma'}).isVisible());assert(await native.getByRole('heading',{name:'SÜKÛN · Recovery'}).isVisible());assert.equal(await native.locator('a[href="./index.html"]').count(),2);assert.equal(await native.locator('#worker-tr').isVisible(),false);});
  await check('JavaScript disabled: keyboard fallback opens rescue from app HTML',async()=>{await native.goto(origin+'/index.html');await native.locator('#sukun-rescue-link').focus();await native.keyboard.press('Enter');await native.waitForURL('**/rescue.html');});
  await noJS.close();await context.close();
  console.log(JSON.stringify({total:checks.length,passed:checks.length,checks,scope:'Cloud headless Chromium, 390x844, isolated local test server and broken-main-script fixture. No phone, actual playback or real user data tested.'},null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
