/* SÜKÛN r945 — bounded, opt-in ambience and voice-onset accompaniment.
 * No transport, intervals, AudioContext creation, recording access or auto-play.
 * The core supplies its existing channel environment / rhythm source owner.
 */
(function (root) {
  'use strict';
  if (root.SukunAudioPaletteR945) return;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));
  const patterns = Object.freeze({
    hu: Object.freeze([[0, 'H', .7]]),
    huheart: Object.freeze([[0, 'D', .58], [.24, 'D', .38], [.025, 'H', .58]]),
    softdef: Object.freeze([[0, 'F', .75], [.5, 'F', .42]]),
    wooden: Object.freeze([[0, 'W', .75], [.5, 'W', .4]])
  });
  function gain(c, value) { const n = c.createGain(); n.gain.value = value; return n; }
  function filter(c, type, frequency, q) {
    const n = c.createBiquadFilter(); n.type = type; n.frequency.value = frequency;
    n.Q.value = q || .7; return n;
  }
  function oscillator(c, hz) { const n = c.createOscillator(); n.type = 'sine'; n.frequency.value = hz; return n; }
  function slowMod(E, c, param, rate, depth) {
    const o = oscillator(c, rate), g = E.n(gain(c, depth));
    o.connect(g); g.connect(param); E.play(o);
  }
  function texture(E, out, noise, cfg) {
    const c = out.context, s = c.createBufferSource(); s.buffer = noise(cfg.color || 'pink'); s.loop = true;
    const hp = E.n(filter(c, 'highpass', cfg.low || 100, .7));
    const lp = E.n(filter(c, 'lowpass', cfg.high || 1600, .7));
    const g = E.n(gain(c, cfg.level));
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    if (cfg.rate) slowMod(E, c, g.gain, cfg.rate, cfg.level * .33);
    if (cfg.sweep) slowMod(E, c, lp.frequency, .047, cfg.sweep);
    E.play(s);
  }
  function drone(E, out, hz, partials, level, motion) {
    const c = out.context, bus = E.n(gain(c, level)); bus.connect(out);
    partials.forEach(([ratio, amp]) => {
      const o = oscillator(c, hz * ratio), g = E.n(gain(c, amp));
      o.connect(g); g.connect(bus); E.play(o);
    });
    if (motion) slowMod(E, c, bus.gain, motion, level * .22);
  }
  function ambientDefinitions(noise) {
    return [
      {id:'r945_tanbur_dem',kat:'zemin',icon:'◉',name:'Tanbur Esintili Dem',desc:'sentez · ezgisiz, sıcak ve sürekli tel tınısı',cal:.8,wet:.26,defaultVolume:.32,build(E,out){
        drone(E,out,110,[[1,.7],[2,.22],[3,.1],[4,.035]],.25,.07);
      }},
      {id:'r945_ney_nefes',kat:'zemin',icon:'♪',name:'Ney Esintili Nefes',desc:'sentez · ezgisiz hava dokusu, yumuşak nefes',cal:1,wet:.28,defaultVolume:.32,build(E,out){
        texture(E,out,noise,{low:520,high:1800,level:.3,rate:.11,sweep:180});
        drone(E,out,220,[[1,.7],[2,.13]],.018,.095);
      }},
      {id:'r945_ipek',kat:'zemin',icon:'≈',name:'İpek Hışırtısı',desc:'sentez · keskin tıkırtısız, ince kumaş dokusu',cal:1,wet:.1,defaultVolume:.32,build(E,out){
        texture(E,out,noise,{color:'white',low:900,high:4200,level:.15,rate:.21,sweep:480});
      }},
      {id:'r945_su_alti',kat:'zemin',icon:'◌',name:'Su Altı Sükûnu',desc:'sentez · boğuk su dokusu ve ağır dalgalanma',cal:.9,wet:.2,defaultVolume:.32,build(E,out){
        texture(E,out,noise,{color:'brown',low:65,high:420,level:.34,rate:.085,sweep:80});
        drone(E,out,164,[[1,.5],[1.5,.22]],.027,.065);
      }},
      {id:'r945_kum_esinti',kat:'zemin',icon:'≋',name:'Kum Esintisi',desc:'sentez · kuru, ince ve açık alan esintisi',cal:1,wet:.08,defaultVolume:.32,build(E,out){
        texture(E,out,noise,{low:380,high:3100,level:.26,rate:.073,sweep:500});
        texture(E,out,noise,{color:'white',low:2100,high:5200,level:.045,rate:.18});
      }},
      {id:'r945_kubbe',kat:'zemin',icon:'⌒',name:'Kubbe Rezonansı',desc:'sentez · ritimsiz, pes ve geniş rezonans zemini',cal:.85,wet:.42,defaultVolume:.32,build(E,out){
        drone(E,out,82.5,[[1,.6],[2,.24],[3,.13],[4,.07]],.19,.043);
        texture(E,out,noise,{color:'brown',low:80,high:750,level:.04,rate:.052});
      }}
    ];
  }
  function envelope(param, t, peak, duration, attack) {
    param.setValueAtTime(0,t);
    param.linearRampToValueAtTime(peak,t+attack);
    param.exponentialRampToValueAtTime(.0001,t+duration);
    param.linearRampToValueAtTime(0,t+duration+.015);
  }
  /* Every finite source is registered in r925DrumSource: stop/pause/epoch
     retirement and onended disconnection remain owned by the core. */
  function rhythm({context:c,output:out,noise,track,time:t,type,strength=1,unit=1}) {
    if (!c || !out || typeof track !== 'function' || !Number.isFinite(t) || !['H','F','W'].includes(type)) return false;
    strength=clamp(strength,0,1); unit=clamp(unit,.8,6);
    if (!strength) return false;
    function tone(hz,end,amp,duration,attack=.009) {
      const o=oscillator(c,hz), g=gain(c,0), at=t+duration+.02;
      track(o,[g],at); o.connect(g); g.connect(out);
      o.frequency.setValueAtTime(hz,t);
      if(end!==hz)o.frequency.exponentialRampToValueAtTime(end,t+.065);
      envelope(g.gain,t,amp*strength,duration,attack); o.start(t); o.stop(at);
    }
    function air(color,hz,q,amp,duration,attack=.008) {
      const n=c.createBufferSource(), f=filter(c,'bandpass',hz,q), g=gain(c,0), at=t+duration+.02;
      n.buffer=noise(color); track(n,[f,g],at); n.connect(f); f.connect(g); g.connect(out);
      envelope(g.gain,t,amp*strength,duration,attack); n.start(t); n.stop(at);
    }
    if(type==='H') {
      // A soft synthetic /u/-like colour, never a recording or spoken invocation.
      const d=Math.min(.9,unit*.55);
      tone(112,112,.19,d,.055); tone(224,224,.08,d,.065); tone(336,336,.045,d*.92,.05);
      air('pink',850,1.2,.075,Math.min(.19,d*.5),.018);
    } else if(type==='F') {
      tone(154,98,.24,.24); tone(238,192,.08,.15);
      air('brown',690,1.1,.11,.11,.005);
    } else {
      tone(640,470,.09,.09,.004); tone(1020,850,.035,.06,.003);
      air('pink',1350,2.2,.045,.045,.003);
    }
    return true;
  }
  root.SukunAudioPaletteR945=Object.freeze({version:'r945',patterns,ambientDefinitions,rhythm});
})(window);
