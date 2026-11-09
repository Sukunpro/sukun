'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const read=n=>fs.readFileSync(path.join(root,n),'utf8'),html=read('index.html'),css=read('css/visual-polish-r1232.css');
const repair=css.slice(css.indexOf('/* Frequency screenshot repair:'),css.indexOf('/* Supplementary Klasik')),checks=[];
function check(name,fn){try{fn();checks.push({name,passed:true})}catch(e){checks.push({name,passed:false,error:e.message})}}
check('The repair uses the existing early important layer',()=>assert(repair.includes('@layer sukun-r1232-polish')));
check('All new presentation selectors require the canonical Berhet theme',()=>{for(const line of repair.split('\n').filter(l=>/^\s*html/.test(l)))assert(line.includes('html[data-r1074-theme="berhet"]'),line)});
check('Responsive cards use available container space, not a desktop-only breakpoint',()=>assert(repair.includes('repeat(auto-fit,minmax(min(100%,230px),1fr))')));
check('Long card text grows, wraps and is centered',()=>assert(['height:auto!important;max-height:none','padding:20px 38px','align-items:center','justify-content:center','text-align:center','white-space:normal','overflow-wrap:break-word'].every(s=>repair.includes(s))));
check('Card padding stays inside the fixed 14px/34px gemstone frame',()=>assert(repair.includes('padding:20px 38px')&&repair.includes('210 540 fill / 14px 34px / 0 stretch')));
check('Library source badges stay in flow with no right-edge positioning',()=>assert(repair.includes(':is(.libSrc,.libJT)')&&repair.includes('position:static!important;float:none')&&repair.includes('margin:3px 4px')));
check('Native selects keep paired labels, option values and identifiers',()=>{for(const id of ['signalView','signalWindow'])assert(html.includes('<div class="frequency-select-field"><label for="'+id+'"'));assert.equal((html.match(/class="frequency-select-controls"/g)||[]).length,1);assert(html.includes('<select id="signalWindow" hidden'));assert(html.includes('<option value="waveform">'));assert(!html.includes('id="cymView"')&&!html.includes('id="cymQuality"'))});
check('Hidden signal controls remain hidden as a whole field',()=>assert(repair.includes('.frequency-select-field:has(>select[hidden]) {display:none!important}')));
check('Native selected values are centered within reserved endcaps',()=>assert(['text-align-last:center','padding:12px 30px','border-image-width:10px 24px'].every(s=>repair.includes(s))));
check('Short frequency choices use square sapphire/emerald states',()=>assert(repair.includes('.frequencyShortcut[aria-pressed="true"]')&&repair.includes('var(--sukun-gem-sapphire-square) 330 fill / 9px')&&repair.includes('border-image-source:var(--sukun-gem-emerald-square)')));
check('Routine labels wrap with separate 44px delete targets',()=>assert(repair.includes('#rutRow {flex-wrap:wrap')&&repair.includes('#rutRow>.rut>.rx {flex:0 0 44px')&&repair.includes('overflow-wrap:anywhere')));
check('Forced-colors uses system surfaces and selected/focus outline',()=>assert(repair.includes('@media(forced-colors:active)')&&repair.includes('border-image:none!important;background:ButtonFace')&&repair.includes('outline:2px solid Highlight')));
check('Guided keyboard activation calls the existing owner once per activation',()=>{
 const source=html.slice(html.indexOf('function initMeditation()'),html.indexOf('function populateVoiceList()'));
 const cards=[],events=[],nodes=new Map();
 const node=()=>({focus(){},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},appendChild(c){cards.push(c)}});
 const context={document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node},window:{},MED_SCRIPTS:[{name:'Test',icon:'',meta:'',desc:''}],openMedScript:i=>events.push(i),toggleMedPlay(){},closeMedScript(){},populateVoiceList(){}};
 vm.runInNewContext(source+';initMeditation()',context);assert.equal(cards.length,1);const c=cards[0];assert.equal(c.attrs.role,'button');assert.equal(c.tabIndex,0);
 for(const key of ['Enter',' ','ArrowDown']){let prevented=0;c.onkeydown({key,preventDefault(){prevented++}});assert.equal(prevented,key==='ArrowDown'?0:1)}c.onclick();assert.deepEqual(events,[0,0,0]);
});
check('Both entrypoints match and stylesheet SRI is exact',()=>{assert.equal(html,read('nero.html'));assert(html.includes('integrity="sha256-'+crypto.createHash('sha256').update(css).digest('base64')+'"'))});
console.log(JSON.stringify({scope:'Source and controlled guided-card input contracts; browser geometry acceptance is separate.',passed:checks.filter(c=>c.passed).length,total:checks.length,checks},null,2));
if(checks.some(c=>!c.passed))process.exitCode=1;
