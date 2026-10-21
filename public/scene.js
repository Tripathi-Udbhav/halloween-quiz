// The haunted night scene shared by the player and host screens:
// starry purple-black sky, moon, graveyard, bats, a flying witch, zombies and Frankenstein.
// Scenery is vector (SVG) or a DPR-aware canvas, so it stays crisp on HD screens and projectors.
const Scene = (() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const isHost = document.body.classList.contains('host');
  const small = () => window.innerWidth < 640;
  let mode = 'join';

  // ---------- SVG artwork ----------
  // the characters are the artwork in public/img (backgrounds removed); they face left
  const charImg = (name, cls = '') => `<img class="char-img ${cls}" src="img/${name}.webp" alt="" draggable="false" decoding="async">`;

  const BAT_SVG = `
  <svg viewBox="0 0 100 50" class="bat-svg" aria-hidden="true">
    <g class="wing wing-l" style="transform-origin:50px 24px"><path d="M48 24 Q34 4 4 10 Q14 16 12 24 Q22 20 26 30 Q34 22 40 32 Q44 24 48 28 Z" fill="#0d0613"/></g>
    <g class="wing wing-r" style="transform-origin:50px 24px"><path d="M52 24 Q66 4 96 10 Q86 16 88 24 Q78 20 74 30 Q66 22 60 32 Q56 24 52 28 Z" fill="#0d0613"/></g>
    <ellipse cx="50" cy="27" rx="7" ry="10" fill="#140a1d"/>
    <path d="M44 18 L45 10 L48 16 L52 16 L55 10 L56 18 Z" fill="#140a1d"/>
    <circle cx="47.5" cy="21" r="1.6" fill="#ff3355"/><circle cx="52.5" cy="21" r="1.6" fill="#ff3355"/>
  </svg>`;

  const HAND_SVG = (skin) => `
  <svg viewBox="0 0 60 120" aria-hidden="true">
    <g class="hand-arm">
      <rect x="20" y="52" width="20" height="70" rx="8" fill="${skin}"/>
      <path d="M18 70 l24 -4 l-2 10 l-22 4 Z" fill="#3f4f3a"/>
      <rect x="14" y="30" width="32" height="28" rx="10" fill="${skin}"/>
      <g class="fingers">
        <rect x="14" y="8" width="7" height="28" rx="3.5" fill="${skin}"/>
        <rect x="22" y="2" width="7" height="32" rx="3.5" fill="${skin}"/>
        <rect x="30" y="4" width="7" height="30" rx="3.5" fill="${skin}"/>
        <rect x="38" y="10" width="6" height="26" rx="3" fill="${skin}"/>
        <rect x="4" y="34" width="14" height="7" rx="3.5" fill="${skin}" transform="rotate(-30 10 38)"/>
      </g>
    </g>
  </svg>`;

  const PUMPKIN_SVG = `
  <svg viewBox="0 0 80 70" aria-hidden="true">
    <defs><radialGradient id="pk" cx=".5" cy=".4"><stop offset="0" stop-color="#ffb347"/><stop offset=".7" stop-color="#ff7a1a"/><stop offset="1" stop-color="#b8450a"/></radialGradient></defs>
    <path d="M38 12 q2 -10 10 -10" stroke="#3d5a1e" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="22" cy="40" rx="16" ry="25" fill="url(#pk)"/>
    <ellipse cx="58" cy="40" rx="16" ry="25" fill="url(#pk)"/>
    <ellipse cx="40" cy="40" rx="18" ry="27" fill="url(#pk)"/>
    <g class="pk-face" fill="#2a0e00">
      <path d="M24 32 l8 -8 l6 10 Z"/><path d="M56 32 l-8 -8 l-6 10 Z"/>
      <path d="M38 38 l4 -6 l4 6 Z"/>
      <path d="M20 46 q20 18 40 0 l-6 2 l-3 -4 l-4 5 l-5 -5 l-5 5 l-4 -5 l-3 4 Z"/>
    </g>
  </svg>`;

  // the haunted house the witch lives in; the round attic window at (150,128) is her door
  const HOUSE_SVG = `
  <svg viewBox="0 0 300 340" aria-hidden="true">
    <defs>
      <radialGradient id="hwin"><stop offset="0" stop-color="#fff2b0"/><stop offset=".55" stop-color="#ffb347"/><stop offset="1" stop-color="#e0560a"/></radialGradient>
      <linearGradient id="hwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0b2b"/><stop offset="1" stop-color="#0a0410"/></linearGradient>
    </defs>
    <g fill="url(#hwall)" stroke="rgba(170,110,255,.45)" stroke-width="2" stroke-linejoin="round">
      <rect x="196" y="74" width="20" height="70"/>
      <path d="M190 74 h32 v8 h-32 Z"/>
      <path d="M72 340 L66 176 L236 168 L230 340 Z"/>
      <path d="M48 182 L150 66 L254 174 Z"/>
      <path d="M28 340 L32 112 L80 110 L84 340 Z"/>
      <path d="M20 118 L58 6 L92 116 Z"/>
    </g>
    <path d="M70 160 L150 76 M90 150 L160 90 M200 150 L150 96 M230 166 L170 110" stroke="rgba(170,110,255,.25)" stroke-width="1.5"/>
    <g class="hwin">
      <path d="M46 186 v-22 a12 12 0 0 1 24 0 v22 Z" fill="url(#hwin)"/>
      <rect x="96" y="200" width="32" height="40" fill="url(#hwin)"/>
      <rect x="176" y="198" width="32" height="40" fill="url(#hwin)"/>
      <rect x="176" y="266" width="32" height="34" fill="url(#hwin)" opacity=".85"/>
      <path d="M130 340 v-50 a20 20 0 0 1 40 0 v50 Z" fill="url(#hwin)" opacity=".55"/>
    </g>
    <g stroke="#0a0410" stroke-width="3">
      <path d="M112 200 v40 M96 220 h32 M192 198 v40 M176 218 h32 M192 266 v34 M58 164 v22"/>
    </g>
    <path d="M94 196 l-12 4 l2 44 l12 -4 Z" fill="#0f0618" transform="rotate(-8 88 220)"/>
    <circle class="attic-glow" cx="150" cy="128" r="22" fill="url(#hwin)"/>
    <circle cx="150" cy="128" r="22" fill="none" stroke="#0a0410" stroke-width="4"/>
    <g class="shutter sl" style="transform-origin:128px 128px"><path d="M128 106 h22 v44 h-22 Z" fill="#160822" stroke="rgba(170,110,255,.5)" stroke-width="1.5"/><path d="M132 114 h14 M132 124 h14 M132 134 h14 M132 144 h14" stroke="rgba(170,110,255,.3)"/></g>
    <g class="shutter sr" style="transform-origin:172px 128px"><path d="M150 106 h22 v44 h-22 Z" fill="#160822" stroke="rgba(170,110,255,.5)" stroke-width="1.5"/><path d="M154 114 h14 M154 124 h14 M154 134 h14 M154 144 h14" stroke="rgba(170,110,255,.3)"/></g>
    <path d="M120 340 h60 l-6 -8 h-48 Z" fill="#0a0410"/>
  </svg>`;

  // the silhouetted graveyard along the bottom of the screen
  function graveyardSVG() {
    const stone = (x, h, w, tilt, rip) => `
      <g transform="rotate(${tilt} ${x + w / 2} 250)">
        <path d="M${x} 252 V${252 - h + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V252 Z" fill="#0b0412" stroke="rgba(170,110,255,.38)" stroke-width="2"/>
        ${rip ? `<text x="${x + w / 2}" y="${252 - h + w / 2 + 14}" text-anchor="middle" font-family="Creepster, cursive" font-size="${w / 3.2}" fill="rgba(170,110,255,.45)">RIP</text>` : ''}
      </g>`;
    const cross = (x, h) => `
      <g fill="#0b0412" stroke="rgba(170,110,255,.38)" stroke-width="2">
        <rect x="${x}" y="${252 - h}" width="10" height="${h}"/><rect x="${x - 12}" y="${252 - h + 14}" width="34" height="9"/>
      </g>`;
    const fence = (() => {
      let s = '<g fill="#0a0410">';
      for (let x = 560; x < 1060; x += 22) s += `<rect x="${x}" y="196" width="5" height="60"/><path d="M${x - 3} 198 l5.5 -12 l5.5 12 Z"/>`;
      return s + '<rect x="556" y="206" width="508" height="4"/><rect x="556" y="236" width="508" height="4"/></g>';
    })();
    const tree = (x, flip) => `
      <g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)" fill="#07020c" stroke="rgba(170,110,255,.25)" stroke-width="1.5">
        <path d="M-10 256 Q-4 180 -14 120 Q-30 90 -70 70 Q-34 80 -16 100 Q-14 70 -40 30 Q-6 60 -4 100 Q4 60 30 40 Q12 76 8 110 Q30 96 64 92 Q28 110 10 140 Q2 190 12 256 Z"/>
      </g>`;
    return `
    <svg viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d0a2f"/><stop offset="1" stop-color="#0a0410"/></linearGradient>
      </defs>
      <path d="M0 200 Q200 150 420 186 T860 176 T1260 170 T1600 182 V260 H0 Z" fill="url(#hill)" opacity=".9"/>
      ${tree(150, false)}${tree(1460, true)}
      ${fence}
      ${stone(260, 70, 46, -6, true)}${stone(340, 52, 36, 4)}${cross(430, 74)}
      ${stone(1140, 78, 50, 5, true)}${stone(1240, 50, 34, -8)}${cross(1330, 62)}
      ${stone(700, 44, 32, 3)}${stone(880, 56, 40, -4, true)}
      <path d="M0 236 Q300 222 640 234 T1240 230 T1600 236 V260 H0 Z" fill="#040106"/>
    </svg>`;
  }

  // ---------- DOM setup ----------
  const root = document.createElement('div');
  root.className = 'scene';
  root.innerHTML = `
    <div class="nebula"><i></i><i></i><i></i></div>
    <canvas class="sky"></canvas>
    <div class="moon"><div class="crater c1"></div><div class="crater c2"></div><div class="crater c3"></div></div>
    <div class="clouds"><i></i><i></i><i></i></div>
    <div class="bats"></div>
    <div class="graveyard">${graveyardSVG()}</div>
    <button class="house" aria-label="haunted house">${HOUSE_SVG}</button>
    <div class="fog"><i></i><i></i></div>
    <div class="vignette"></div>
    <div class="lightning"><svg viewBox="0 0 100 300" preserveAspectRatio="none"><path d=""/></svg></div>`;
  document.body.prepend(root);

  // the characters live in their own layer, so on the waiting screens they can walk in front of the cards
  const ground = document.createElement('div');
  ground.className = 'ground-layer';
  ground.innerHTML = `
    <div class="hands"></div>
    <button class="pumpkin p-a" data-trick="embers" aria-label="pumpkin">${PUMPKIN_SVG}</button>
    <button class="pumpkin p-b" data-trick="ghosts" aria-label="pumpkin">${PUMPKIN_SVG}</button>
    <button class="pumpkin p-c" data-trick="candy" aria-label="pumpkin">${PUMPKIN_SVG}</button>
    <div class="walker zombie">${charImg('zombie')}</div>
    <div class="walker mummy">${charImg('mummy')}</div>
    <div class="walker frank">${charImg('frank')}</div>`;
  document.body.appendChild(ground);

  // the witch flies in a layer above the cards on the phones' waiting screens
  const skyLayer = document.createElement('div');
  skyLayer.className = 'sky-layer';
  skyLayer.innerHTML = `<div class="witch-wrap"><div class="witch" title="Tap me!">${charImg('witch')}</div></div>`;
  document.body.appendChild(skyLayer);

  // full-screen stage: the mummy lunges out at you, the zombie dances under disco lights
  const stage = document.createElement('div');
  stage.className = 'big-stage';
  stage.innerHTML = `<div class="backdrop"></div><div class="disco-lights">${'<i></i>'.repeat(6)}</div><div class="mover"><div class="flipper"><img class="char-img" alt="" draggable="false"></div></div>`;
  document.body.appendChild(stage);

  // Frankenstein's lightning bolts are drawn here
  const boltLayer = document.createElementNS(svgNS, 'svg');
  boltLayer.setAttribute('class', 'bolt-layer');
  document.body.appendChild(boltLayer);

  const fx = document.createElement('canvas');
  fx.className = 'fx';
  document.body.appendChild(fx);

  // ---------- canvas: stars, embers, tap sparks and tap-bats ----------
  const sky = root.querySelector('.sky');
  const sctx = sky.getContext('2d');
  const fctx = fx.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  let stars = [];
  const particles = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [sky, fx]) {
      c.width = W * DPR;
      c.height = H * DPR;
      c.style.width = W + 'px';
      c.style.height = H + 'px';
    }
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round((W * H) / 5000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.75,
      r: Math.random() * 1.3 + 0.3,
      p: Math.random() * Math.PI * 2,
      s: 0.5 + Math.random() * 2,
      hue: Math.random() < 0.25 ? 280 : 45,
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn(x, y, opts = {}) {
    const n = opts.n || 14;
    const colors = opts.colors || ['#ff7a1a', '#ffb347', '#b46bff', '#8cff5a', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (opts.speed || 3) * (0.4 + Math.random());
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, decay: 0.012 + Math.random() * 0.02, r: 1.5 + Math.random() * 2.5, c: colors[i % colors.length], g: opts.gravity ?? 0.05, kind: 'spark' });
    }
  }

  function emoji(x, y, ch, o = {}) {
    particles.push({ x, y, vx: o.vx || 0, vy: o.vy || -1, life: 1, decay: o.decay || 0.01, r: o.size || 28, g: o.g ?? 0.05, kind: 'emoji', ch, rot: 0, spin: o.spin || 0, sway: o.sway || 0, t: Math.random() * 6 });
  }

  function spawnBat(x, y) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, life: 1, decay: 0.008, r: 10 + Math.random() * 8, g: -0.02, kind: 'bat', t: Math.random() * 10 });
  }

  function drawBat(ctx, p) {
    const flap = Math.sin(p.t * 0.6) * 0.8;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    ctx.fillStyle = '#120818';
    ctx.strokeStyle = 'rgba(180,107,255,.6)';
    ctx.lineWidth = 1;
    const r = p.r;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-r * 0.6, -r * (0.6 + flap), -r * 1.6, -r * 0.2 * flap);
    ctx.quadraticCurveTo(-r, r * 0.1, -r * 0.8, r * 0.4);
    ctx.quadraticCurveTo(-r * 0.4, r * 0.1, 0, r * 0.5);
    ctx.quadraticCurveTo(r * 0.4, r * 0.1, r * 0.8, r * 0.4);
    ctx.quadraticCurveTo(r, r * 0.1, r * 1.6, -r * 0.2 * flap);
    ctx.quadraticCurveTo(r * 0.6, -r * (0.6 + flap), 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff3355';
    ctx.fillRect(-2.5, -1, 1.6, 1.6);
    ctx.fillRect(1, -1, 1.6, 1.6);
    ctx.restore();
  }

  let embers = [];
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    const t = now / 1000;

    sctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.s + s.p));
      sctx.fillStyle = `hsla(${s.hue}, 90%, 92%, ${a})`;
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fill();
    }
    if (embers.length < (small() ? 14 : 28) && Math.random() < 0.1) {
      embers.push({ x: Math.random() * W, y: H + 10, vy: -0.3 - Math.random() * 0.6, w: Math.random() * 2, r: 1 + Math.random() * 2, c: Math.random() < 0.6 ? '255,122,26' : '180,107,255', p: Math.random() * 6 });
    }
    embers = embers.filter((e) => e.y > -20);
    for (const e of embers) {
      e.y += e.vy * dt * 0.06;
      e.x += Math.sin(t + e.p) * 0.3;
      const a = Math.min(1, (H - e.y) / 200) * 0.8;
      const g = sctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
      g.addColorStop(0, `rgba(${e.c},${a})`);
      g.addColorStop(1, `rgba(${e.c},0)`);
      sctx.fillStyle = g;
      sctx.beginPath();
      sctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
      sctx.fill();
    }

    fctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy += p.g * dt * 0.06;
      p.life -= p.decay * dt * 0.06;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      if (p.kind === 'bat') { p.t += dt * 0.06; drawBat(fctx, p); continue; }
      if (p.kind === 'emoji') {
        p.t += dt * 0.004;
        p.rot += p.spin * dt * 0.06;
        fctx.save();
        fctx.globalAlpha = Math.min(1, p.life * 1.6);
        fctx.translate(p.x + Math.sin(p.t) * p.sway * 14, p.y);
        fctx.rotate(p.rot);
        fctx.font = `${p.r}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        fctx.textAlign = 'center';
        fctx.textBaseline = 'middle';
        fctx.fillText(p.ch, 0, 0);
        fctx.restore();
        continue;
      }
      fctx.globalAlpha = p.life;
      fctx.fillStyle = p.c;
      fctx.shadowColor = p.c;
      fctx.shadowBlur = 8;
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      fctx.fill();
    }
    fctx.globalAlpha = 1;
    fctx.shadowBlur = 0;

    updateWalkers(dt);
    updateBats(dt, t);
    witchTrail();
    requestAnimationFrame(frame);
  }

  // an expanding ring of light where something was tapped
  function ring(x, y, color = '#b46bff', size = 160) {
    const el = document.createElement('div');
    el.className = 'ring-burst';
    el.style.cssText = `left:${x}px;top:${y}px;--c:${color};--s:${size}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function restartClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el['_t' + cls]);
    el['_t' + cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  // ---------- tap anywhere: sparks + a little bat ----------
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input, .option, .btn')) return;
    spawn(e.clientX, e.clientY);
    if (Math.random() < 0.6) spawnBat(e.clientX, e.clientY);
  });

  // ---------- tap effects, one per character ----------
  const effects = {
    // Frankenstein hurls lightning bolts at whoever tapped him
    frank(w, r) {
      restartClass(w.el, 'zap', 1500);
      throwBolts(w, r);
      return 1800;
    },
    // the zombie busts out dance moves, big on screen, under disco lights
    zombie(w, r) {
      bigShow(w, r, { name: 'zombie', aspect: 623 / 760, mode: 'disco', duration: 4200 });
      return 4200;
    },
    // the mummy grows huge and lunges out of the screen
    mummy(w, r) {
      bigShow(w, r, { name: 'mummy', aspect: 903 / 1100, mode: 'lunge', duration: 3000 });
      return 3000;
    },
  };

  let onStage = false;
  function bigShow(w, r, { name, aspect, mode: kind, duration }) {
    if (onStage) return;
    onStage = true;
    const mover = stage.querySelector('.mover');
    const img = mover.querySelector('img');
    img.src = `img/${name}.webp`;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // as big as fits, centred on the screen
    const th = Math.min(vh * (kind === 'disco' ? 0.82 : 0.9), (vw * 0.96) / aspect);
    const tw = th * aspect;
    mover.style.width = tw + 'px';
    // positions are the centre of the character, and it scales/rotates around its centre,
    // so at full size it sits exactly in the middle of the screen
    const s0 = r.width / tw;
    const sx = r.left + r.width / 2 - tw / 2;
    const sy = r.top + r.height / 2 - th / 2;
    const tx1 = (vw - tw) / 2;
    const ty1 = (vh - th) / 2;
    // match the walker's facing so it grows out of the same pose
    mover.querySelector('.flipper').style.transform = w.dir > 0 ? 'scaleX(-1)' : '';
    const at = (x, y, sc, rot = 0) => `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
    w.el.style.opacity = '0';
    stage.className = 'big-stage show ' + kind;
    const frames = kind === 'disco'
      ? [
          { transform: at(sx, sy, s0), offset: 0, easing: 'cubic-bezier(.2,.9,.3,1.1)' },
          { transform: at(tx1, ty1, 1), offset: 0.14 },
          { transform: at(tx1, ty1, 1), offset: 0.84, easing: 'cubic-bezier(.6,0,.8,.4)' },
          { transform: at(sx, sy, s0), offset: 1 },
        ]
      : [
          { transform: at(sx, sy, s0), offset: 0, easing: 'cubic-bezier(.2,.9,.3,1.1)' },
          { transform: at(tx1, ty1 + th * 0.04, 1.12, -3), offset: 0.22 },
          { transform: at(tx1, ty1, 1.0, 2), offset: 0.3 },
          { transform: at(tx1, ty1 - 8, 1.04, -2), offset: 0.45 },
          { transform: at(tx1, ty1, 1.0, 2), offset: 0.6 },
          { transform: at(tx1, ty1, 1.03, -1), offset: 0.74, easing: 'cubic-bezier(.6,0,.8,.4)' },
          { transform: at(sx, sy, s0), offset: 1 },
        ];
    const anim = mover.animate(frames, { duration });
    if (kind === 'disco') {
      // confetti-coloured sparkles while it dances
      const party = setInterval(() => {
        spawn(Math.random() * vw, Math.random() * vh * 0.7, { n: 8, colors: ['#ff2e9a', '#2ee6ff', '#ffe066', '#8cff5a', '#b46bff'], speed: 3, gravity: 0.03 });
      }, 120);
      setTimeout(() => clearInterval(party), duration * 0.8);
    } else {
      setTimeout(() => {
        shake();
        // strips of old bandage flying everywhere
        spawn(vw / 2, vh * 0.45, { n: 70, colors: ['#e8d7a8', '#c9b07a', '#f4ecdf', '#8a6a3a'], speed: 9, gravity: 0.12 });
        ring(vw / 2, vh / 2, '#ffd27a', 600);
      }, 650);
    }
    setTimeout(() => stage.classList.remove('show'), duration * 0.78);
    anim.onfinish = () => {
      onStage = false;
      stage.className = 'big-stage';
      w.el.style.opacity = '';
    };
  }

  // a jagged bolt from (x0,y0) to (x1,y1), with a couple of forks
  function jaggedBolt(x0, y0, x1, y1, jag) {
    const n = 10;
    const pts = [[x0, y0]];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    for (let k = 1; k < n; k++) {
      const f = k / n;
      const off = (Math.random() - 0.5) * jag * Math.sin(f * Math.PI) * 2;
      pts.push([x0 + (x1 - x0) * f + nx * off, y0 + (y1 - y0) * f + ny * off]);
    }
    pts.push([x1, y1]);
    let d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    for (const k of [3, 6]) {
      const [bx, by] = pts[k];
      const ang = Math.atan2(y1 - y0, x1 - x0) + (Math.random() < 0.5 ? -0.7 : 0.7);
      const bl = len * 0.18;
      d += ` M${bx.toFixed(1)} ${by.toFixed(1)} L${(bx + Math.cos(ang) * bl * 0.5 + (Math.random() - 0.5) * 20).toFixed(1)} ${(by + Math.sin(ang) * bl * 0.5).toFixed(1)} L${(bx + Math.cos(ang) * bl).toFixed(1)} ${(by + Math.sin(ang) * bl).toFixed(1)}`;
    }
    return d;
  }

  // cracks in the "glass" where a bolt hits the screen
  function crackPath(x, y) {
    let d = '';
    const spokes = 7 + Math.floor(Math.random() * 4);
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2 + Math.random() * 0.4;
      const L = 50 + Math.random() * 90;
      let px = x, py = y;
      d += `M${x} ${y}`;
      for (let seg = 1; seg <= 3; seg++) {
        const aa = a + (Math.random() - 0.5) * 0.5;
        px += Math.cos(aa) * (L / 3);
        py += Math.sin(aa) * (L / 3);
        d += ` L${px.toFixed(1)} ${py.toFixed(1)}`;
      }
    }
    // a ring of shards around the impact
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * Math.PI * 2;
      const a1 = ((k + 1) / spokes) * Math.PI * 2;
      const rr = 26 + Math.random() * 14;
      d += ` M${(x + Math.cos(a0) * rr).toFixed(1)} ${(y + Math.sin(a0) * rr).toFixed(1)} L${(x + Math.cos(a1) * rr).toFixed(1)} ${(y + Math.sin(a1) * rr).toFixed(1)}`;
    }
    return d;
  }

  function throwBolts(w, r) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    boltLayer.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    // bolts leave from his outstretched hand
    const facesLeft = w.dir < 0;
    const hx = facesLeft ? r.left + r.width * 0.12 : r.right - r.width * 0.12;
    const hy = r.top + r.height * 0.45;
    const targets = [
      [vw * 0.5, vh * 0.38],
      [vw * (0.15 + Math.random() * 0.2), vh * (0.15 + Math.random() * 0.2)],
      [vw * (0.65 + Math.random() * 0.2), vh * (0.2 + Math.random() * 0.25)],
      [vw * (0.3 + Math.random() * 0.4), vh * (0.55 + Math.random() * 0.1)],
    ];
    targets.forEach(([tx, ty], k) => {
      setTimeout(() => {
        // a wide blue glow with a hot white core
        const d = jaggedBolt(hx, hy, tx, ty, Math.hypot(tx - hx, ty - hy) * 0.12);
        const bolt = document.createElementNS(svgNS, 'g');
        bolt.setAttribute('class', 'bolt');
        for (const cls of ['bolt-glow', 'bolt-core']) {
          const path = document.createElementNS(svgNS, 'path');
          path.setAttribute('d', d);
          path.setAttribute('class', cls);
          bolt.appendChild(path);
        }
        boltLayer.appendChild(bolt);
        const crack = document.createElementNS(svgNS, 'path');
        crack.setAttribute('d', crackPath(tx, ty));
        crack.setAttribute('class', 'crack');
        boltLayer.appendChild(crack);
        spawn(tx, ty, { n: 36, colors: ['#ffffff', '#d9f6ff', '#9ad8ff', '#fff36b'], speed: 7, gravity: 0.05 });
        ring(tx, ty, '#d9f6ff', 200);
        if (k === 0) { lightning(); shake(); }
        setTimeout(() => bolt.remove(), 1150);
        setTimeout(() => crack.remove(), 1800);
      }, k * 160);
    });
    spawn(hx, hy, { n: 30, colors: ['#ffffff', '#d9f6ff', '#fff36b'], speed: 5 });
  }

  // ---------- walkers: Frankenstein, the mummy and the zombie ----------
  const walkers = [
    { el: ground.querySelector('.frank'), kind: 'frank', speed: 12, x: 0.4, dir: 1, only: ['lobby', 'done'] },
    { el: ground.querySelector('.mummy'), kind: 'mummy', speed: 9, x: 0.05, dir: 1, only: ['join', 'lobby', 'done'] },
    { el: ground.querySelector('.zombie'), kind: 'zombie', speed: 8, x: 0.75, dir: -1, only: ['join', 'lobby', 'done'] },
  ];
  walkers.forEach((w) => {
    w.px = w.x * window.innerWidth;
    w.paused = 0;
    w.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      w.paused = effects[w.kind](w, w.el.getBoundingClientRect());
    });
  });

  function updateWalkers(dt) {
    const vw = window.innerWidth;
    // each visible character gets its own lane (mummy left, Frankenstein middle, zombie right)
    // and paces back and forth inside it, so they never pile on top of each other
    const lanes = ['mummy', 'frank', 'zombie'].filter((k) => walkers.find((w) => w.kind === k).only.includes(mode));
    for (const w of walkers) {
      const visible = w.only.includes(mode);
      const wasGone = w.el.classList.contains('gone');
      w.el.classList.toggle('gone', !visible);
      if (!visible) continue;
      const width = w.el.offsetWidth || 120;
      const lane = lanes.indexOf(w.kind);
      const laneW = vw / lanes.length;
      // stay fully inside the lane, so neighbours never overlap
      const lo = lane * laneW;
      const hi = Math.max(lo, (lane + 1) * laneW - width);
      if (wasGone) w.px = (lo + hi) / 2;
      else if (w.px < lo - 4 || w.px > hi + 4) w.px += ((lo + hi) / 2 - w.px) * 0.03;
      if (w.paused > 0) {
        w.paused -= dt;
      } else {
        w.px += w.dir * w.speed * (dt / 1000) * (isHost ? 1.5 : 1);
        if (w.px >= hi) w.dir = -1;
        if (w.px <= lo) w.dir = 1;
      }
      // the artwork faces left, so mirror it when walking right
      w.el.style.transform = `translateX(${w.px}px) scaleX(${-w.dir})`;
    }
  }

  // ---------- bats ----------
  const batBox = root.querySelector('.bats');
  const bats = [];
  function makeBats() {
    const n = isHost ? 7 : small() ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'bat';
      el.innerHTML = BAT_SVG;
      el.style.setProperty('--flap', 0.18 + Math.random() * 0.12 + 's');
      batBox.appendChild(el);
      const b = { el, x: Math.random() * window.innerWidth, y: 40 + Math.random() * window.innerHeight * 0.45, vx: (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 50), amp: 10 + Math.random() * 30, ph: Math.random() * 6, size: 0.6 + Math.random() * 0.8, zoom: 0 };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        b.zoom = 1;
        spawn(e.clientX, e.clientY, { n: 24, colors: ['#b46bff', '#7a2fd0', '#ff3355', '#fff'], speed: 4 });
        ring(e.clientX, e.clientY, '#b46bff', 120);
        for (let k = 0; k < 3; k++) spawnBat(e.clientX, e.clientY);
      });
      bats.push(b);
    }
  }
  makeBats();

  function updateBats(dt, t) {
    const vw = window.innerWidth;
    for (const b of bats) {
      const sp = b.zoom ? 8 : 1;
      b.x += b.vx * (dt / 1000) * sp;
      if (b.zoom) { b.y -= 6 * (dt / 16); }
      if (b.x > vw + 80 || b.x < -80 || b.y < -80) {
        b.zoom = 0;
        b.vx = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 50);
        b.x = b.vx > 0 ? -60 : vw + 60;
        b.y = 40 + Math.random() * window.innerHeight * 0.45;
      }
      const y = b.y + Math.sin(t * 2 + b.ph) * b.amp;
      b.el.style.transform = `translate(${b.x}px, ${y}px) scale(${b.size * (b.vx > 0 ? 1 : -1)}, ${b.size})`;
    }
  }

  // ---------- witch on a broomstick ----------
  const witchWrap = skyLayer.querySelector('.witch-wrap');
  const witch = skyLayer.querySelector('.witch');
  let witchFlying = false;
  let witchLtr = true;

  const house = root.querySelector('.house');
  // where the attic window is on screen right now
  function atticWindow() {
    const r = house.getBoundingClientRect();
    if (!r.width) return null;
    const k = r.width / 300;
    return { x: r.left + 150 * k, y: r.top + 128 * k };
  }

  function flyWitch() {
    if (witchFlying || mode === 'quiz') return;
    const win = atticWindow();
    if (!win) return;
    witchFlying = true;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ww = witchWrap.offsetWidth || 200;
    const wh = ww * (863 / 960);
    // a slow, menacing flight
    const dur = isHost ? 17000 : 15000;
    // the artwork faces right; she leaves the house flying left, turns, and comes home
    const at = (x, y, sc, face, rot = 0) => ({ transform: `translate(${x - ww / 2}px, ${y - wh / 2}px) scale(${sc * face}, ${sc}) rotate(${rot}deg)` });
    const kf = [
      { ...at(win.x, win.y, 0.08, -1), opacity: 0, offset: 0 },
      { ...at(win.x - vw * 0.08, win.y - vh * 0.12, 0.45, -1, -8), opacity: 1, offset: 0.08 },
      { ...at(vw * 0.55, vh * 0.14, 1, -1, 4), opacity: 1, offset: 0.3 },
      { ...at(vw * 0.14, vh * 0.24, 1, -1, -4), opacity: 1, offset: 0.5 },
      { ...at(vw * 0.14, vh * 0.24, 1, 1, 4), opacity: 1, offset: 0.53 },
      { ...at(vw * 0.48, vh * 0.32, 1, 1, -3), opacity: 1, offset: 0.74 },
      { ...at(win.x - vw * 0.06, win.y - vh * 0.1, 0.45, 1, 6), opacity: 1, offset: 0.92 },
      { ...at(win.x, win.y, 0.06, 1), opacity: 0, offset: 1 },
    ];
    house.classList.add('open');
    witchLtr = false;
    setTimeout(() => {
      const anim = witchWrap.animate(kf, { duration: dur, easing: 'linear' });
      setTimeout(() => (witchLtr = true), dur * 0.52);
      setTimeout(() => house.classList.add('flash'), dur * 0.97);
      anim.onfinish = () => {
        witchFlying = false;
        witchWrap.style.transform = 'translate(-9999px,0)';
        setTimeout(() => house.classList.remove('open', 'flash'), 500);
      };
    }, 600);
  }

  // tapping the house: the lights flicker and bats pour out of the windows
  house.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    restartClass(house, 'spooked', 1200);
    const win = atticWindow();
    if (!win) return;
    for (let k = 0; k < 10; k++) setTimeout(() => spawnBat(win.x, win.y), k * 70);
    spawn(win.x, win.y, { n: 30, colors: ['#ffb347', '#fff2b0', '#b46bff'], speed: 4 });
    ring(win.x, win.y, '#ffb347', 160);
  });

  function scheduleWitch() {
    setTimeout(() => { flyWitch(); scheduleWitch(); }, 9000 + Math.random() * 12000);
  }
  setTimeout(flyWitch, 2500);
  scheduleWitch();

  witch.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    restartClass(witch, 'loop', 1000);
    spawn(e.clientX, e.clientY, { n: 60, colors: ['#b46bff', '#ffb347', '#fff', '#8cff5a'], speed: 6, gravity: 0.03 });
    ring(e.clientX, e.clientY, '#b46bff', 260);
    for (let k = 0; k < 8; k++) setTimeout(() => spawnBat(e.clientX, e.clientY), k * 60);
  });

  let trailTick = 0;
  function witchTrail() {
    if (!witchFlying || ++trailTick % 3) return;
    const r = witch.getBoundingClientRect();
    // sparkles stream from the broom's bristles, at the back of the witch
    const bx = witchLtr ? r.left + r.width * 0.05 : r.right - r.width * 0.05;
    particles.push({ x: bx, y: r.top + r.height * 0.68, vx: (Math.random() - 0.5) * 0.6, vy: Math.random() * 0.6, life: 1, decay: 0.02, r: 1.5 + Math.random() * 2, c: ['#ffb347', '#b46bff', '#ffffff', '#8cff5a'][trailTick % 4], g: 0.01, kind: 'spark' });
  }

  // ---------- zombie hands rising from graves ----------
  const handBox = ground.querySelector('.hands');
  function riseHand() {
    if (document.hidden) return;
    const el = document.createElement('div');
    el.className = 'hand';
    el.innerHTML = HAND_SVG(Math.random() < 0.5 ? '#8fae7a' : '#9fb58c');
    el.style.left = 5 + Math.random() * 88 + '%';
    el.style.setProperty('--tilt', (Math.random() * 30 - 15).toFixed(0) + 'deg');
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      spawn(e.clientX, e.clientY, { n: 30, colors: ['#6b4423', '#8cff5a', '#3d2a1a'], gravity: 0.2, speed: 5 });
      el.classList.add('whacked');
    });
    handBox.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }
  setInterval(riseHand, 3500);
  setTimeout(riseHand, 800);

  // ---------- pumpkins ----------
  // each pumpkin has its own trick
  const tricks = {
    // flares up and shoots a fountain of embers
    embers(p, r, cx) {
      restartClass(p, 'flare', 800);
      ring(cx, r.top + r.height / 2, '#ff7a1a', 180);
      for (let k = 0; k < 6; k++) setTimeout(() => spawn(cx, r.top, { n: 10, colors: ['#ff7a1a', '#ffb347', '#ffe066'], speed: 5, gravity: 0.12 }), k * 90);
    },
    // the lid pops and ghosts float out
    ghosts(p, r, cx) {
      restartClass(p, 'pop-lid', 900);
      for (let k = 0; k < 4; k++) {
        setTimeout(() => {
          emoji(cx, r.top, '👻', { size: 30 + Math.random() * 18, vx: (Math.random() - 0.5) * 1.6, vy: -1.6 - Math.random(), g: -0.004, decay: 0.006, sway: 1 });
          spawn(cx, r.top, { n: 8, colors: ['#ffffff', '#d9c2ff'], speed: 2, gravity: -0.02 });
        }, 200 + k * 220);
      }
    },
    // rolls over, then bursts into a shower of sweets
    candy(p, r, cx) {
      restartClass(p, 'roll', 900);
      setTimeout(() => {
        ring(cx, r.top + r.height / 2, '#ff2e9a', 200);
        const sweets = ['🍬', '🍭', '🍫', '🍬', '🍭'];
        for (let k = 0; k < 18; k++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
          const v = 4 + Math.random() * 4;
          emoji(cx, r.top + r.height / 3, sweets[k % sweets.length], { size: 20 + Math.random() * 12, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.16, decay: 0.01, spin: (Math.random() - 0.5) * 0.3 });
        }
      }, 700);
    },
  };
  ground.querySelectorAll('.pumpkin').forEach((p) => {
    p.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const r = p.getBoundingClientRect();
      tricks[p.dataset.trick](p, r, r.left + r.width / 2);
    });
  });

  // ---------- lightning ----------
  const flashEl = root.querySelector('.lightning');
  const boltPath = flashEl.querySelector('path');
  function lightning() {
    let d = `M${30 + Math.random() * 40} 0`;
    let x = 50;
    for (let y = 20; y <= 300; y += 20 + Math.random() * 20) {
      x += Math.random() * 24 - 12;
      d += ` L${x.toFixed(1)} ${y.toFixed(0)}`;
    }
    boltPath.setAttribute('d', d);
    flashEl.style.setProperty('--bx', Math.random() * 70 + 10 + '%');
    flashEl.classList.remove('strike');
    void flashEl.offsetWidth;
    flashEl.classList.add('strike');
  }
  setInterval(() => { if (mode !== 'quiz' && Math.random() < 0.5) lightning(); }, 16000);

  function shake() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 700);
  }

  function setMode(m) {
    mode = m;
    document.body.dataset.scene = m;
  }

  setMode('join');
  requestAnimationFrame(frame);

  return { setMode, lightning, shake, spawn, spawnBat, emoji, burst: ring, flyWitch, PUMPKIN_SVG, HAND_SVG };
})();

function formatClock(ms) {
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function formatTime(ms) {
  if (ms == null) return '–';
  return (ms / 1000).toFixed(1) + 's';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Fun titles shared by the player and host results
function ghoulTitle(rank, correct, total, players) {
  if (correct === 0) return { title: 'Lost Soul', icon: '💀' };
  if (rank === 1) return { title: 'Supreme Ghoul', icon: '👑' };
  if (rank === 2) return { title: 'Vampire Lord', icon: '🧛' };
  if (rank === 3) return { title: 'Wicked Witch', icon: '🧙' };
  if (correct === total) return { title: 'Master Gravedigger', icon: '⚰️' };
  if (rank <= Math.ceil(players * 0.25)) return { title: 'Phantom of the Pots', icon: '👻' };
  if (rank <= Math.ceil(players * 0.6)) return { title: 'Restless Spirit', icon: '🕯️' };
  return { title: 'Wandering Zombie', icon: '🧟' };
}
