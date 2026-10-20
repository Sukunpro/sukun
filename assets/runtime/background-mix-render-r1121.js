/* SÜKÛN r1121: finite, stereo background mix prepared before page suspension.
 * Existing ambience builders run with virtual audio time, never wall timers.
 * This module owns no live transport, preferences, AudioContext or recordings.
 */
(function (root) {
  'use strict';
  if (root.SukunBackgroundMixRenderer) return;
  const VERSION = 'r1121';
  const DURATION = 48, WARMUP = 3, SEAM_SECONDS = .03;
  const MAX_EVENTS = 30000, MAX_NODES = 100000, MAX_CHANNELS = 128;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));
  const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  function failure(code, message) { const e = new Error(message); e.code = code; return e; }
  function assertCurrent(adapter) {
    if (adapter?.signal?.aborted || (typeof adapter?.isCurrent === 'function' && !adapter.isCurrent())) {
      const e = failure('cancelled', 'Background mix preparation was cancelled.'); e.name = 'AbortError'; throw e;
    }
  }
  function scheduler(horizon) {
    const heap = []; let serial = 0, processed = 0;
    const s = { now: 0, get processed() { return processed; } };
    function push(e) {
      if (e.at > horizon) return e.id;
      heap.push(e); let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p].at < e.at || (heap[p].at === e.at && heap[p].id < e.id)) break; heap[i] = heap[p]; i = p; }
      heap[i] = e; return e.id;
    }
    function pop() {
      const e = heap[0], last = heap.pop(); if (heap.length) {
        let i = 0;
        while (true) { let child = i * 2 + 1; if (child >= heap.length) break;
          if (child + 1 < heap.length && (heap[child + 1].at < heap[child].at || (heap[child + 1].at === heap[child].at && heap[child + 1].id < heap[child].id))) child++;
          if (last.at < heap[child].at || (last.at === heap[child].at && last.id < heap[child].id)) break;
          heap[i] = heap[child]; i = child;
        }
        heap[i] = last;
      } return e;
    }
    s.later = (env, fn, milliseconds, period = 0) => {
      if (typeof fn !== 'function') throw failure('invalid-builder', 'Ambience timer callback is not a function.');
      const delay = Math.max(.001, finite(milliseconds, 0) / 1000);
      return push({ id: ++serial, at: s.now + delay, env, fn, period });
    };
    s.run = adapter => {
      while (heap.length) {
        assertCurrent(adapter);
        const e = pop(); if (!e.env.alive()) continue;
        if (++processed > MAX_EVENTS) throw failure('event-limit', 'Background mix exceeds the bounded event budget.');
        s.now = e.at;
        try { e.fn(); } catch (error) { if (!error.ambienceId) error.ambienceId = e.env.id; throw error; }
        if (e.period && e.env.alive()) push({ ...e, id: ++serial, at: s.now + e.period });
      }
    };
    return s;
  }
  function graph(context, clock) {
    const nodes = new Set(), sourceStarted = new WeakSet();
    function track(node) {
      if (node && typeof node.disconnect === 'function') {
        nodes.add(node); if (nodes.size > MAX_NODES) throw failure('node-limit', 'Background mix exceeds the bounded audio node budget.');
      } return node;
    }
    // Native source start() defaults to zero. Builders that omit an argument
    // must instead start at their virtual callback time, including recurring notes.
    function source(node) {
      track(node);
      const start = node.start?.bind(node);
      if (start) node.start = function (time, ...args) {
        const at = time === undefined ? clock.now : Math.max(0, finite(time, clock.now));
        const r = start(at, ...args); sourceStarted.add(node); return r;
      };
      return node;
    }
    const methods = new Map();
    const proxy = new Proxy(context, { get(target, key) {
      if (key === 'currentTime') return clock.now;
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key)) methods.set(key, (...args) => {
        const result = value.apply(target, args);
        return /^create(?:Oscillator|BufferSource|ConstantSource)$/.test(String(key)) ? source(result) : track(result);
      });
      return methods.get(key);
    } });
    function env(id) {
      let alive = true; const ownSources = new Set();
      const E = { id, alive: () => alive, n: track, __gec: track,
        play(node) { track(node); ownSources.add(node); if (!sourceStarted.has(node)) { node.start(clock.now); sourceStarted.add(node); } return node; },
        later(fn, ms) { if (!alive) return 0; return clock.later(E, fn, ms); },
        every(fn, ms) { if (!alive) return 0; const seconds = Math.max(.001, finite(ms, 0) / 1000); return clock.later(E, fn, ms, seconds); },
        // Disconnecting while constructing an Offline graph would erase the
        // earlier note too. Finite nodes stay connected until rendering ends;
        // their native stop/envelope still limits their actual audible lifetime.
        gecici(list) { (list || []).forEach(track); },
        kill(fade, out) {
          if (!alive) return; alive = false;
          const seconds = Math.max(0, finite(fade, 0));
          if (out?.gain) out.gain.setTargetAtTime(.0001, clock.now, Math.max(.001, seconds / 3));
          ownSources.forEach(node => { try { node.stop(clock.now + seconds + .12); } catch (_) {} });
        }
      }; return E;
    }
    return { proxy, env, track, nodes, dispose() { nodes.forEach(node => { try { node.disconnect(); } catch (_) {} }); nodes.clear(); } };
  }
  function gain(c, v) { const n = c.createGain(); n.gain.value = v; return n; }
  function filter(c, type, hz, q = .7) { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = hz; n.Q.value = q; return n; }
  function makeNoise(c, type) {
    const length = Math.round(c.sampleRate * 3), buffer = c.createBuffer(1, length, c.sampleRate), data = buffer.getChannelData(0);
    if (type === 'pink') { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) { const w = Math.random() * 2 - 1;
        b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
      }
    } else if(type==='brown'){let last=0;for(let i=0;i<length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}} else { for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1; }
    return buffer;
  }
  function makeReverb(c) {
    const length = Math.round(c.sampleRate * 2.8), b = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5); }
    const n = c.createConvolver(); n.buffer = b; return n;
  }
  function protectedBus(c, eq) {
    const input = gain(c, 1), bas = filter(c, 'lowshelf', 180), orta = filter(c, 'peaking', 1000, .9), tiz = filter(c, 'highshelf', 4000);
    bas.gain.value = clamp(eq?.bas, -12, 12); orta.gain.value = clamp(eq?.orta, -12, 12); tiz.gain.value = clamp(eq?.tiz, -12, 12);
    input.connect(bas); bas.connect(orta); orta.connect(tiz); let last = tiz;
    if (eq?.komp) {
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -26; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .28;
      last.connect(comp); last = comp;
    }
    const lp = filter(c, 'lowpass', Math.min(18000, c.sampleRate * .45)), limiter = c.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = .002; limiter.release.value = .18;
    last.connect(lp); lp.connect(limiter); limiter.connect(c.destination); return input;
  }
  function spatial(c, output, seconds, depth, hrtf = false) {
    if (!hrtf) {
      const p = c.createStereoPanner(), o = c.createOscillator(), g = gain(c, depth); p.pan.value = 0; o.frequency.value = 1 / Math.max(4, seconds);
      o.connect(g); g.connect(p.pan); o.start(0); p.connect(output); return p;
    }
    const p = c.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1; p.maxDistance = 100; p.rolloffFactor = .5;
    if (!p.positionX || !p.positionY || !p.positionZ || !c.createPeriodicWave) throw failure('spatial-unavailable', 'Offline spatial audio is not supported by this browser.');
    p.positionX.value = p.positionY.value = p.positionZ.value = 0;
    [[p.positionX, 1, 1.6, false], [p.positionZ, 1, 1.6, true], [p.positionY, .5, .35, false]].forEach(([param, rate, amount, cos]) => {
      const o = c.createOscillator(), g = gain(c, amount); o.frequency.value = rate / Math.max(4, seconds);
      if (cos) o.setPeriodicWave(c.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
      o.connect(g); g.connect(param); o.start(0);
    }); p.connect(output); return p;
  }
  function frequency(c, bus, config, adapter) {
    if (config?.secondary?.playing && finite(config.vol, .5) > 0) {
      const second = config.secondary, carrier = finite(second.c, 100), beat = clamp(finite(second.b, 2.5), .5, 40);
      if (carrier - beat / 2 < 1 || carrier + beat / 2 >= c.sampleRate / 2) throw failure('secondary-frequency-range', 'The secondary stereo carrier exceeds the offline sample rate.');
      const merge = c.createChannelMerger(2), left = c.createOscillator(), right = c.createOscillator(), gl = gain(c, .5), gr = gain(c, .5), out = gain(c, finite(config.secondaryLevel, clamp(finite(config.vol, .5), 0, 1) * .22));
      left.frequency.value = carrier - beat / 2; right.frequency.value = carrier + beat / 2;
      left.connect(gl); right.connect(gr); gl.connect(merge, 0, 0); gr.connect(merge, 0, 1); merge.connect(out); out.connect(bus); left.start(0); right.start(0);
    }
    if (!config?.playing || !(finite(config.vol, .5) > 0)) return;
    const vol = clamp(finite(config.vol, .5), 0, 1), mode = String(config.mode || 'bin'), beat = clamp(finite(config.b, 7.83), .01, 100);
    const carrier = finite(config.c, 180), nyquist = c.sampleRate / 2;
    if (carrier - beat / 2 < 1 || carrier + beat / 2 >= nyquist) throw failure('frequency-range', 'The selected stereo carrier exceeds the offline sample rate.');
    if (!['bin', 'mono', 'iso', 'mix'].includes(mode)) throw failure('frequency-mode', 'Unknown background frequency mode.');
    const out = gain(c, finite(config.outputLevel, vol * .35)); out.connect(bus);
    const balanced=gain(c,1);balanced.channelCount=2;balanced.channelCountMode='explicit';
    const splitter=c.createChannelSplitter(2),merger=c.createChannelMerger(2),balL=gain(c,clamp(finite(config.balL,1),0,1)),balR=gain(c,clamp(finite(config.balR,1),0,1));
    balanced.connect(splitter);splitter.connect(balL,0);splitter.connect(balR,1);balL.connect(merger,0,0);balR.connect(merger,0,1);merger.connect(out);
    let filtered=balanced;
    if(config.filterOn){const lp=filter(c,'lowpass',clamp(finite(config.lpf,2000),200,Math.min(8000,c.sampleRate*.45)),1),hp=filter(c,'highpass',clamp(finite(config.hpf,80),20,Math.min(2000,c.sampleRate*.45)),1);lp.connect(hp);hp.connect(balanced);filtered=lp;}
    const target = config.uzam ? spatial(c, filtered, finite(config.uzamHiz, 22), .85, true) : filtered;
    const wave=['sine','square','sawtooth','triangle'].includes(config.wave)?config.wave:'sine';
    function tone(hz, level, output = target, type = wave) { const o = c.createOscillator(), g = gain(c, level); o.type = type; o.frequency.value = hz; o.connect(g); g.connect(output); o.start(0); return o; }
    if (mode === 'bin' || mode === 'mix') {
      const merge = c.createChannelMerger(2), gl = gain(c, .5), gr = gain(c, .5), bg = gain(c, mode === 'mix' ? .6 : 1);
      const l = c.createOscillator(), r = c.createOscillator();l.type=r.type=wave; l.frequency.value = carrier - beat / 2; r.frequency.value = carrier + beat / 2;
      l.connect(gl); r.connect(gr); gl.connect(merge, 0, 0); gr.connect(merge, 0, 1); merge.connect(bg); bg.connect(target); l.start(0); r.start(0);
    } else if (mode === 'mono') { tone(carrier - beat / 2, .42); tone(carrier + beat / 2, .42); }
    if (mode === 'iso' || mode === 'mix') {
      const o = c.createOscillator(), amp = gain(c, 0), bias = c.createConstantSource(), gate = c.createOscillator(), lp = filter(c, 'lowpass', 45), depth = gain(c, .48), isoMix = gain(c, mode === 'mix' ? .5 : 1);
      o.type=wave;o.frequency.value = carrier; bias.offset.value = .5; gate.type = 'square'; gate.frequency.value = beat;
      bias.connect(amp.gain); gate.connect(lp); lp.connect(depth); depth.connect(amp.gain); o.connect(amp); amp.connect(isoMix); isoMix.connect(target);
      o.start(0); bias.start(0); gate.start(0);
    }
    let ratios = config.harmonicRatios;
    if (!Array.isArray(ratios)) { const seri = { dogal: [2, 3, 4, 5], tek: [3, 5, 7, 9], oktav: [2, 4, 8, 16] }; ratios = (seri[config.harmSeri] || seri.dogal).slice(0, clamp(config.harmonik, 0, 4)); }
    ratios.slice(0, 8).forEach(x => { const ratio = finite(Array.isArray(x) ? x[0] : x, 0), hz = carrier * ratio; if (ratio > 0 && hz <= Math.min(18000, nyquist-100)) tone(hz, Array.isArray(x) ? clamp(x[1], 0, 1) : .34 / ratio,target,'sine'); });
    if(['white','pink','brown'].includes(config.noise)&&config.noiseVol>0){const n=c.createBufferSource(),g=gain(c,clamp(config.noiseVol,0,1)*.25);n.buffer=adapter?.noise?.(config.noise)||makeNoise(c,config.noise);n.loop=true;n.connect(g);g.connect(target);n.start(0);}
    if (config.pink) { const n = c.createBufferSource(), lp = filter(c, 'lowpass', Math.min(3200, nyquist * .9)), g = gain(c, finite(config.pinkLevel,vol * .12)); n.buffer = adapter?.noise?.('pink') || makeNoise(c, 'pink'); n.loop = true; n.connect(lp); lp.connect(g); g.connect(bus); n.start(0); }
  }
  function hybrid(c, output, buffer, mix, horizon) {
    if (!buffer || typeof buffer.getChannelData !== 'function' || !(buffer.duration >= 1)) throw failure('hybrid-decode-failed', 'The hybrid ambience layer requires a valid decoded audio buffer.');
    const duration = buffer.duration, xfade = Math.min(1.25, Math.max(.12, duration * .08)), step = Math.max(.5, duration - xfade), field = gain(c, mix); field.connect(output);
    // Plan the real recording's complete overlap sequence in audio time.
    // This preserves the existing hybrid balance without its 1.8–7 s timer.
    for (let t = .04; t < horizon; t += step) {
      const n = c.createBufferSource(), g = gain(c, 0), end = t + duration; n.buffer = buffer; n.connect(g); g.connect(field);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + xfade); g.gain.setValueAtTime(1, Math.max(t + xfade, end - xfade)); g.gain.linearRampToValueAtTime(.0001, end);
      n.start(t); n.stop(end + .03);
    }
  }
  function wav(buffer, duration) {
    const sampleRate = buffer.sampleRate, frames = Math.round(duration * sampleRate), seam = Math.max(2, Math.round(SEAM_SECONDS * sampleRate)), warmup = Math.round(WARMUP * sampleRate);
    const data = [new Float32Array(frames), new Float32Array(frames)]; let peak = 0, energy = 0;
    for (let ch = 0; ch < 2; ch++) { const raw = buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1)), d = data[ch];
      if (raw.length < warmup + seam + frames) throw failure('short-render', 'Offline mix has fewer samples than its declared loop duration.');
      d.set(raw.subarray(warmup + seam, warmup + seam + frames));
      for (let i = 0; i < seam; i++) { const weight = (i + 1) / seam, at = frames - seam + i; d[at] = d[at] * (1 - weight) + raw[warmup + i] * weight; }
      for (let i = 0; i < frames; i++) { const v = d[i]; if (!Number.isFinite(v)) throw failure('non-finite-audio', 'Offline mix contains invalid samples.'); peak = Math.max(peak, Math.abs(v)); energy += v * v; }
    }
    const scale = peak > .95 ? .95 / peak : 1;
    const bytes = new ArrayBuffer(44 + frames * 4), v = new DataView(bytes);
    function word(offset, s) { for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i)); }
    word(0, 'RIFF'); v.setUint32(4, 36 + frames * 4, true); word(8, 'WAVE'); word(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); word(36, 'data'); v.setUint32(40, frames * 4, true);
    for (let i = 0, at = 44; i < frames; i++) for (let ch = 0; ch < 2; ch++, at += 2) { const x = clamp(data[ch][i] * scale, -1, 1); v.setInt16(at, Math.round(x * (x < 0 ? 32768 : 32767)), true); }
    return { blob: new Blob([bytes], { type: 'audio/wav' }), duration: frames / sampleRate, sampleRate, channels: 2, peak: peak * scale, rms: Math.sqrt(energy / (frames * 2)) * scale, scaledBy: scale, seamMs: seam / sampleRate * 1000, warmupSeconds: WARMUP };
  }
  async function render(snapshot, adapter = {}) {
    assertCurrent(adapter);
    if (typeof adapter.withContext !== 'function') throw failure('adapter-required', 'A synchronous live-context binding adapter is required.');
    const Context = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!Context) throw failure('offline-unavailable', 'Offline audio preparation is not supported by this browser.');
    const entries = Array.isArray(snapshot?.ambiences) ? snapshot.ambiences.map(entry => ({ ...entry })) : [];
    if (entries.length > MAX_CHANNELS) throw failure('channel-limit', 'Too many background ambience channels.');
    const sampleRate = Math.round(clamp(finite(snapshot?.sampleRate, 44100), 8000, 96000));
    // Decode custom channels before lexical ctx is rebound; callers can supply
    // already validated buffers. A missing custom source must never be omitted.
    const decoded = await Promise.all(entries.map(async entry => {
      if (!(finite(entry?.volume, .5) > 0)) return null;
      if ((entry?.hybridBlob || entry?.hybridKey) && !entry.hybridDecoded) {
        if (typeof adapter.decodeHybrid !== 'function') throw failure('hybrid-decode-required', 'Hybrid ambience requires a decoded audio buffer: ' + String(entry.id || 'unknown'));
        entry.hybridDecoded = await adapter.decodeHybrid(entry); assertCurrent(adapter);
        if (!entry.hybridDecoded) throw failure('hybrid-decode-failed', 'Hybrid ambience could not be decoded: ' + String(entry.id || 'unknown'));
      }
      if (entry?.hybridDecoded && (typeof entry.hybridDecoded.getChannelData !== 'function' || !(entry.hybridDecoded.duration >= 1))) throw failure('hybrid-decode-failed', 'Invalid decoded hybrid ambience: ' + String(entry.id || 'unknown'));
      if (!entry?.url) return entry?.decoded || null;
      if (entry.decoded) return entry.decoded;
      if (typeof adapter.decode !== 'function') throw failure('custom-decode-required', 'Custom ambience requires a decoded audio buffer: ' + String(entry.id || 'unknown'));
      const b = await adapter.decode(entry.url, entry); assertCurrent(adapter);
      if (!b || typeof b.getChannelData !== 'function' || !(b.duration > 0)) throw failure('custom-decode-failed', 'Custom ambience could not be decoded: ' + String(entry.id || 'unknown'));
      return b;
    }));
    assertCurrent(adapter);
    const horizon = DURATION + WARMUP + SEAM_SECONDS, context = new Context(2, Math.ceil(horizon * sampleRate), sampleRate), clock = scheduler(horizon), G = graph(context, clock);
    let graphBuilt = false;
    try {
      const callbackResult = adapter.withContext(G.proxy, () => {
        assertCurrent(adapter); const c = G.proxy, bus = protectedBus(c, snapshot?.eq), wet = makeReverb(c); wet.connect(bus);
        entries.forEach((entry, index) => {
          const def = entry?.def, volume = clamp(finite(entry?.volume, .5), 0, 1); if (!volume) return;
          if (!def || (!decoded[index] && typeof def.build !== 'function')) throw failure('invalid-ambience', 'Missing ambience builder: ' + String(entry?.id || 'unknown'));
          const E = G.env(String(entry.id || def.id || index)), out = gain(c, volume * finite(def.cal, 1)), wetLevel = gain(c, clamp(finite(def.wet, .25), 0, 1));
          out.connect(wetLevel); wetLevel.connect(wet);
          const dry = snapshot?.spatial ? spatial(c, bus, 2 * Math.PI / (.12 + index * .035), .85) : bus; out.connect(dry);
          if (decoded[index]) { const n = c.createBufferSource(); n.buffer = decoded[index]; n.loop = true; n.connect(out); E.play(n); }
          else {
            const mix = entry.hybridDecoded ? clamp(finite(entry.hybridMix, .42), 0, 1) : 0, synth = gain(c, 1 - .55 * mix); synth.connect(out);
            try { def.build(E, synth); if (entry.hybridDecoded) hybrid(c, out, entry.hybridDecoded, mix, horizon); } catch (error) { error.ambienceId = E.id; throw error; }
          }
        });
        frequency(c, bus, snapshot?.frequency, adapter); clock.run(adapter); graphBuilt = true;
      });
      if (callbackResult && typeof callbackResult.then === 'function') throw failure('async-adapter', 'The context binding adapter must restore synchronously.');
      if (!graphBuilt) throw failure('adapter-not-run', 'The context binding adapter did not run its callback.');
      const nodeCount = G.nodes.size; assertCurrent(adapter);
      const buffer = await context.startRendering(); assertCurrent(adapter);
      const result = wav(buffer, DURATION);
      // Deliberately muted snapshots may produce digital zero. An expected
      // audible snapshot producing zero is evidence of a failed graph.
      const f = snapshot?.frequency, vol = clamp(finite(f?.vol, .5), 0, 1);
      const stereoOpen = clamp(finite(f?.balL, 1), 0, 1) > 0 || clamp(finite(f?.balR, 1), 0, 1) > 0;
      const mainAudible = f?.playing && vol > 0 && ((stereoOpen && finite(f.outputLevel, vol * .35) > 0) || (f.pink && finite(f.pinkLevel, vol * .12) > 0));
      const secondaryAudible = f?.secondary?.playing && vol > 0 && finite(f.secondaryLevel, vol * .22) > 0;
      const audibleExpected = entries.some(x => finite(x?.volume, .5) > 0) || mainAudible || secondaryAudible;
      if (audibleExpected && result.peak < 1 / 32768) throw failure('silent-render', 'The background mix rendered silence.');
      return { ...result, version: VERSION, virtualEvents: clock.processed, nodes: nodeCount, ambienceCount: entries.length, frequency: !!snapshot?.frequency?.playing, secondaryFrequency: !!snapshot?.frequency?.secondary?.playing };
    } finally { G.dispose(); }
  }
  root.SukunBackgroundMixRenderer = Object.freeze({ version: VERSION, duration: DURATION, render });
})(window);
