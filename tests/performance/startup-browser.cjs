'use strict';
// Measurements, not a mobile performance certification. Serve exact source bytes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {
  chromium}
=require('playwright');
const root=path.resolve(process.argv[2]||'.'),output=process.argv[3];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashes=Object.fromEntries(['index.html','nero.html','sw.js','version.txt',...fs.readdirSync(path.join(root,'assets/runtime')).filter(n=>n.endsWith('.js')).map(n=>'assets/runtime/'+n)].map(name=>[name,sha(fs.readFileSync(path.join(root,name)))]));
if(!output)throw Error('Usage: node startup-browser.cjs SOURCE OUTPUT.json');
const mime={
  '.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg'}
;
(async()=>{
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(err,data)=>{
      if(err)return res.writeHead(404).end();
      res.writeHead(200,{
        'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}
      );
      res.end(data)}
    )}
  );
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  const report={
    sourceHashes,testSha256:sha(fs.readFileSync(__filename)),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex'),build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt:new Date().toISOString(),runs:[],limitations:['Native headless Linux Chromium; no CPU/network throttling; loopback uncompressed HTTP; not production network or physical mobile timings.','Fresh browser contexts; service worker blocked to isolate startup. External URLs blocked. No transport/audio/TTS APIs replaced.','First interaction measures real click to next two animation frames after load and a 1-second settle; not INP. Resource bytes include completed observed resources only.']}
  ;
  try{
    browser=await chromium.launch({
      executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']}
    );
    report.browser=browser.version();
    for(let n=0;
    n<3;
    n++){
      const ctx=await browser.newContext({
        viewport:{
          width:390,height:844}
        ,serviceWorkers:'block',locale:'tr-TR'}
      );
      const origin='http://127.0.0.1:'+server.address().port;
      await ctx.route('**/*',r=>r.request().url().startsWith(origin)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
      await ctx.addInitScript(()=>{
        window.__perfTasks=[];
        new PerformanceObserver(l=>window.__perfTasks.push(...l.getEntries().map(e=>({
          start:e.startTime,duration:e.duration,name:e.name}
        )))).observe({
          type:'longtask',buffered:true}
        );
      }
      );
      const p=await ctx.newPage();
      const errors=[];
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(origin+'/index.html',{
        waitUntil:'load',timeout:120000}
      );
      await p.waitForTimeout(1000);
      const row=await p.evaluate(()=>{
        const nav=performance.getEntriesByType('navigation')[0];
        const rs=performance.getEntriesByType('resource');
        return{
          navigation:nav.toJSON(),resources:rs.map(r=>({
            url:new URL(r.name).pathname,initiator:r.initiatorType,start:r.startTime,duration:r.duration,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize}
          )),longTasks:window.__perfTasks.slice(),imageCount:document.images.length,visibleImages:[...document.images].filter(i=>{
            let b=i.getBoundingClientRect();
            return b.width&&b.height&&b.bottom>0&&b.top<innerHeight}
          ).length}
      }
      );
      const control=p.locator('#obSkip');
      if(await control.isVisible()){
        await p.evaluate(()=>{
          document.querySelector('#obSkip').addEventListener('click',()=>{
            window.__interactionStart=performance.now();
            requestAnimationFrame(()=>requestAnimationFrame(()=>{
              window.__interactionEnd=performance.now()}
            ))}
          ,{
            once:true}
          )}
        );
        await control.click();
        await p.waitForFunction(()=>window.__interactionEnd);
        row.firstInteraction=await p.evaluate(()=>({
          control:'#obSkip',clickToTwoFramesMs:window.__interactionEnd-window.__interactionStart}
        ));
      }
      else row.firstInteraction={
        notRun:'Onboarding skip not visible'}
      ;
      row.errors=errors;
      report.runs.push(row);
      await ctx.close();
    }
    report.sourceUnchanged=Object.entries(sourceHashes).every(([name,hash])=>sha(fs.readFileSync(path.join(root,name)))===hash);
    report.runtimeErrorCount=report.runs.reduce((sum,row)=>sum+row.errors.length,0);
    report.finishedAt=new Date().toISOString();
    fs.mkdirSync(path.dirname(output),{
      recursive:true}
    );
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report.runs.map(r=>({
      DCL:r.navigation.domContentLoadedEventEnd,load:r.navigation.loadEventEnd,longTasks:r.longTasks.length,longTaskMs:r.longTasks.reduce((a,b)=>a+b.duration,0),transfer:r.navigation.transferSize+r.resources.reduce((a,b)=>a+b.transfer,0),decoded:r.navigation.decodedBodySize+r.resources.reduce((a,b)=>a+b.decoded,0),firstInteraction:r.firstInteraction,errors:r.errors}
    )),null,2));
  }
  catch(error){
    report.fatal=error.stack||String(error);
    fs.mkdirSync(path.dirname(output),{
      recursive:true}
    );
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    throw error;
  }
  finally{
    if(browser)await browser.close();
    await new Promise(r=>server.close(r))}
}
)().catch(e=>{
  console.error(e);
  process.exitCode=1}
);
