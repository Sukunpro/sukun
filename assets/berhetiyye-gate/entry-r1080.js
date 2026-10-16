/* SÜKÛN r1080 — one small entry into the existing readings surface. */
(function () {
  'use strict';
  var id = 'r1080BerhetEntry', wrapper = null;
  var invitationURL = new URL('./invitation-tr.mp3', document.currentScript.src);
  invitationURL.search = new URL(document.currentScript.src).search;
  invitationURL = invitationURL.href;
  function english() { return window.I18N && window.I18N.lang === 'en'; }
  function access() { return window.SukunBerhetGateAccess; }
  function openSetup() {
    if (window.SukunBerhetGate) window.SukunBerhetGate.close();
    var box = document.getElementById('kltBox');
    if (!box) return;
    for (var parent = box; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    try { window.SukunPracticeUI && window.SukunPracticeUI.openSection('zmgAraclar'); } catch (_) {}
    box.open = true; box.scrollIntoView({block:'center', behavior:'smooth'});
    var input = document.getElementById('kltPin'); if (input) input.focus({preventScroll:true});
  }
  function refresh() {
    if (!wrapper) return;
    var en = english(), gate = window.SukunBerhetGate, adapter = access();
    var state = gate ? gate.snapshot() : {}, granted = adapter && adapter.isUnlocked();
    var dormant = state.dormant && !granted;
    wrapper.classList.toggle('r1080-dormant', !!dormant);
    wrapper.querySelector('[data-entry-label]').textContent = dormant ? (en?'BEYOND THE STONE COURTYARD':'TAŞ AVLUNUN ARDINDA') : (en?'BERHETIYYE · PRIVATE ENTRY':'BERHETİYYE · ÖZEL GİRİŞ');
    wrapper.querySelector('[data-entry-title]').textContent = granted ? (en?'The palace door is open':'Sarayın kapısı açık') : dormant ? (en?'The Old Door':'Eski Kapı') : (en?'The Palace Threshold':'Sarayın Eşiği');
    wrapper.querySelector('[data-entry-hint]').textContent = granted ? (en?'Return to the Berhetiyye palace.':'Berhetiyye sarayına dön.') : dormant ? (en?'A quiet door, an old courtyard.':'Sessiz bir kapı, eski bir avlu.') : (en?'A journey waits beyond the door.':'Kapının ardında bir yolculuk var.');
    var setup = wrapper.querySelector('[data-entry-setup]');
    setup.hidden = !(adapter && adapter.needsSetup && adapter.needsSetup());
    setup.textContent = en?'Set this device’s entry password':'Bu cihazın giriş şifresini ayarla';
  }
  function mount() {
    var target = document.querySelector('#zmgOkumalar > .zMegaBody');
    if (!target || !window.SukunBerhetGate || !access()) return;
    if (!wrapper) {
      wrapper = document.createElement('div'); wrapper.id = 'r1080BerhetEntryWrap';
      wrapper.innerHTML = '<button type="button" id="'+id+'"><span class="r1080-gate-thumb" aria-hidden="true"></span><span class="r1080-gate-copy"><small data-entry-label></small><strong data-entry-title></strong><span data-entry-hint></span></span><span class="r1080-gate-arrow" aria-hidden="true">›</span></button><button type="button" data-entry-setup hidden></button>';
      wrapper.querySelector('#'+id).addEventListener('click',function () { window.SukunBerhetGate.open({trigger:this}); });
      wrapper.querySelector('[data-entry-setup]').addEventListener('click',openSetup);
    }
    if (wrapper.parentElement !== target) target.prepend(wrapper);
    window.SukunBerhetGate.configure({adapter:access(), invitationAudioURL:invitationURL});
    refresh();
  }
  ['sukun:domhydrate','sukun:tabchange','sukun:secretaccesschange','sukun:languagechange','pageshow'].forEach(function(name){ window.addEventListener(name,mount); });
  document.addEventListener('sukun:berhet-gate-state',refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  window.SukunBerhetGateEntry = {refresh:mount, openSetup:openSetup};
})();
