(() => {
  'use strict';
  // Supply only the publisher's HTTPS registration URL and PUBLIC VAPID key.
  const endpoint = document.querySelector('meta[name="sukun-push-endpoint"]')?.content;
  const key = document.querySelector('meta[name="sukun-push-public-key"]')?.content;
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  if (supported) {
    const pref = 'sukun.device.alerts';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn';
    document.getElementById('r1277Delivery').before(toggle);
    function update() {
      const on = localStorage.getItem(pref) === '1' && Notification.permission === 'granted';
      const en = window.I18N?.lang === 'en';
      toggle.textContent = on ? (en ? 'Disable system alerts while running' : 'Uygulama açıkken sistem bildirimlerini kapat')
                              : (en ? 'Enable system alerts while running' : 'Uygulama açıkken sistem bildirimlerini aç');
      if (Notification.permission === 'denied') toggle.textContent = en ? 'Notifications blocked in system settings' : 'Sistem ayarlarında bildirim izni kapalı';
      toggle.disabled = Notification.permission === 'denied';
      toggle.setAttribute('aria-pressed',String(on));
    }
    toggle.onclick = async () => {
      if (toggle.getAttribute('aria-pressed') === 'true') {
        localStorage.removeItem(pref);
        const reg = await navigator.serviceWorker.getRegistration();
        for (const n of await reg?.getNotifications() || []) if (n.tag.startsWith('sukun-alert-')) n.close();
      } else if (await Notification.requestPermission() === 'granted') localStorage.setItem(pref,'1');
      update();
    };
    window.addEventListener('sukun:alert', async event => {
      if (localStorage.getItem(pref) !== '1' || Notification.permission !== 'granted' || !event.detail?.id) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg?.active) return;
        const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(event.detail.id));
        const tag = 'sukun-alert-' + Array.from(new Uint8Array(digest).slice(0,12), b=>b.toString(16).padStart(2,'0')).join('');
        if (localStorage.getItem(pref) === '1') await reg.showNotification('Sükûn',{body:window.I18N?.lang === 'en' ? 'A notification is ready.' : 'Bir bildirimin var.',tag,renotify:false});
      } catch { /* The in-app alert remains available when OS delivery fails. */ }
    });
    window.addEventListener('focus',update);
    window.addEventListener('sukun:languagechange',update);
    update();
  }
  if (!endpoint || !key || !('Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator)) return;
  const status=document.getElementById('r1277Delivery');
  const control=document.createElement('button');
  control.className='btn';control.type='button';status.after(control);
  const tokenKey='sukun.push.owner';
  function token() {
    let value=localStorage.getItem(tokenKey);
    if(!value){value=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(tokenKey,value)}
    return value;
  }
  async function sync(method,sub) {
    const result=await fetch(endpoint,{method,credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint,zone:Intl.DateTimeFormat().resolvedOptions().timeZone})});
    if(!result.ok)throw Error('registration');
  }
  const activeKey='sukun.push.daily';
  const enabled=()=>localStorage.getItem(activeKey)==='1';
  function label() {
    const en=window.I18N?.lang==='en';
    status.textContent=Notification.permission==='denied'?(en?'Notifications are blocked in system settings.':'Sistem ayarlarında bildirim izni kapalı.'):(en?'Optional daily reminder at 09:00 local time.':'İsteğe bağlı günlük hatırlatma, yerel saat 09.00.');
    control.textContent=enabled()?(en?'Disable device reminders':'Cihaz hatırlatmasını kapat'):(en?'Enable device reminders':'Cihaz hatırlatmasını aç');
    control.setAttribute('aria-pressed',String(enabled()));
  }
  control.onclick=async()=>{
    control.disabled=true;
    try {
      if (!enabled() && await Notification.requestPermission()!=='granted') {label();return}
      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      if(enabled()){
        if(sub){if(!await sub.unsubscribe())throw Error('unsubscribe');await sync('DELETE',sub).catch(()=>{})}
        localStorage.removeItem(activeKey);
        for(const item of await reg.getNotifications({tag:'sukun-daily'}))item.close();
      }else{
        const publicKey=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),ch=>ch.charCodeAt(0));
        sub ||= await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:publicKey});
        try{await sync('PUT',sub)}catch(error){await sub.unsubscribe();throw error}
        localStorage.setItem(activeKey,'1');
      }
      label();
    }catch{status.textContent=window.I18N?.lang==='en'?'Could not update device reminders.':'Cihaz hatırlatması güncellenemedi.'}
    finally{control.disabled=false}
  };
  async function refresh(){
    label();
    if(!enabled())return;
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub)await sync('PUT',sub);
    else{localStorage.removeItem(activeKey);label()}
  }
  window.addEventListener('sukun:languagechange',label);
  window.addEventListener('focus',()=>refresh().catch(()=>{}));
  refresh().catch(()=>{});
})();
