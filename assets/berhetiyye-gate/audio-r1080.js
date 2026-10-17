(function(){'use strict';
function createPortalAudio({onStatus = () => {}} = {}) {
  const Context = window.AudioContext || window.webkitAudioContext;
  const cues = new Set(['knock','challenge','unlocking','opening','welcome','closing','locking','sealing','preview','rejected','sadness']);
  const retiring = new Set();
  let context = null, bank = null, noise = null, impulse = null;
  let enabled = false, authorized = false, destroyed = false, blocked = false;
  let available = !!Context, volume = .42, mix = 1, cue = '', epoch = 0;
  const status = () => ({enabled, ready: !!context && context.state === 'running', contextState: context ? context.state : 'uncreated', volume, available,
    blocked, cue, mix, voices: bank ? bank.voices.size : 0, retiring: retiring.size, destroyed});
  const notify = () => { try { onStatus(status()); } catch (_) {} };
  const disconnect = node => { try { node.disconnect(); } catch (_) {} };
  function removeVoice(voice) {
    if (voice.removed) return;
    voice.removed = true;
    for (const node of voice.nodes) disconnect(node);
    voice.owner.voices.delete(voice);
    if (voice.owner.ending && !voice.owner.voices.size) removeBank(voice.owner);
  }
  function removeBank(target) {
    if (target.removed) return;
    target.removed = true;
    for (const voice of [...target.voices]) {
      voice.source.onended = null;
      try { voice.source.stop(); } catch (_) {}
      removeVoice(voice);
    }
    for (const node of target.nodes) disconnect(node);
    retiring.delete(target);
    if (bank === target) bank = null;
  }
  function stop({immediate = false} = {}) {
    for (const old of [...retiring]) removeBank(old);
    const previous = bank;
    bank = null; cue = '';
    if (previous) {
      if (immediate || !context || context.state !== 'running' || !previous.voices.size) removeBank(previous);
      else {
        previous.ending = true; retiring.add(previous);
        // Reverb is cut immediately; the dry signal receives an eight-millisecond fade.
        disconnect(previous.convolver); disconnect(previous.wet);
        const now = context.currentTime;
        previous.output.gain.cancelScheduledValues(now);
        previous.output.gain.setValueAtTime(previous.output.gain.value, now);
        previous.output.gain.linearRampToValueAtTime(0, now + .008);
        for (const voice of previous.voices) {
          try { voice.source.stop(now + .009); } catch (_) { removeVoice(voice); }
        }
      }
    }
    notify();
  }
  function buffers() {
    let seed = 57229;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    noise = context.createBuffer(1, Math.ceil(context.sampleRate * 2), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;
    impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 1.35), context.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = impulse.getChannelData(ch);
      for (let i = 0; i < out.length; i++) out[i] = (random() * 2 - 1) * Math.pow(1 - i / out.length, 2.8) * .42;
    }
  }
  async function enableFromGesture() {
    if (destroyed || !available) { notify(); return false; }
    if (navigator.userActivation && !navigator.userActivation.isActive) { blocked = true; notify(); return false; }
    const attempt = ++epoch;
    try {
      if (!context) {
        context = new Context();
        buffers();
      }
      if (context.state === 'closed') throw new Error('Audio context closed');
      const resume = context.resume();
      await resume;
      if (destroyed || attempt !== epoch) return false;
      authorized = true; enabled = context.state === 'running'; blocked = !enabled;
      notify(); return enabled;
    } catch (_) {
      if (attempt === epoch && !destroyed) { enabled = false; blocked = true; notify(); }
      return false;
    }
  }
  function setEnabled(value) {
    if (destroyed) return;
    epoch++;
    enabled = !!value && authorized && !!context && context.state === 'running';
    if (!enabled) stop({immediate: true});
    notify();
  }
  function setVolume(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || destroyed) return;
    volume = Math.max(0, Math.min(1, number));
    if (bank) bank.output.gain.setTargetAtTime(volume * mix * .3, context.currentTime, .015);
    if (!volume) stop({immediate: true});
    notify();
  }
  // Only this private effects bus is attenuated. Never touch the dhikr graph,
  // native media volume, foreground lease or the application's audio context.
  function setMix(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || destroyed) return;
    mix = Math.max(0, Math.min(1, number));
    if (bank) bank.output.gain.setTargetAtTime(volume * mix * .3, context.currentTime, .04);
    if (!mix) stop({immediate: true});
    notify();
  }
  function makeBank() {
    const input = context.createGain(), dry = context.createGain(), convolver = context.createConvolver();
    const wet = context.createGain(), compressor = context.createDynamicsCompressor(), output = context.createGain();
    dry.gain.value = .82; wet.gain.value = .23; convolver.buffer = impulse;
    compressor.threshold.value = -19; compressor.knee.value = 16; compressor.ratio.value = 5;
    compressor.attack.value = .004; compressor.release.value = .23;
    output.gain.value = volume * mix * .3;
    input.connect(dry); dry.connect(compressor); input.connect(convolver); convolver.connect(wet);
    wet.connect(compressor); compressor.connect(output); output.connect(context.destination);
    return {input, output, convolver, wet, voices: new Set(), ending: false, removed: false,
      nodes: [input, dry, convolver, wet, compressor, output]};
  }
  function voice(at, duration, {noise: isNoise = false, type = 'sine', frequency = 100,
    endFrequency = frequency, amplitude = .2, cutoff = 1600, highpass = false, attack = .01, release = .1} = {}) {
    const owner = bank;
    const source = isNoise ? context.createBufferSource() : context.createOscillator();
    const filter = context.createBiquadFilter(), gain = context.createGain();
    filter.type = highpass ? 'highpass' : 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .55;
    if (isNoise) source.buffer = noise;
    else {
      source.type = type;
      source.frequency.setValueAtTime(frequency, at);
      source.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), at + duration);
    }
    const peak = at + Math.min(attack, duration * .3), tail = Math.max(peak + .001, at + duration - release);
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(amplitude, peak);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, amplitude * .56), tail);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    source.connect(filter); filter.connect(gain); gain.connect(owner.input);
    const record = {source, owner, nodes: [source, filter, gain], removed: false};
    owner.voices.add(record);
    source.onended = () => removeVoice(record);
    source.start(at); source.stop(at + duration + .006);
  }
  function air(at, duration, amplitude = .12) {
    voice(at, duration, {noise: true, amplitude, cutoff: 620, attack: .2, release: .4});
  }
  function reed(at, frequency, duration, amplitude = .18) {
    voice(at, duration, {type: 'triangle', frequency, endFrequency: frequency * 1.0015,
      amplitude, cutoff: frequency * 4.5, attack: .11, release: .2});
    voice(at + .015, duration, {noise: true, amplitude: amplitude * .15, cutoff: 1250, attack: .14, release: .2});
  }
  function wood(at, amplitude = 1) {
    voice(at, .28, {frequency: 96, endFrequency: 49, amplitude: .54 * amplitude, cutoff: 460, attack: .007, release: .19});
    voice(at, .13, {noise: true, amplitude: .29 * amplitude, cutoff: 740, attack: .003, release: .09});
    voice(at + .025, .31, {type: 'triangle', frequency: 162, endFrequency: 121, amplitude: .075 * amplitude, cutoff: 670, attack: .006, release: .23});
  }
  function tick(at, amplitude = 1) {
    voice(at, .035, {noise: true, amplitude: .11 * amplitude, cutoff: 1700, attack: .002, release: .025});
    voice(at + .005, .085, {type: 'triangle', frequency: 185, endFrequency: 133, amplitude: .045 * amplitude, cutoff: 780, attack: .002, release: .06});
  }
  function bronze(at, amplitude = 1) {
    for (const [frequency, level] of [[143,.14],[205,.055],[291,.025]])
      voice(at, .48, {type: 'triangle', frequency, endFrequency: frequency * .98,
        amplitude: level * amplitude, cutoff: 880, attack: .014, release: .36});
  }
  function creak(at, duration, reverse = false) {
    voice(at, duration, {type: 'sawtooth', frequency: reverse ? 31 : 67, endFrequency: reverse ? 58 : 30,
      amplitude: .075, cutoff: 240, attack: .16, release: .3});
    air(at, duration, .12);
    wood(at + duration * .65, .34);
  }
  function motif(at, variant = 'welcome') {
    const notes = variant === 'challenge' ? [[0,293.66,.38],[.3,311.13,.32],[.58,369.99,.4],[.94,329.63,.44]]
      : [[0,293.66,.55],[.42,329.63,.48],[.79,311.13,.45],[1.13,293.66,.68]];
    for (const [offset, frequency, duration] of notes) reed(at + offset, frequency, duration, .15);
  }
  function schedule(name, at) {
    if (name === 'knock') { wood(at,.8); wood(at + .38,.67); bronze(at + .42,.32); }
    if (name === 'challenge') { air(at,1.5,.08); motif(at + .12,'challenge'); }
    if (name === 'unlocking' || name === 'locking') {
      const locking = name === 'locking', count = locking ? 13 : 25, duration = locking ? 1.55 : 2.95;
      for (let i = 0; i < count; i++) {
        const p = i / (count - 1), offset = duration * (locking ? 1 - Math.pow(1 - p,1.3) : Math.pow(p,1.3));
        tick(at + offset, .65 + (i % 3) * .12);
      }
      bronze(at + .18,.6); bronze(at + duration - .2,locking ? .65 : .8);
      air(at, duration + .2, locking ? .045 : .075);
    }
    if (name === 'opening') { creak(at,1.5); air(at + .25,1.75,.1); reed(at + .42,293.66,.72,.14); reed(at + 1,329.63,.72,.13); }
    if (name === 'welcome') motif(at);
    if (name === 'closing') creak(at,1.05,true);
    if (name === 'sealing') { air(at,1.5,.065); voice(at,.9,{frequency:73.42,endFrequency:55,amplitude:.12,cutoff:190,attack:.14,release:.6}); }
    if (name === 'preview') { wood(at,.55); tick(at + .6,.65); tick(at + .76,.6); bronze(at + .9,.4); motif(at + 1.1,'challenge'); }
    if (name === 'rejected') {
      for (let i = 0; i < 9; i++) tick(at + i * .105,.65 + (i % 3) * .1);
      const impact = at + 1.1;
      voice(impact,.095,{noise:true,amplitude:.42,cutoff:1850,attack:.002,release:.065});
      voice(impact,.43,{type:'triangle',frequency:102,endFrequency:62,amplitude:.5,cutoff:510,attack:.004,release:.32});
      for (const [frequency, amplitude] of [[157,.16],[239,.072],[331,.025]])
        voice(impact,.52,{type:'triangle',frequency,endFrequency:frequency*.96,amplitude,cutoff:1080,attack:.006,release:.4});
      voice(impact + .075,.065,{noise:true,amplitude:.22,cutoff:950,attack:.002,release:.045});
      voice(impact + .075,.26,{frequency:89,endFrequency:71,amplitude:.18,cutoff:400,attack:.004,release:.2});
      bank.wet.gain.setValueAtTime(.23,at + 1.6);
      bank.wet.gain.linearRampToValueAtTime(0,at + 1.78);
    }
    if (name === 'sadness') {
      for (const [offset, frequency, duration, amplitude] of [[.05,392,.68,.105],[.61,349.23,.69,.11],[1.18,311.13,.67,.1],[1.73,293.66,.9,.085]])
        reed(at + offset,frequency,duration,amplitude);
      air(at,2.75,.028);
      bank.wet.gain.setValueAtTime(.23,at + 2.5);
      bank.wet.gain.linearRampToValueAtTime(0,at + 2.98);
    }
  }
  function play(name) {
    if (!cues.has(name) || destroyed || !enabled || !volume || !mix || !context || context.state !== 'running') return false;
    stop(); bank = makeBank(); cue = name;
    try { schedule(name,context.currentTime + .018); notify(); return true; }
    catch (_) { stop({immediate: true}); blocked = true; notify(); return false; }
  }
  function destroy() {
    if (destroyed) return;
    epoch++; enabled = false; stop({immediate: true}); destroyed = true;
    if (context) { try { Promise.resolve(context.close()).catch(() => {}); } catch (_) {} }
    context = null; noise = null; impulse = null; notify();
  }
  return {enableFromGesture, setEnabled, setVolume, setMix, play, stop, snapshot: status, destroy};
}

window.createSukunPortalAudio=createPortalAudio;
})();
