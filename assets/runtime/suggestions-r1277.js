(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const routes = {
    zikir: ['Zikir', 'Dhikr', 'zkr'],
    hz: ['Frekanslar', 'Frequencies', 'frq'],
    amb: ['Ambiyans', 'Ambience', 'amb'],
    dua: ['Dua', 'Prayer', 'zkr', 'ferasetBox'],
    salavat: ['Salavat', 'Salawat', 'zkr', 'dhBox'],
    tovbe: ['Tövbe', 'Repentance', 'zkr', 'tvBox']
  };
  const plans = [
    ['Sabah', 'Morning', 'İstersen bir zikir seç, ardından kısa bir dua oku.', 'Choose a dhikr, then read a short prayer if you like.', 'zikir','dua'],
    ['Öğle', 'Midday', 'Kısa bir mola için bir ambiyans seçebilir, dilersen bir frekans ekleyebilirsin.', 'For a short break, choose an ambience and optionally add a frequency.', 'amb','hz'],
    ['Akşam', 'Evening', 'İstersen bir salavatla başla, ardından duaya geç.', 'If you like, begin with salawat and follow with a prayer.', 'salavat','dua'],
    ['Gece', 'Night', 'Dilersen tövbe metnini oku, sonra sessizce zikir yap.', 'Read the repentance text if you wish, then spend a moment in quiet dhikr.', 'tovbe','zikir']
  ];
  function openRoute(key) {
    const [, , tab, target] = routes[key];
    document.querySelector('.tab[data-t="' + tab + '"]')?.click();
    if (target) {
      window.SukunDiscoveryR1158?.open('okumalar', document.querySelector('[data-discovery=okumalar]'));
      window.zNavGo?.(target);
    }
    const node = byId(target || 'tab-' + tab);
    if (!node) return;
    for (let parent = node; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    node.scrollIntoView({block:'center'});
  }
  let previous;
  function render() {
    const en = document.documentElement.lang.startsWith('en') || window.I18N?.lang === 'en';
    const hour = new Date().getHours();
    const period = hour < 5 || hour >= 22 ? 3 : hour < 12 ? 0 : hour < 17 ? 1 : 2;
    const signature = [en,period].join('/');
    if (signature === previous) return;
    previous = signature;
    const plan = plans[period];
    byId('r1277Period').textContent = plan[+en] + (en ? ' suggestion' : ' önerisi');
    byId('r1277Plan').textContent = plan[2 + Number(en)];
    byId('r1277Routes').replaceChildren(...plan.slice(4).map(key => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn';
      button.textContent = routes[key][+en];
      button.onclick = () => openRoute(key);
      return button;
    }));
    byId('r1277Delivery').textContent = location.hostname === 'appassets.androidplatform.net' || !('PushManager' in window && 'serviceWorker' in navigator)
      ? (en ? 'This environment does not support web push.' : 'Bu ortam web push bildirimlerini desteklemiyor.')
      : (en ? 'Remote notifications are waiting for a sender connection.' : 'Uzaktan bildirim için gönderici bağlantısı bekleniyor.');
  }
  render();
  window.addEventListener("sukun:languagechange", render);
  if (location.hash === "#sukun-reminders") document.querySelector('.tab[data-t="ntf"]')?.click();
  const panel = byId('tab-ntf');
  new MutationObserver(render).observe(panel, {attributes:true, attributeFilter:['hidden','class']});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('visibilitychange', render);
  setInterval(() => { if (!document.hidden && !panel.hidden) render(); }, 60000);
})();
