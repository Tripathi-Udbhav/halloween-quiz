// Spooky sounds, synthesised in the browser with Web Audio (no audio files needed).
// Browsers only allow sound after a tap/click, so call Sound.unlock() from a click handler.
const Sound = (() => {
  let ctx = null;
  let master = null;
  let echo = null;
  let noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('hq-muted') === '1'; } catch {}

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(comp);

      // echo bus for a cavernous, crypt-like feel
      echo = ctx.createGain();
      echo.gain.value = 0.35;
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.22;
      const fb = ctx.createGain();
      fb.gain.value = 0.38;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      echo.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(master);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const ready = () => ctx && !muted;
  const out = (node, wet = 0) => {
    node.connect(master);
    if (wet) {
      const g = ctx.createGain();
      g.gain.value = wet;
      node.connect(g);
      g.connect(echo);
    }
  };

  function noise(t, dur) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
    return src;
  }

  function distortion(amount) {
    const ws = ctx.createWaveShaper();
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * 2 - 1;
      curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    ws.curve = curve;
    return ws;
  }

  // One voiced syllable: glottal buzz through vowel formant filters, with a breathy "h" onset.
  function syllable({ t, dur, f0, f1End, formants, gain = 0.5, breath = 0.12, vibrato = 4, sub = 0, rough = 6, wet = 0.5 }) {
    const end = t + dur;
    const voice = ctx.createGain();
    voice.gain.value = 0;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1End || f0 * 0.85, end);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = vibrato;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const shaper = distortion(rough);
    osc.connect(shaper);

    if (sub) {
      // an octave below for a demonic layer
      const o2 = ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(f0 / 2, t);
      o2.frequency.exponentialRampToValueAtTime((f1End || f0 * 0.85) / 2, end);
      const g2 = ctx.createGain();
      g2.gain.value = sub;
      o2.connect(g2);
      g2.connect(shaper);
      o2.start(t);
      o2.stop(end + 0.05);
    }

    for (const [freq, q, g] of formants) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;
      const fg = ctx.createGain();
      fg.gain.value = g;
      shaper.connect(bp);
      bp.connect(fg);
      fg.connect(voice);
    }

    // breathy "h"
    const h = noise(t - 0.05, dur);
    const hbp = ctx.createBiquadFilter();
    hbp.type = 'bandpass';
    hbp.frequency.value = formants[1][0];
    hbp.Q.value = 1.2;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0, t - 0.05);
    hg.gain.linearRampToValueAtTime(breath * 3, t);
    hg.gain.exponentialRampToValueAtTime(breath * 0.4, t + 0.06);
    hg.gain.exponentialRampToValueAtTime(0.0001, end);
    h.connect(hbp);
    hbp.connect(hg);
    hg.connect(voice);

    voice.gain.setValueAtTime(0, t);
    voice.gain.linearRampToValueAtTime(gain, t + 0.025);
    voice.gain.setValueAtTime(gain, t + dur * 0.55);
    voice.gain.exponentialRampToValueAtTime(0.0001, end);

    out(voice, wet);
    osc.start(t);
    lfo.start(t);
    osc.stop(end + 0.05);
    lfo.stop(end + 0.05);
  }

  const VOWEL_A = [[730, 7, 1], [1090, 9, 0.55], [2440, 12, 0.25]];
  const VOWEL_E = [[530, 7, 1], [1840, 10, 0.6], [2480, 12, 0.3]];
  const VOWEL_U = [[400, 6, 1], [800, 8, 0.5], [2200, 10, 0.12]];

  function evilLaugh() {
    if (!ready()) return;
    const t = ctx.currentTime + 0.05;
    // "Mwa-ha-ha-ha-haaa"
    syllable({ t, dur: 0.42, f0: 150, f1End: 128, formants: VOWEL_A, gain: 0.55, breath: 0.03, sub: 0.5, vibrato: 3 });
    const pitches = [165, 150, 138, 128, 118];
    pitches.forEach((p, i) => {
      syllable({ t: t + 0.52 + i * 0.2, dur: 0.17, f0: p, f1End: p * 0.82, formants: VOWEL_A, gain: 0.5, breath: 0.14, sub: 0.45 });
    });
    syllable({ t: t + 0.52 + pitches.length * 0.2, dur: 0.85, f0: 112, f1End: 72, formants: VOWEL_A, gain: 0.55, breath: 0.12, sub: 0.5, vibrato: 7 });
    thunder(0.5, 0.35);
  }

  function cackle() {
    if (!ready()) return;
    const t = ctx.currentTime + 0.03;
    for (let i = 0; i < 7; i++) {
      const p = 520 - i * 18 + (i % 2) * 40;
      syllable({ t: t + i * 0.11, dur: 0.1, f0: p, f1End: p * 0.9, formants: VOWEL_E, gain: 0.32, breath: 0.1, vibrato: 18, rough: 3, wet: 0.3 });
    }
    syllable({ t: t + 0.8, dur: 0.45, f0: 560, f1End: 380, formants: VOWEL_E, gain: 0.32, breath: 0.08, vibrato: 25, rough: 3, wet: 0.4 });
  }

  function groan(pitch = 1) {
    if (!ready()) return;
    const t = ctx.currentTime + 0.02;
    syllable({ t, dur: 1.2, f0: 82 * pitch, f1End: 58 * pitch, formants: VOWEL_U, gain: 0.6, breath: 0.08, sub: 0.3, vibrato: 2, rough: 14, wet: 0.4 });
  }

  function thunder(delay = 0, level = 1) {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const crack = noise(t, 0.3);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.5 * level, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    crack.connect(hp);
    hp.connect(cg);
    out(cg, 0.3);

    const rumble = noise(t, 2.6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(70, t + 2.5);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0, t);
    rg.gain.linearRampToValueAtTime(1.1 * level, t + 0.08);
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    rumble.connect(lp);
    lp.connect(rg);
    out(rg, 0.2);
  }

  function blip(f0 = 700, f1 = 300, dur = 0.09, type = 'sine', level = 0.25) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    out(g, 0.15);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // cauldron "bloop" when an answer is picked
  function bubble() {
    if (!ready()) return;
    [0, 0.07, 0.15].forEach((d, i) => setTimeout(() => blip(220 + i * 120, 700 + i * 200, 0.08, 'sine', 0.22), d * 1000));
  }

  function squeak() { blip(2400, 3600, 0.06, 'triangle', 0.12); setTimeout(() => blip(2600, 3800, 0.05, 'triangle', 0.1), 70); }
  function pop() { blip(500, 120, 0.12, 'triangle', 0.3); }
  function ghost() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(380, t);
    o.frequency.linearRampToValueAtTime(620, t + 0.35);
    o.frequency.linearRampToValueAtTime(300, t + 0.9);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6;
    const lg = ctx.createGain();
    lg.gain.value = 18;
    lfo.connect(lg);
    lg.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    o.connect(g);
    out(g, 0.6);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1);
    lfo.stop(t + 1);
  }

  function heartbeat() {
    if (!ready()) return;
    [0, 0.18].forEach((d, i) => {
      const t = ctx.currentTime + d;
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(70, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(i ? 0.5 : 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g);
      out(g);
      o.start(t);
      o.stop(t + 0.22);
    });
  }

  function drumroll(seconds = 1.6) {
    if (!ready()) return;
    const t0 = ctx.currentTime;
    for (let t = 0; t < seconds; t += 0.035) {
      const at = t0 + t;
      const n = noise(at, 0.05);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 260;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      const lvl = 0.12 + (t / seconds) * 0.5;
      g.gain.setValueAtTime(lvl, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      n.connect(bp);
      bp.connect(g);
      out(g);
    }
    // cymbal crash + boom at the end
    const at = t0 + seconds;
    const c = noise(at, 1.6);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.45, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
    c.connect(hp);
    hp.connect(cg);
    out(cg, 0.3);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(90, at);
    o.frequency.exponentialRampToValueAtTime(40, at + 0.6);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.9, at);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
    o.connect(og);
    out(og);
    o.start(at);
    o.stop(at + 0.75);
  }

  // haunted-organ fanfare for the winner
  function fanfare() {
    if (!ready()) return;
    const notes = [146.8, 174.6, 220, 293.7, 349.2, 440];
    const t0 = ctx.currentTime + 0.05;
    const play = (f, at, dur, lvl) => {
      [1, 2, 3].forEach((h, k) => {
        const o = ctx.createOscillator();
        o.type = k ? 'sine' : 'sawtooth';
        o.frequency.value = f * h;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(lvl / (k + 1), at + 0.04);
        g.gain.setValueAtTime(lvl / (k + 1), at + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(lp);
        lp.connect(g);
        out(g, 0.5);
        o.start(at);
        o.stop(at + dur + 0.05);
      });
    };
    notes.forEach((f, i) => play(f, t0 + i * 0.12, 0.3, 0.12));
    [293.7, 349.2, 440, 587.3].forEach((f) => play(f, t0 + notes.length * 0.12, 1.8, 0.1));
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('hq-muted', m ? '1' : '0'); } catch {}
    if (master) master.gain.value = m ? 0 : 0.9;
  }

  return {
    unlock, evilLaugh, cackle, groan, thunder, bubble, squeak, pop, ghost, heartbeat, drumroll, fanfare,
    setMuted, isMuted: () => muted,
  };
})();
