// Independent no-browser review: run the actual quick-controls and layout code.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const app=path.resolve(process.argv[2]||path.join(__dirname,'../..')),base=path.resolve(process.argv[3]||app);
const results=[];function check(name,fn){fn();results.push(name)}
class Event {constructor(type,opts={}){this.type=type;this.bubbles=!!opts.bubbles;Object.assign(this,opts)}preventDefault(){this.defaultPrevented=true}stopPropagation(){this.stopped=true}}
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.childNodes=[];this.parentElement=null;this.dataset={};this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this._text='';this.value=''}
 get id(){return this.attrs.id||''}set id(v){this.attrs.id=v}get children(){return this.childNodes.filter(n=>n.tagName!=='#COMMENT')}
 get isConnected(){return this===document.root||!!this.parentElement?.isConnected}
 get nextElementSibling(){const list=this.parentElement?.children||[];return list[list.indexOf(this)+1]||null}
 get nextSibling(){const list=this.parentElement?.childNodes||[];return list[list.indexOf(this)+1]||null}
 append(...nodes){for(let n of nodes){if(typeof n==='string'){this._text+=n;continue}n.remove();this.childNodes.push(n);n.parentElement=this}}
 remove(){if(this.parentElement){this.parentElement.childNodes.splice(this.parentElement.childNodes.indexOf(this),1);this.parentElement=null}}
 insertBefore(n,b){assert(!b||b.parentElement===this);n.remove();this.childNodes.splice(b?this.childNodes.indexOf(b):this.childNodes.length,0,n);n.parentElement=this;return n}
 before(n){this.parentElement.insertBefore(n,this)}after(n){this.parentElement.insertBefore(n,this.nextSibling)}replaceWith(n){this.before(n);this.remove()}
 replaceChildren(...nodes){for(const n of [...this.childNodes])n.remove();this._text='';this.append(...nodes)}
 contains(n){return this===n||this.childNodes.some(c=>c.contains(n))}
 matches(q){if(q.startsWith('#'))return this.id===q.slice(1);if(q.startsWith('.'))return (this.attrs.class||'').split(' ').includes(q.slice(1));const m=q.match(/^([\w-]+)(?:\[([\w-]+)\])?$/);return !!m&&this.tagName===m[1].toUpperCase()&&(!m[2]||m[2] in this.attrs)}
 querySelector(q){for(const n of this.children){if(n.matches(q))return n;const found=n.querySelector(q);if(found)return found}return null}
 closest(q){return this.matches(q)?this:this.parentElement?.closest(q)||null}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='hidden')this.hidden=true;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v)}getAttribute(k){return this.attrs[k]??null}
 addEventListener(type,f){(this.listeners[type]??=[]).push(f)}
 dispatchEvent(e){e.target??=this;e.currentTarget=this;this['on'+e.type]?.call(this,e);for(const f of this.listeners[e.type]||[])f.call(this,e);if(e.bubbles&&!e.stopped)this.parentElement?.dispatchEvent(e);return !e.defaultPrevented}
 click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}))}
 focus(){document.activeElement=this}
 get textContent(){return this._text+this.childNodes.map(x=>x.textContent).join('')}set textContent(v){this.replaceChildren();this._text=String(v)}
 get innerHTML(){return this._html||this.textContent}set innerHTML(s){this.replaceChildren();this._html=s;const stack=[this];for(const part of s.match(/<[^>]+>|[^<]+/g)||[]){if(part.startsWith('</')){stack.pop();continue}if(part.startsWith('<')){const m=part.match(/^<([\w-]+)/);if(!m)continue;let node=new Element(m[1]);for(const a of part.slice(m[0].length,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(a[1],a[2]??'');stack.at(-1).append(node);if(!/\/$/.test(part.slice(0,-1))&&!['INPUT','IMG','BR','HR'].includes(node.tagName))stack.push(node)}else stack.at(-1)._text+=part}}
 get options(){return this.children.flatMap(n=>n.tagName==='OPTGROUP'?n.children:[n])}
 cloneNode(deep){const c=new Element(this.tagName);c.attrs={...this.attrs};c.dataset={...this.dataset};c.hidden=this.hidden;c._text=this._text;c.value=this.value;if(deep)c.append(...this.childNodes.map(n=>n.cloneNode(true)));return c}
}
const document={root:new Element('main'),activeElement:null,createElement:tag=>new Element(tag),createComment:()=>new Element('#comment'),getElementById(id){return this.root.querySelector('#'+id)}};
const root=document.createElement('section');root.id='r920Practice';document.root.append(root);
const add=(id,parent=root,tag='div',cls='')=>{const node=new Element(tag);node.id=id;if(cls)node.setAttribute('class',cls);parent.append(node);return node};
add('identity',root,'div','r920Identity');const frame=add('r924WheelFrame');const stats=add('stats',root,'div','r920Stats');add('r920Target',add('goal',stats,'span'),'b');const remaining=add('remaining',stats,'span');add('r920Remaining',remaining,'b');
add('nav',root,'div','r920Transport');for(const id of ['r920TefEnter','r920TefExit','r920Minus','r920Play','r920Plus','r920Stop'])add(id,root,'button');
for(const id of ['r968ManualHint','r920Phase','r920Actions','r920JourneySettings','r679ZikirAyarBox','r920ViewOptions','r920More'])add(id);
for(const id of ['r920WheelSelect','r920SceneSelect','r923EsmaSceneSelect']){let sel=add(id,root,'select');sel.innerHTML='<option value="auto">Automatic</option><option value="other">Other</option>'}
const $=id=>document.getElementById(id),sources={minus:'r920Minus',play:'r920Play',plus:'r920Plus',stop:'r920Stop'},calls={minus:0,play:0,plus:0,stop:0},state={activeMode:'esma',phase:'IDLE'};let allowed=true,refreshes=0;const commands=[];
const window={SukunSessionState:{peek:()=>state},SukunCountCorrection:{status:()=>({allowed,reason:allowed?'':'Cannot adjust now'})},SukunSceneEngine:{snapshot:()=>({scene:'auto',esmaChoice:'auto'})},SukunWheels:{snapshot:()=>({choices:{esma:'wheel',berhet:'wheel'}}),catalog:{esma:[{id:'wheel',title:'Emerald'}],berhet:[{id:'wheel',title:'Amethyst'}]},choose(){}},SukunPracticeUI:{refresh(){refreshes++}}};
// Execute native dispatch handlers from interface-r920.js. Only the final
// session/audio command boundary and its resulting state are mocked.
const command=(name,args)=>{commands.push({name,args});if(name==='adjust')calls[args.delta===1?'plus':'minus']++;else if(name==='stop'){calls.stop++;state.phase='IDLE'}else{calls.play++;state.phase=name==='pause'?'PAUSED':'PLAYING'}};
const context={document,window,Event,$,wake(){},snap:()=>state,command,manual:delta=>command('adjust',{delta})};vm.createContext(context);
const nativeSource=fs.readFileSync(base+'/assets/runtime/interface-r920.js','utf8');
const nativePlay=nativeSource.split('\n').find(line=>line.includes("$('r920Play').onclick="));assert(nativePlay);
const nativeStop=nativeSource.match(/\$\('r920Stop'\)\.onclick=\(\)=>command\('stop'\);/);assert(nativeStop);
const nativeAdjust=nativeSource.split('\n').find(line=>line.includes("$('r920Plus').onclick="));assert(nativeAdjust);add('r920Counter',root,'button');
vm.runInContext(nativePlay+'\n'+nativeStop[0]+'\n'+nativeAdjust,context);
const wheelSource=fs.readFileSync(base+'/assets/runtime/wheels-r924.js','utf8');const actualQuick=wheelSource.slice(wheelSource.indexOf('/* r932: stationary shortcuts'),wheelSource.indexOf('/* r950: read-only light'));
assert(actualQuick.length>1000);vm.runInContext(actualQuick,context);window.SukunWheelQuickControls.connect(root);
vm.runInContext(fs.readFileSync(app+'/assets/runtime/berhet-layout-r938.js','utf8'),context);
const identities=Object.fromEntries(['r932QuickWheel','r932EasyPlay','r932QuickScene','r932EasyMinus','r932EasyStop','r932EasyPlus','r920TefExit'].map(id=>[id,$(id)]));
const originalTransport=$('r932EasyPlay').parentElement,originalTop=$('r932QuickWheel').parentElement;
const sync=(mode,tef=true)=>{state.activeMode=mode;root.dataset.mode=mode;root.dataset.phase=state.phase;$('r920TefExit').hidden=!tef;$('r920TefEnter').hidden=tef;window.SukunWheelQuickControls.render();window.SukunBerhetLayout.sync(root,tef)};
for(const mode of ['esma','berhet'])for(let cycle=0;cycle<4;cycle++){
 sync(mode,true);const quick=$('r932WheelControls');const top=quick.querySelector('.r932VisualShortcuts'),bottom=quick.querySelector('.r932EasyTransport');
 check(`${mode} cycle ${cycle}: exact visible DOM order`,()=>{assert.deepEqual(top.children.map(n=>n.id),['r932QuickWheel','r932EasyPlay','r932QuickScene']);assert.deepEqual(bottom.children.map(n=>n.id),['r932EasyMinus','r932EasyStop','r932EasyPlus']);assert.deepEqual(stats.children.map(n=>n.id),['goal','r920TefExit','remaining'])});
 check(`${mode} cycle ${cycle}: all identities retained`,()=>{for(const [id,node] of Object.entries(identities))assert.equal($(id),node)});
 $('r938PanelToggle').click();
 check(`${mode} cycle ${cycle}: delegated actions fire once`,()=>{for(const action of Object.keys(sources)){const before=calls[action],button=$('r932Easy'+action[0].toUpperCase()+action.slice(1));assert(quick.contains(button));button.click();assert.equal(calls[action],before+1)}});
 check(`${mode} cycle ${cycle}: native phase labels follow playing/preparing/paused`,()=>{for(const [phase,label]of [['IDLE','Başlat'],['PLAYING','Duraklat'],['PREPARING','Duraklat'],['PAUSED','Devam et']]){state.phase=phase;sync(mode,true);assert.equal($('r932EasyPlay').textContent,label);assert.match($('r932EasyPlay').getAttribute('aria-label'),phase==='PAUSED'?/devam/:phase==='IDLE'?/başlat/:/duraklat/)}});
 check(`${mode} cycle ${cycle}: real native branch sends start/pause/resume and finish once`,()=>{for(const [phase,expected]of [['IDLE','start'],['PLAYING','pause'],['PREPARING','pause'],['PAUSED','resume'],['ERROR','start']]){state.phase=phase;sync(mode,true);const before=commands.length;$('r932EasyPlay').click();assert.equal(commands.length,before+1);assert.equal(commands.at(-1).name,expected)}const before=commands.length;$('r932EasyStop').click();assert.equal(commands.length,before+1);assert.equal(commands.at(-1).name,'stop')});
 check(`${mode} cycle ${cycle}: native disabled transport remains disabled`,()=>{for(const [action,id]of [['Play','r920Play'],['Stop','r920Stop']]){$(id).disabled=true;sync(mode,true);const before=commands.length;assert($('r932Easy'+action).disabled);$('r932Easy'+action).click();assert.equal(commands.length,before);$(id).disabled=false;sync(mode,true)}});
 check(`${mode} cycle ${cycle}: count gates block both delegated buttons`,()=>{allowed=false;sync(mode,true);for(const action of ['minus','plus']){let button=$('r932Easy'+action[0].toUpperCase()+action.slice(1));assert(button.disabled);assert.equal(button.getAttribute('aria-describedby'),'r968ManualHint');const before=calls[action];button.click();assert.equal(calls[action],before)}allowed=true;sync(mode,true)});
 check(`${mode} cycle ${cycle}: picker Escape returns focus to wheel`,()=>{$('r932QuickWheel').click();assert.equal($('r932QuickPicker').hidden,false);assert.equal($('r932QuickWheel').getAttribute('aria-expanded'),'true');assert.equal(document.activeElement,$('r932QuickSelect'));$('r932QuickSelect').dispatchEvent(new Event('keydown',{key:'Escape',bubbles:true}));assert.equal($('r932QuickPicker').hidden,true);assert.equal(document.activeElement,$('r932QuickWheel'));assert.equal($('r938PanelBody').hidden,false)});
 check(`${mode} cycle ${cycle}: picker close returns focus to scene`,()=>{$('r932QuickScene').click();$('r932QuickClose').click();assert.equal($('r932QuickPicker').hidden,true);assert.equal(document.activeElement,$('r932QuickScene'))});
 check(`${mode} cycle ${cycle}: disclosure collapse restores visible focus`,()=>{$('r932EasyPlay').focus();$('r938PanelToggle').click();assert.equal($('r938PanelBody').hidden,true);assert.equal(document.activeElement,$('r938PanelToggle'))});
 sync(mode,false);check(`${mode} cycle ${cycle}: normal mode removes exit row marker`,()=>{assert.equal(stats.dataset.r989ExitRow,undefined);assert.equal($('r920TefExit').parentElement.id,'r938Hero');assert($('r920TefExit').hidden)});
 root.hidden=true;window.SukunBerhetLayout.sync(root,false);check(`${mode} cycle ${cycle}: root hide restores exact control parents and order`,()=>{assert.equal($('r932EasyPlay').parentElement,originalTransport);assert.equal($('r932EasyStop').parentElement,originalTransport);assert.deepEqual(originalTransport.children.map(n=>n.id),['r932EasyMinus','r932EasyPlay','r932EasyPlus','r932EasyStop']);assert.equal($('r932QuickWheel').parentElement,originalTop);assert.equal($('r938Panel'),null);assert.equal(root.dataset.r938Layout,undefined)});root.hidden=false;
}
console.log(JSON.stringify({passed:results.length,total:results.length,scope:'Actual quick-control delegate, native play/pause/resume/stop handler branches, and layout-controller execution in a minimal DOM fixture. The session/audio command boundary is mocked; browser rendering and audible playback are not validated.',results},null,2));
