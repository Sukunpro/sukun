/* Independent, read-only entry. The native rescue link still works if this or
   any main app script fails. No audio, recovery-state or storage ownership. */
(function(){
  'use strict';
  var title=document.querySelector('[data-sukun-recovery-title]');
  var fallback=document.getElementById('sukun-rescue-link');
  if(!title||!fallback)return;
  var contact=null,timer=0,opening=false;
  var delay=1200,tolerance=10;
  function cancel(){
    if(timer)clearTimeout(timer);
    timer=0;contact=null;
  }
  function destination(){
    var lang=document.documentElement.lang==='en'?'en':'tr';
    return new URL('./rescue.html?lang='+lang,location.href).href;
  }
  title.addEventListener('pointerdown',function(event){
    if(event.isTrusted!==true)return;
    // A second contact, secondary button, pen barrel or pinch cancels intent.
    if(contact||event.isPrimary===false||event.button!==0){cancel();return;}
    contact={id:event.pointerId,x:event.clientX,y:event.clientY,ready:false};
    timer=setTimeout(function(){timer=0;if(contact)contact.ready=true;},delay);
  },{passive:true});
  document.addEventListener('pointermove',function(event){
    if(!contact||event.pointerId!==contact.id)return;
    if(Math.hypot(event.clientX-contact.x,event.clientY-contact.y)>tolerance)cancel();
  },{passive:true,capture:true});
  document.addEventListener('pointerdown',function(event){
    if(contact&&event.pointerId!==contact.id)cancel();
  },{passive:true,capture:true});
  document.addEventListener('pointerup',function(event){
    if(!contact||event.pointerId!==contact.id)return;
    var open=event.isTrusted===true&&contact.ready&&!document.hidden&&
      Math.hypot(event.clientX-contact.x,event.clientY-contact.y)<=tolerance;
    cancel();
    if(open&&!opening){opening=true;location.assign(destination());}
  },{passive:true,capture:true});
  // Do not capture the pointer, prevent default, stop propagation or change
  // touch-action: the browser keeps normal short clicks, scroll and zoom.
  document.addEventListener('pointercancel',cancel,{passive:true,capture:true});
  document.addEventListener('scroll',cancel,{passive:true,capture:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden)cancel();},{passive:true});
  document.addEventListener('keydown',function(event){if(event.key==='Escape')cancel();});
  window.addEventListener('blur',cancel,{passive:true});
  window.addEventListener('pagehide',cancel,{passive:true});
  window.addEventListener('pageshow',function(){cancel();opening=false;},{passive:true});
  // Only this explicit native link is decorated; its base href works with no JS.
  fallback.addEventListener('click',function(){fallback.href=destination();});
})();
