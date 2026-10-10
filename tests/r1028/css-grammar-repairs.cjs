'use strict';
// Portable source contracts for the five r1028 CSS grammar repairs.
// Uses Node built-ins only. This is not an HTML5 parser or browser/CSSOM test.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const results = [];
const sha = text => crypto.createHash('sha256').update(text.trim()).digest('hex');
const compact = text => text.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim();
function test(name, fn) {
  try { fn(); results.push({name, passed:true}); }
  catch (error) { results.push({name, passed:false, error:error.message}); }
}
// HTML raw-text boundaries: a style/script ends at its own first closing tag.
// Skipping scripts prevents string literals inside JavaScript becoming styles.
function rawTextElements(html) {
  return [...html.matchAll(/<(style|script)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)].map(m => ({
    tag:m[1].toLowerCase(), id:m[2].match(/\bid\s*=\s*['"]([^'"]+)['"]/i)?.[1],
    text:m[3], start:m.index, end:m.index + m[0].length
  }));
}
function block(text, opening) {
  assert.equal(text[opening], '{', 'Expected block opening');
  let depth=0, quote='', comment=false;
  for(let i=opening;i<text.length;i++) {
    const c=text[i], n=text[i+1];
    if(comment) {if(c==='*'&&n==='/'){comment=false;i++;}continue;}
    if(quote) {if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
    if(c==='/'&&n==='*'){comment=true;i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return {text:text.slice(opening+1,i), end:i+1};
  }
  assert.fail('Unclosed CSS block');
}
function firstRule(css, selector) {
  const start=css.indexOf(selector);
  assert(start>=0, 'Missing selector '+selector);
  const opening=css.indexOf('{',start);
  assert.equal(css.slice(start,opening).trim(),selector);
  return block(css,opening);
}
function topLevelCommaParts(value) {
  const parts=[];let start=0,depth=0,quote='';
  for(let i=0;i<value.length;i++){
    const c=value[i];
    if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='(')depth++;else if(c===')')depth--;
    else if(c===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}
    assert(depth>=0,'Unbalanced background parentheses');
  }
  assert.equal(depth,0);assert.equal(quote,'');parts.push(value.slice(start).trim());return parts;
}
function cssLexicalBalance(css) {
  const stack=[];let quote='',comment=false;
  for(let i=0;i<css.length;i++){
    const c=css[i],n=css[i+1];
    if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
    if(quote){if(c==='\\'){i++;continue;}assert.notEqual(c,'\n','Raw newline in CSS string');if(c===quote)quote='';continue;}
    if(c==='/'&&n==='*'){comment=true;i++;continue;}
    if(c==='\\'){i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if('{[('.includes(c))stack.push(c);
    else if('}])'.includes(c))assert.equal(stack.pop(),{'}':'{',']':'[',')':'('}[c],'Mismatched CSS delimiter');
  }
  assert.equal(quote,'','Unclosed CSS quote');assert.equal(comment,false,'Unclosed CSS comment');assert.equal(stack.length,0,'Unclosed CSS delimiter');
}
const outerHashes={
  'r530-critical-ui-style':'b82f391fd8d61beeb98c509ccd04c121809e385f8881d1cc07992691b9727c61',
  'r609-zikir-flow-lock-fix':'427e14e90786d4f9ee2b2e9ddaa9fe1d27a138e21d70d99afd4c77101d9000b8'
};
const headerCases=[
  {id:'sukun-r763-glass-header-refine',hash:'a2b2299dc4efa6a744489ce26aa1b0300f79e7e40d94e31d6e57808342330f93',layers:[
    'linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.025) 16%,rgba(4,18,28,.14) 100%)',
    'radial-gradient(120% 150% at 14% 0%,rgba(86,238,212,.10),transparent 44%)',
    'radial-gradient(115% 145% at 100% 100%,rgba(150,110,255,.07),transparent 50%)',
    'rgba(5,22,31,.12)']},
  {id:'sukun-r764-luxury-glass-tune',hash:'f61499c5f65ecde9eec5ce6044e646f17f97e049fafe4a8e6849508084467e5d',layers:[
    'linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.028) 14%,rgba(6,21,30,.10) 100%)',
    'radial-gradient(120% 145% at 14% 0%,rgba(94,236,212,.08),transparent 43%)',
    'radial-gradient(120% 140% at 100% 100%,rgba(160,123,255,.05),transparent 47%)',
    'rgba(5,21,31,.08)']}
];
const documents = new Map();
for(const filename of ['index.html','nero.html']){
  let html;
  test(filename+': readable entrypoint',()=>{html=fs.readFileSync(path.join(root,filename),'utf8');documents.set(filename,html);});
  if(html===undefined)continue;
  const raw=rawTextElements(html),styles=raw.filter(x=>x.tag==='style');
  function style(id){const found=styles.filter(s=>s.id===id);assert.equal(found.length,1,'Expected exactly one real style boundary for '+id);return found[0];}
  const check=(name,fn)=>test(filename+': '+name,fn);
  check('all source style openings have distinct raw-text boundaries and closes',()=>{
    const openings=(html.match(/<style\b/gi)||[]).length,closings=(html.match(/<\/style\s*>/gi)||[]).length;
    assert(openings>=263);assert.equal(openings,closings);assert.equal(styles.length,openings);
  });
  check('no style raw text contains a leaked opening style tag',()=>{for(const s of styles)assert(!/<style\b/i.test(s.text),'Leaked style in '+(s.id||'anonymous'));});
  check('all inline styles have balanced CSS quotes comments and delimiters',()=>{for(const s of styles)cssLexicalBalance(s.text);});
  for(const [outer,inner] of [['r530-critical-ui-style','r800-notify-glass-clarity'],['r609-zikir-flow-lock-fix','r613-zikir-top-scroll-fix']]){
    check(inner+' is a separate style immediately after the closed '+outer,()=>{
      const a=style(outer),b=style(inner);assert(a.end<=b.start);assert.equal(html.slice(a.end,b.start).trim(),'');
      assert.equal(styles.indexOf(b),styles.indexOf(a)+1);
    });
    check(outer+' preserves every existing neighboring rule byte',()=>assert.equal(sha(style(outer).text),outerHashes[outer]));
  }
  check('r800 first glass rule is restored with its six intended declarations',()=>{
    const r=firstRule(style('r800-notify-glass-clarity').text,'#tab-ntf .r554NotifyCenter');
    assert.equal(compact(r.text),compact(`border:1px solid color-mix(in srgb,var(--gold) 18%,var(--line))!important;
      border-radius:22px!important;background:linear-gradient(180deg,rgba(8,18,28,.80),rgba(5,14,22,.72))!important;
      -webkit-backdrop-filter:blur(12px) saturate(1.08)!important;backdrop-filter:blur(12px) saturate(1.08)!important;
      box-shadow:0 14px 34px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.05)!important;`));
  });
  check('all r800 rules after the recovered first rule stay unchanged',()=>{
    const css=style('r800-notify-glass-clarity').text,r=firstRule(css,'#tab-ntf .r554NotifyCenter');
    assert.equal(sha(css.slice(r.end)),'cd17ce1e2b90f613fc4179e55653352dd1306c51f2e22072b8ebac3ed23957a6');
  });
  check('r613 restores only the scoped 12px scroll margin rule',()=>{
    const css=style('r613-zikir-top-scroll-fix').text.replace(/\/\*[\s\S]*?\*\//g,'').trim();
    assert.equal(compact(css),compact(`body:not(.sukun-tefekkur-mode) #zStage,
      body:not(.sukun-tefekkur-mode) #tab-zkr > .card.zCtl{scroll-margin-top:12px!important;}`));
  });
  check('scripts following both repaired style boundaries remain outside raw CSS',()=>{
    for(const [styleId,scriptId] of [['r800-notify-glass-clarity','r800-version-tag'],['r613-zikir-top-scroll-fix','r613-zikir-top-scroll-runtime']]){
      const s=style(styleId),next=raw[raw.indexOf(s)+1];assert(next);assert.equal(next.tag,'script');assert.equal(next.id,scriptId);assert.equal(html.slice(s.end,next.start).trim(),'');
    }
  });
  check('NeuroSync aspect-ratio fallback is a real standalone at-rule boundary',()=>{
    const m=html.match(/}\s*\/\* Fallback for browsers without aspect-ratio support \(older Samsung Internet\) \*\/\s*@supports not \(aspect-ratio:1\/1\)\{/g);
    assert.equal(m?.length,1);assert(!/}#ns\s*\/\* Fallback for browsers without aspect-ratio/.test(html));
  });
  check('fallback selectors and dimensions remain confined to NeuroSync',()=>{
    const marker='@supports not (aspect-ratio:1/1)',start=html.indexOf(marker);assert(start>=0);
    const fallback=block(html,html.indexOf('{',start));
    assert.equal(compact(fallback.text),compact(`#ns .hv-stage::before{content:'';display:block;padding-top:100%;}
      #ns .hv-stage > canvas,#ns .hv-stage > .hv-focus-dot{position:absolute;top:0;left:0;}`));
    assert.match(html.slice(fallback.end,fallback.end+100),/^#ns #hvCanvas, #ns #hvCanvasMed\{width:100%;height:100%;display:block;}/);
  });
  for(const c of headerCases){
    check(c.id+' has one final !important after four unchanged background layers',()=>{
      const css=style(c.id).text,r=firstRule(css,'html body.r716-shell .wrap>header'),value=r.text.match(/\bbackground\s*:\s*([^;]+);/)?.[1];assert(value);
      assert.equal((value.match(/!important/g)||[]).length,1);assert.match(value,/!important\s*$/);assert(!/!important\s*,/.test(value));
      assert.deepEqual(topLevelCommaParts(value.replace(/\s*!important\s*$/,'')),c.layers);
    });
    check(c.id+' preserves all non-background declarations and following rules',()=>{
      const css=style(c.id).text,start=css.indexOf('background:'),end=css.indexOf(';',start)+1;assert(start>=0&&end>start);
      assert.equal(sha(css.slice(0,start)+'BACKGROUND_DECLARATION'+css.slice(end)),c.hash);
    });
  }
}
test('index.html and nero.html contain identical application bytes',()=>{assert(documents.has('index.html')&&documents.has('nero.html'));assert.equal(documents.get('index.html'),documents.get('nero.html'));});
const passed=results.filter(x=>x.passed).length;
console.log(JSON.stringify({total:results.length,passed,failed:results.length-passed,scope:'Node-built-in source-boundary and exact CSS repair contracts. Not a complete standards parser, live CSSOM, geometry, or Android device test.',results},null,2));
if(passed!==results.length)process.exitCode=1;
