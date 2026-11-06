const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..');
const c={console,window:null,document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelectorAll(){return[]}},addEventListener(){},dispatchEvent(){},CustomEvent:function(){},MINI:{paused:false},saveSettings(){},stopJourney(){},frCancelPendingStart(){},syncFreqUI(){},FR:{c:180,b:7.83,mode:'bin',vol:.5,pink:false,harmonik:0,harmSeri:'dogal',uzam:false,uzamHiz:22,wave:'sine',balL:1,balR:1,noise:'off',noiseVol:0,filterOn:false,lpf:2000,hpf:80,levelProfile:'legacy',fm:false,am:false,rm:false,pwm:false},FR2:{on:false,c:180,b:7.83}};c.window=c;vm.createContext(c);
for(const f of ['frequency-workbench-r1120.js','frequency-sets-r1120.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime',f),'utf8'),c);
let checks=0;const ok=(v,msg)=>{assert(v,msg);checks++};
const bridge=c.SukunFrequencyR1120,sets=c.SukunFrequencySetsR1120,legacy=bridge.capture();for(const k of ['fm','am','rm','pwm'])delete legacy[k];
ok(sets.validateSettings(legacy).ok,'legacy sets accepted');
for(const k of ['fm','am','rm','pwm']){ok(sets.validateSettings(legacy).value[k]===false,'legacy default off '+k);const next={...legacy,wave:'square',[k]:true};ok(sets.validateSettings(next).value[k]===true,'new effect preserved '+k);ok(!sets.validateSettings({...next,[k]:'true'}).ok,'invalid effect rejected '+k);}
c.FR.fm=true;ok(bridge.apply(legacy).ok&&!c.FR.fm,'old set clears active effect');
ok(!bridge.apply({...legacy,fm:1}).ok,'invalid apply rejected');
ok(!bridge.validate({...legacy,wave:'triangle',pwm:true}).pwm,'non-square PWM normalized off');
ok(bridge.validate({...legacy,wave:'square',pwm:true}).pwm,'square PWM retained');
ok(!sets.validateSettings({...legacy,futureEffect:true}).ok,'future fields still protected');
console.log(JSON.stringify({passed:checks,scope:'Controlled production settings validation; no browser or device audio'}));
