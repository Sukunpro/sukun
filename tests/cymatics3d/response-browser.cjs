// Native Web Audio + production cymatics measurement. Muted isolated fixture;
// digital signal verification, not full-application or speaker/plate physics.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),output=path.resolve(process.argv[3]||'/tmp/cymatics-signal-native.json');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),level=html.slice(html.indexOf('function cymLiveLevel(){'),html.indexOf('function cymModesFor('));
const report={suite:'Native stereo RMS fixture',expectedChecks:38,browserExecuted:false,checks:[],sourceSha256:hash(html),testSha256:hash(fs.readFileSync(__filename)),limitations:['Isolated native Web Audio graph, not full application. No physical speaker, microphone or plate measurement.']};
function save(){report.total=report.checks.length;report.passed=report.checks.filter(row=>row.passed).length;report.allPassed=report.browserExecuted&&report.total===report.expectedChecks&&report.passed===report.expectedChecks&&report.sourceUnchanged===true&&report.testUnchanged===true&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
(async()=>{
 let browser;
 const ok=(v,name,evidence)=>{report.checks.push({name,passed:!!v,evidence});assert(v,name);};
 try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']});report.browserExecuted=true;report.browser=browser.version();
 const page=await browser.newPage();await page.goto('about:blank');
 await page.evaluate(async()=>{
  window.CYM={};window.NS={ctx:new AudioContext()};await NS.ctx.resume();
  NS.analyser=NS.ctx.createAnalyser();NS.analyser.fftSize=8192;
  NS.cymAnalysers=[NS.ctx.createAnalyser(),NS.ctx.createAnalyser()];NS.cymAnalysers.forEach(an=>an.fftSize=8192);
  const splitter=NS.ctx.createChannelSplitter(2),merger=NS.ctx.createChannelMerger(2);
  window.osc=NS.ctx.createOscillator();window.left=NS.ctx.createGain();window.right=NS.ctx.createGain();left.gain.value=.001;right.gain.value=-.001;
  osc.connect(left);osc.connect(right);left.connect(merger,0,0);right.connect(merger,0,1);merger.connect(NS.analyser);merger.connect(splitter);
  splitter.connect(NS.cymAnalysers[0],0);splitter.connect(NS.cymAnalysers[1],1);
  const mute=NS.ctx.createGain();mute.gain.value=0;merger.connect(mute);mute.connect(NS.ctx.destination);osc.start();
 });
 await page.addScriptTag({content:level});
 for(const hz of [20,120,219,220,252,396,438,528,639,715,852,963,2000,3000,6000,12000,18000]){
  await page.evaluate(hz=>{osc.frequency.value=hz;},hz);await page.waitForTimeout(350);
  const result=await page.evaluate(()=>{const a=new Float32Array(NS.analyser.fftSize);NS.analyser.getFloatTimeDomainData(a);return {rms:cymLiveLevel(),monoPeak:Math.max(...a.map(Math.abs)),sampleRate:NS.ctx.sampleRate};});
  ok(result.rms>.0006&&result.rms<.0008,`quiet opposite-phase ${hz} Hz remains visible`,result);
  ok(result.monoPeak<.00005,`the same ${hz} Hz mono cancellation does not hide stereo power`,result);
 }
 await page.evaluate(()=>{left.gain.value=0;right.gain.value=0;});await page.waitForTimeout(350);ok(await page.evaluate(()=>cymLiveLevel())===0,'muted real graph gives zero motion');
 await page.evaluate(()=>{left.gain.value=.01;right.gain.value=.01;});await page.waitForTimeout(350);const quiet=await page.evaluate(()=>cymLiveLevel());
 await page.evaluate(()=>{left.gain.value=.05;right.gain.value=.05;});await page.waitForTimeout(350);const louder=await page.evaluate(()=>cymLiveLevel());ok(louder>quiet*4.8&&louder<quiet*5.2,'measured RMS follows native gain changes',{quiet,louder});
 await page.evaluate(()=>NS.ctx.suspend());ok(await page.evaluate(()=>cymLiveLevel())===0,'suspension clears stale analyser samples');
 await page.evaluate(async()=>{await NS.ctx.resume();left.gain.value=0;right.gain.value=0;});await page.waitForTimeout(350);ok(await page.evaluate(()=>cymLiveLevel())===0,'resume while muted remains still');
 }catch(error){report.fatal=error.stack||String(error);console.error(error);}
 finally{
  if(browser)try{await browser.close();}catch(error){report.fatal=(report.fatal||'')+'\nCleanup failed: '+String(error);}
  report.sourceUnchanged=report.sourceSha256===hash(fs.readFileSync(path.join(root,'index.html')));report.testUnchanged=report.testSha256===hash(fs.readFileSync(__filename));save();
  console.log(JSON.stringify({output,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1;
 }
})();
