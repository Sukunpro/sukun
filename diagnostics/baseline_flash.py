from pathlib import Path
from playwright.sync_api import sync_playwright
import re,base64,mimetypes,json
root=Path(__file__).resolve().parents[1]
s=(root/'nero.html').read_text()
def inline(m):
 p=root/m.group(2).split('?')[0]
 return m.group(1)+'data:'+(mimetypes.guess_type(str(p))[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode()+m.group(3) if p.is_file() else m.group(0)
s=re.sub(r'(["\'\(])(?:\./)?(assets/[^"\'\)]+)(["\'\)])',inline,s)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='block',reduced_motion='reduce')
 page=c.new_page();page.on('dialog',lambda d:d.dismiss());page.set_content(s,wait_until='load',timeout=60000)
 page.evaluate('''() => {document.getElementById('obSkip')?.click();document.getElementById('onboardCard')?.remove();document.querySelector('#r616BottomNav [data-r616-view="zikir"]')?.click();Z.cat='berhet';Z.idx=9;Z.count=17;Z.target=298;renderZikir(false);zUI();document.querySelector('.tab[data-t="zkr"]')?.click();SUKUN_TEFEKKUR.enter();SukunCurrentZikirHero.sync();}''')
 page.wait_for_timeout(250)
 page.evaluate('''() => {
 window.__flash=[];const ids=['r611CurrentZikirHero','r611CurrentZikirName','r740HeroHeading','zStage','zTr','nameToastLayer'];
 const snap=()=>Object.fromEntries(ids.map(id=>{let e=document.getElementById(id);return [id,e?{text:e.textContent.slice(0,90),display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,opacity:getComputedStyle(e).opacity,font:getComputedStyle(e).fontSize,hidden:e.hidden}:null]}));
 window.__snap=snap;
 let names=ids.map(id=>document.getElementById(id)).filter(Boolean);
 let o=new MutationObserver(ms=>{for(let m of ms){let e=m.target.nodeType===1?m.target:m.target.parentElement;window.__flash.push({t:performance.now(),target:e?.id||e?.className,attr:m.attributeName,text:document.getElementById('r611CurrentZikirName')?.textContent,display:getComputedStyle(document.getElementById('r611CurrentZikirHero')).display});}});
 names.forEach(e=>o.observe(e,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,characterData:true,subtree:true}));window.__obs=o;
 }''')
 for mode in ['fixed','animated','off','fixed']:
  page.evaluate('''m=>{document.querySelector('[data-r474-name-mode="'+m+'"]')?.click();for(let i=0;i<5;i++){Z.count++;zUI();window.dispatchEvent(new CustomEvent('sukun:playbackchange'));}Z.count=17;}''',mode)
  page.wait_for_timeout(160)
  print(mode,json.dumps(page.evaluate('__snap()'),ensure_ascii=False)[:1000])
 print('mutations',json.dumps(page.evaluate('__flash'),ensure_ascii=False)[:16000])
 b.close()
