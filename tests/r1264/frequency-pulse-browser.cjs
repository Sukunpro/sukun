'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture} = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const output = process.argv[3];
const report = {build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(), profiles:[]};
const toggle = '#frequencyPulseToggle', glow = '#frequencyPulseGlow', status = '#frequencyPulseStatus';

async function clickLight(page, selector, consent) {
  const destination = page.locator(selector);
  assert(await destination.isVisible(), selector+' should be visible');
  const handled = page.waitForEvent('dialog', {timeout:12000}).then(async dialog => {
    assert.equal(dialog.type(), 'confirm');
    if (consent) await dialog.accept();
    else await dialog.dismiss();
    return dialog.message();
  });
  const [,message] = await Promise.all([destination.click({timeout:15000}), handled]);
  assert(message.trim().length > 12);
}

async function ready(page) {
  await page.evaluate(() => {window.obClose?.(); document.getElementById('dcClose')?.click();});
  await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
  await page.locator('.tab[data-t="frq"]').click();
  await page.locator(toggle).waitFor({state:'visible'});
}

// Sample real browser style against a monotonic clock, independently of the
// feature's advertised rate. Upward midpoints measure whole periods without
// assuming a particular waveform, phase or frame cadence.
async function measure(page, hz) {
  await page.waitForFunction(({glow,hz}) => {
    const layer = document.querySelector(glow);
    return !!layer && !layer.hidden && Math.abs(Number(layer.dataset.rateHz)-hz)<.002;
  }, {glow,hz});
  const samples = await page.evaluate(async ({glow, duration}) => {
    const el = document.querySelector(glow);
    const end = performance.now()+duration;
    const values = [];
    do {
      values.push([performance.now(),Number(getComputedStyle(el).opacity)]);
      await new Promise(resolve => setTimeout(resolve,37));
    } while (performance.now()<end);
    return values;
  }, {glow,duration:4200/hz});
  const values = samples.map(row=>row[1]);
  const min=Math.min(...values), max=Math.max(...values);
  assert(max-min>.003, 'No visible opacity motion: '+JSON.stringify({min,max}));
  const mid=(max+min)/2, crossings=[];
  for (let i=1;i<samples.length;i++) {
    const [t0,v0]=samples[i-1], [t1,v1]=samples[i];
    if (v0<=mid && v1>mid) crossings.push(t0+(mid-v0)*(t1-t0)/(v1-v0));
  }
  assert(crossings.length>=3, 'Fewer than three measured cycles: '+JSON.stringify({min,max,crossings}));
  const periods = crossings.slice(1).map((t,i)=>t-crossings[i]);
  // Allow the compositor to skip a frame or occasionally an entire traversal.
  const sorted = periods.slice().sort((a,b)=>a-b);
  const median = sorted[Math.floor((sorted.length-1)/2)];
  assert(periods.every(p=>p>=875), 'An accelerated light cycle was observed: '+JSON.stringify(periods));
  assert(Math.abs(1000/median-hz)<.12, 'Unexpected measured frequency: '+JSON.stringify({hz,periods,min,max}));
  return {hz, periodMs:Math.round(median), min, max, samples:samples.length};
}

// Verify compositing as well as the animated DOM value. Compare identical edge
// strips at natural bright/dim times and with only the halo optically suppressed.
async function renderedEdges(page, range) {
  async function captureAt(bright) {
    await page.waitForFunction(({selector,bright,limit}) => {
      const value=Number(getComputedStyle(document.querySelector(selector)).opacity);
      return bright ? value>=limit : value<=limit;
    }, {selector:glow,bright,limit:range.min+(range.max-range.min)*(bright ? .9 : .1)});
    return (await page.screenshot({type:'png'})).toString('base64');
  }
  const bright=await captureAt(true);
  const layer=page.locator(glow);
  const previous=await layer.evaluate(el=>{const prev=el.style.visibility;el.style.visibility='hidden';return prev;});
  let hidden;
  try { hidden=(await page.screenshot({type:'png'})).toString('base64'); }
  finally { await layer.evaluate((el,prev)=>{el.style.visibility=prev;},previous); }
  const dim=await captureAt(false);
  const edges=await page.evaluate(async ({bright,dim,hidden,selector})=>{
    const el=document.querySelector(selector), box=el.getBoundingClientRect();
    const before=getComputedStyle(el,'::before');
    const px=(value,total)=>value.endsWith('%')?parseFloat(value)*total/100:parseFloat(value);
    const y=Math.round(box.top+px(before.top,box.height)+px(before.height,box.height)/2)-9;
    async function strips(content) {
      const image=new Image();image.src='data:image/png;base64,'+content;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      // Ignore the outermost column and include a small central control strip.
      return [2,Math.round(innerWidth/2)-4,innerWidth-10].map(x=>ctx.getImageData(x,y,8,18).data);
    }
    const [b,d,h]=await Promise.all([strips(bright),strips(dim),strips(hidden)]);
    const delta=(a,b)=>{
      const values=[];
      for(let i=0;i<a.length;i+=4)values.push((Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3);
      values.sort((a,b)=>a-b);return Math.round(values[Math.floor(values.length/2)]*10)/10;
    };
    return b.map((value,i)=>({brightDim:delta(value,d[i]),brightHidden:delta(value,h[i]),dimHidden:delta(d[i],h[i])}));
  },{bright,dim,hidden,selector:glow});
  for(const edge of [edges[0],edges[2]]){
    assert(edge.brightHidden>3 && edge.brightDim>2 && edge.brightHidden>edge.dimHidden+1,
      'The edge glow is occluded or visually unchanged: '+JSON.stringify(edges));
  }
  return {left:edges[0],center:edges[1],right:edges[2]};
}

async function chooseReference(page) {
  const group='#presets [data-acc="diapason"]';
  if (!await page.locator('#r1107PresetsBox').evaluate(e=>e.open)) await page.locator('#r1107PresetsSummary').click();
  await page.locator('#preFilter [data-f="diapason"]').click();
  if (!await page.locator(group).evaluate(e=>e.classList.contains('open'))) await page.locator(group+' [data-acctgl]').click();
  const index = await page.evaluate(()=>FREQ_PRESETS.findIndex(p=>p.id==='fork1361'));
  assert(index>=0);
  await page.locator(group+' [data-p="'+index+'"]').click();
  await page.waitForFunction(()=> FR.playing && FR.b===0 && FR.oL && Math.abs(FR.oL.frequency.value-136.1)<.01);
}

async function simulateVisibility(page, hidden) {
  await page.evaluate(hidden=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>hidden?'hidden':'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  },hidden);
}

async function idleLayer(page) {
  await page.waitForFunction(selector=>{
    const layer=document.querySelector(selector);
    return layer && (layer.hidden || getComputedStyle(layer).display==='none');
  },glow);
}

async function run(width,height) {
  const app=await fixture(root,{width,height,seed:{
    'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)
  }});
  const p=app.page, profile={width,height,cycles:[]};
  report.profiles.push(profile);
  try {
    if(width>1000) await p.goto(app.origin+'/index.html',{waitUntil:'load'});
    await p.emulateMedia({reducedMotion:'no-preference'});
    await ready(p);
    for(const density of ['mini','midi','pro']){
      await p.evaluate(mode=>applyUI(mode),density);
      assert(await p.locator(toggle).isVisible(), 'Missing rhythm control in '+density);
      assert(await p.locator('#aveTgl').isVisible(), 'Missing steady control in '+density);
    }
    await p.evaluate(()=>applyUI('midi'));
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    await idleLayer(p);
    await clickLight(p,toggle,false);
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    await idleLayer(p);
    await clickLight(p,'#aveTgl',true);
    const steady=await p.evaluate(async()=>{
      const e=document.getElementById('aveOv'), result=[];
      for(let i=0;i<6;i++){result.push({opacity:getComputedStyle(e).opacity,hidden:e.hidden});await new Promise(r=>setTimeout(r,70));}
      return result;
    });
    for(const v of steady){assert(!v.hidden && Number(v.opacity)>0);assert.equal(v.opacity,steady[0].opacity);}
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    await p.locator('#aveTgl').click();
    await chooseReference(p);
    await idleLayer(p);
    await p.evaluate(()=>{
      window.__r1264AudioProbe={nodes:[FR.oL,FR.oR], settings:SukunFrequencyR1120.capture(),
        frequencies:[FR.oL.frequency.value,FR.oR.frequency.value], master:document.getElementById('masterVol').value};
    });
    await p.waitForFunction(()=>{
      const mix=SukunBackgroundMix.snapshot();
      return mix.ready && mix.mutedLive && mix.playing && mix.currentSelectionPrepared;
    },null,{timeout:30000});
    await p.evaluate(()=>{const m=document.getElementById('masterVol');m.value='0';m.dispatchEvent(new Event('input',{bubbles:true}));});
    await p.waitForFunction(()=>document.getElementById('sukunBackgroundMixAudio').volume===0);
    await clickLight(p,toggle,true);
    await idleLayer(p);
    await p.evaluate(()=>{const m=document.getElementById('masterVol');m.value=window.__r1264AudioProbe.master;m.dispatchEvent(new Event('input',{bubbles:true}));});
    profile.cycles.push(await measure(p,.5));
    profile.renderedEdges=await renderedEdges(p,profile.cycles[0]);
    const audioUnchanged=await p.evaluate(()=>{
      const prev=window.__r1264AudioProbe;
      return FR.playing && FR.oL===prev.nodes[0] && FR.oR===prev.nodes[1] &&
        FR.oL.frequency.value===prev.frequencies[0] && FR.oR.frequency.value===prev.frequencies[1] &&
        JSON.stringify(SukunFrequencyR1120.capture())===JSON.stringify(prev.settings) &&
        document.getElementById('masterVol').value===prev.master;
    });
    assert(audioUnchanged, 'Opting into the visual changed an audio node or setting');
    assert((await p.locator(status).innerText()).trim().length>0);
    for(const [beat,hz] of [[.75,.75],[10,.625]]){
      const ok=await p.evaluate(beat=>SukunFrequencyR1120.applyBinauralPreset({c:212,b:beat},{play:true}).ok,beat);
      assert(ok);profile.cycles.push(await measure(p,hz));
      const channels=await p.evaluate(()=>[FR.oL.frequency.value,FR.oR.frequency.value]);
      assert(Math.abs(channels[0]-(212-beat/2))<.01 && Math.abs(channels[1]-(212+beat/2))<.01);
    }
    await simulateVisibility(p,true);
    await idleLayer(p);
    await simulateVisibility(p,false);
    await p.waitForFunction(s=>!document.querySelector(s).hidden,glow);
    await p.locator('#r588Play').click();
    await idleLayer(p);
    await p.locator('#r588Play').click();
    await p.waitForFunction(s=>!document.querySelector(s).hidden,glow);
    await p.locator('#frToggle').evaluate(e=>e.click());
    await p.waitForFunction(()=>!FR.playing);
    await idleLayer(p);
    await p.locator('#frToggle').evaluate(e=>e.click());
    await p.waitForFunction(s=>!document.querySelector(s).hidden,glow);
    await p.emulateMedia({reducedMotion:'reduce'});
    await idleLayer(p);
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    assert(await p.locator(toggle).isDisabled());
    await p.emulateMedia({reducedMotion:'no-preference'});
    await p.waitForFunction(s=>!document.querySelector(s).disabled,toggle);
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    await clickLight(p,toggle,true);
    await p.waitForFunction(s=>!document.querySelector(s).hidden,glow);
    await p.reload({waitUntil:'load'});
    await ready(p);
    await idleLayer(p);
    assert.equal(await p.locator(toggle).getAttribute('aria-pressed'),'false');
    assert.deepEqual(app.errors,[]);
    profile.passed=true;
  } finally {await app.close();}
}

(async()=>{
  try {await run(390,844);await run(1280,900);report.passed=true;}
  catch(error){report.passed=false;report.error=error.stack;process.exitCode=1;}
  finally{
    if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
    console.log(JSON.stringify(report,null,2));
  }
})();
