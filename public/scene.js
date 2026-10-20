// The haunted night scene shared by the player and host screens:
// starry purple-black sky, moon, graveyard, bats, a flying witch, zombies and Frankenstein.
// Everything is vector (SVG) or a DPR-aware canvas, so it stays crisp on HD screens and projectors.
const Scene = (() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const isHost = document.body.classList.contains('host');
  const small = () => window.innerWidth < 640;
  let mode = 'join';

  // ---------- SVG artwork ----------
  const FRANK_SVG = `
  <svg viewBox="0 0 160 260" class="char-svg" aria-hidden="true">
    <defs>
      <linearGradient id="fskin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd27a"/><stop offset="1" stop-color="#5b8a41"/></linearGradient>
      <linearGradient id="fjacket" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#40305c"/><stop offset="1" stop-color="#1a1226"/></linearGradient>
      <radialGradient id="feye"><stop offset="0" stop-color="#f6ffd0"/><stop offset="1" stop-color="#c7e86a"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="252" rx="52" ry="6" fill="rgba(0,0,0,.55)"/>
    <g class="body-bob">
      <g class="leg leg-b" style="transform-origin:80px 150px">
        <rect x="70" y="148" width="22" height="80" rx="4" fill="#241d30"/>
        <rect x="64" y="222" width="38" height="24" rx="7" fill="#0c0911"/>
      </g>
      <g class="arm arm-b" style="transform-origin:92px 94px">
        <rect x="88" y="84" width="56" height="20" rx="7" fill="#21182e"/>
        <rect x="140" y="85" width="17" height="18" rx="7" fill="#5f8a45"/>
      </g>
      <path d="M46 84 L114 84 L120 160 L42 160 Z" fill="url(#fjacket)"/>
      <path d="M70 84 L80 124 L90 84 Z" fill="#100b17"/>
      <path d="M74 84 L80 104 L86 84 Z" fill="#d8d0c0"/>
      <circle cx="80" cy="132" r="2.5" fill="#6b5a87"/><circle cx="80" cy="144" r="2.5" fill="#6b5a87"/>
      <path d="M52 110 l12 2 M54 106 l2 8 M58 107 l2 8 M62 108 l1 8" stroke="#8c7aa8" stroke-width="1.4" fill="none"/>
      <rect x="42" y="152" width="78" height="9" fill="#0b0810"/>
      <rect x="76" y="152" width="10" height="9" fill="#a99a3a"/>
      <g class="leg leg-f" style="transform-origin:68px 150px">
        <rect x="55" y="148" width="25" height="82" rx="4" fill="#2f2740"/>
        <rect x="49" y="224" width="44" height="24" rx="7" fill="#08060b"/>
        <rect x="49" y="242" width="44" height="6" rx="3" fill="#2b2433"/>
      </g>
      <rect x="66" y="68" width="28" height="20" fill="#5f8c46"/>
      <rect x="54" y="74" width="14" height="9" rx="2" fill="#a6aeb8" stroke="#4c525a" stroke-width="1.5"/>
      <rect x="92" y="74" width="14" height="9" rx="2" fill="#a6aeb8" stroke="#4c525a" stroke-width="1.5"/>
      <g class="head" style="transform-origin:80px 72px">
        <rect x="50" y="12" width="60" height="62" rx="9" fill="url(#fskin)"/>
        <path d="M46 24 L46 9 Q80 -3 114 9 L114 24 L107 18 L100 27 L92 18 L84 28 L76 18 L68 27 L60 18 L53 26 Z" fill="#0a0a0e"/>
        <path d="M58 34 L102 32" stroke="#2f4a22" stroke-width="2"/>
        <path d="M62 30v8 M70 30v8 M78 29v8 M86 29v8 M94 29v8" stroke="#2f4a22" stroke-width="1.6"/>
        <rect x="56" y="38" width="50" height="6" rx="3" fill="#24361b"/>
        <g class="eyes">
          <ellipse cx="68" cy="50" rx="6.5" ry="4.5" fill="url(#feye)"/>
          <ellipse cx="94" cy="50" rx="6.5" ry="4.5" fill="url(#feye)"/>
          <circle class="pupil" cx="70" cy="50.5" r="2.3" fill="#151515"/>
          <circle class="pupil" cx="96" cy="50.5" r="2.3" fill="#151515"/>
        </g>
        <path d="M60 56 q8 3 16 0 M86 56 q8 3 16 0" stroke="#4a7136" stroke-width="1.5" fill="none"/>
        <path d="M81 50 L86 61 L79 62" stroke="#3f6330" stroke-width="2" fill="none"/>
        <path class="mouth" d="M64 67 L98 66" stroke="#1f3016" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M70 64v6 M78 63v6 M86 63v6 M94 63v6" stroke="#1f3016" stroke-width="1.3"/>
        <path d="M100 42 l6 14" stroke="#2f4a22" stroke-width="1.6"/>
      </g>
      <g class="arm arm-f" style="transform-origin:84px 98px">
        <rect x="80" y="90" width="60" height="22" rx="7" fill="#2c2040"/>
        <rect x="128" y="90" width="10" height="22" fill="#1b1328"/>
        <rect x="136" y="91" width="19" height="20" rx="7" fill="#7aa85b"/>
        <path d="M144 96h10 M144 101h11 M144 106h10" stroke="#4f7a38" stroke-width="1.2"/>
      </g>
    </g>
  </svg>`;

  const ZOMBIE_SVG = (shirt = '#3f6a6a', skin = '#9cb87f') => `
  <svg viewBox="0 0 140 230" class="char-svg" aria-hidden="true">
    <ellipse cx="70" cy="222" rx="44" ry="5" fill="rgba(0,0,0,.55)"/>
    <g class="body-lurch" style="transform-origin:66px 210px">
      <g class="leg leg-b" style="transform-origin:68px 140px">
        <path d="M60 138 h18 v64 l-4 -4 l-4 6 l-4 -5 l-6 4 Z" fill="#33291f"/>
        <rect x="56" y="202" width="30" height="13" rx="5" fill="#17120d"/>
      </g>
      <g class="arm arm-b" style="transform-origin:82px 84px">
        <rect x="76" y="80" width="15" height="34" rx="6" fill="${shirt}" opacity=".8"/>
        <rect x="77" y="110" width="13" height="30" rx="6" fill="${skin}" opacity=".85"/>
        <path d="M78 140 l-2 8 M83 141 l0 9 M88 140 l2 8" stroke="${skin}" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      </g>
      <path d="M42 80 Q58 64 94 72 L100 142 L92 136 L86 146 L78 137 L70 148 L62 138 L54 147 L46 140 Z" fill="${shirt}"/>
      <path d="M56 96 q6 -4 10 2 q-4 6 -10 -2 M78 116 q5 -3 9 1 q-3 5 -9 -1" fill="rgba(0,0,0,.25)"/>
      <path d="M58 86 l20 44" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <g class="leg leg-f" style="transform-origin:60px 140px">
        <path d="M50 138 h21 v68 l-5 -5 l-5 6 l-5 -5 l-6 5 Z" fill="#4a3c2c"/>
        <rect x="46" y="204" width="34" height="14" rx="5" fill="#1d1712"/>
      </g>
      <g class="head" style="transform-origin:84px 74px">
        <ellipse cx="92" cy="50" rx="26" ry="28" fill="${skin}"/>
        <path d="M68 40 q4 -22 24 -24 q18 0 26 18 q-6 -6 -10 -2 q-4 -8 -10 -4 q-6 -8 -12 -2 q-8 -4 -10 4 q-4 -2 -8 10 Z" fill="#2a2a22"/>
        <circle cx="86" cy="48" r="8" fill="#f1f1d8"/>
        <circle class="pupil" cx="88" cy="49" r="2.4" fill="#1b1b1b"/>
        <circle cx="106" cy="46" r="4.5" fill="#f1f1d8"/>
        <circle class="pupil" cx="107" cy="46.5" r="1.8" fill="#b3001b"/>
        <path class="mouth" d="M82 64 q12 12 26 0 q-12 4 -26 0 Z" fill="#2a0a0a"/>
        <path d="M88 65 v4 M94 66 v5 M100 65 v4" stroke="#efe6c8" stroke-width="2.4"/>
        <path d="M72 58 l8 -3 M73 62 l8 -3" stroke="#5c7349" stroke-width="1.6"/>
        <ellipse cx="66" cy="52" rx="4" ry="7" fill="${skin}"/>
      </g>
      <g class="arm arm-f" style="transform-origin:86px 88px">
        <rect x="84" y="82" width="28" height="16" rx="6" fill="${shirt}"/>
        <path d="M110 82 l4 3 l-3 4 l4 3 l-4 4 l-1 2" fill="${shirt}"/>
        <rect x="108" y="84" width="26" height="13" rx="6" fill="${skin}"/>
        <path d="M132 86 q6 4 4 10 M132 90 q7 4 5 10" stroke="${skin}" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;

  const WITCH_SVG = `
  <svg viewBox="0 0 230 150" class="witch-svg" aria-hidden="true">
    <defs>
      <linearGradient id="wcape" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#4a1670"/><stop offset="1" stop-color="#1a0629"/></linearGradient>
    </defs>
    <g class="witch-bob">
      <path class="cape" d="M104 52 Q70 46 36 70 Q62 74 70 86 Q84 78 108 90 Z" fill="url(#wcape)"/>
      <line x1="20" y1="100" x2="205" y2="84" stroke="#6b4423" stroke-width="6" stroke-linecap="round"/>
      <path d="M26 99 L-4 82 L2 96 L-8 100 L4 106 L-4 118 L28 104 Z" fill="#d1a64b"/>
      <path d="M0 90 L26 100 M-2 104 L26 102 M4 112 L26 103" stroke="#9c7428" stroke-width="1.4"/>
      <rect x="22" y="94" width="8" height="12" rx="2" fill="#7a2fb0" transform="rotate(-5 26 100)"/>
      <path d="M118 88 L112 112 L124 114 L126 92 Z" fill="#111"/>
      <path d="M113 98 h11 M112 104 h12" stroke="#ff7a1a" stroke-width="3"/>
      <path d="M112 112 L132 116 L138 112 L124 110 Z" fill="#0b0b0b"/>
      <path d="M100 50 Q122 44 138 56 L142 92 Q118 98 96 88 Z" fill="#22093a"/>
      <path d="M130 62 Q150 70 158 86" stroke="#22093a" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="160" cy="88" r="5" fill="#86c45e"/>
      <path d="M118 30 Q96 34 84 56 Q100 44 112 46 Q96 56 92 70 Q112 52 124 44 Z" fill="#ff7a1a"/>
      <circle cx="132" cy="38" r="14" fill="#86c45e"/>
      <path d="M144 36 L162 42 L145 44 Z" fill="#79b553"/>
      <path d="M138 50 q4 4 0 8" stroke="#79b553" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="138" cy="34" r="2.2" fill="#1b1b1b"/>
      <path d="M134 46 q4 2 8 0" stroke="#2c4a1c" stroke-width="1.6" fill="none"/>
      <circle cx="148" cy="44" r="1.5" fill="#3e6c2a"/>
      <ellipse cx="130" cy="26" rx="27" ry="5" fill="#12061c"/>
      <path d="M114 26 Q122 4 100 -6 Q120 -6 134 6 L146 26 Z" fill="#12061c"/>
      <path d="M116 22 L144 22 L145 26 L115 26 Z" fill="#9b4dff"/>
      <rect x="126" y="20" width="7" height="7" fill="none" stroke="#ffb347" stroke-width="1.6"/>
    </g>
  </svg>`;

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
    <div class="witch-wrap"><div class="witch" title="Tap me!">${WITCH_SVG}</div></div>
    <div class="graveyard">${graveyardSVG()}</div>
    <div class="ground-layer">
      <div class="hands"></div>
      <button class="pumpkin p-a" aria-label="pumpkin">${PUMPKIN_SVG}</button>
      <button class="pumpkin p-b" aria-label="pumpkin">${PUMPKIN_SVG}</button>
      <div class="walker zombie z1">${ZOMBIE_SVG()}</div>
      <div class="walker zombie z2">${ZOMBIE_SVG('#5b3a6e', '#a8bf8a')}</div>
      <div class="walker frank">${FRANK_SVG}</div>
    </div>
    <div class="fog"><i></i><i></i></div>
    <div class="vignette"></div>
    <div class="lightning"><svg viewBox="0 0 100 300" preserveAspectRatio="none"><path d=""/></svg></div>`;
  document.body.prepend(root);

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

  // ---------- tap anywhere: sparks + a little bat ----------
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input, .option, .btn, .mute')) return;
    Sound.unlock();
    spawn(e.clientX, e.clientY);
    if (Math.random() < 0.6) spawnBat(e.clientX, e.clientY);
    if (Math.random() < 0.3) Sound.squeak();
  });

  // ---------- walkers: Frankenstein + zombies ----------
  const walkers = [
    { el: root.querySelector('.frank'), speed: 26, x: 0.2, dir: 1, sound: () => Sound.groan(0.8), only: ['lobby', 'results'] },
    { el: root.querySelector('.z1'), speed: 14, x: 0.75, dir: -1, sound: () => Sound.groan(1.1), only: ['join', 'lobby', 'done', 'results'] },
    { el: root.querySelector('.z2'), speed: 11, x: 0.45, dir: 1, sound: () => Sound.groan(1.3), only: ['join', 'lobby', 'done', 'results'] },
  ];
  walkers.forEach((w) => {
    w.px = w.x * window.innerWidth;
    w.paused = 0;
    w.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.unlock();
      w.sound();
      w.paused = 1600;
      w.el.classList.remove('hit');
      void w.el.offsetWidth;
      w.el.classList.add('hit');
      const r = w.el.getBoundingClientRect();
      spawn(r.left + r.width / 2, r.top + r.height * 0.3, { n: 18, colors: ['#8cff5a', '#c7e86a', '#ffffff'] });
      setTimeout(() => w.el.classList.remove('hit'), 1600);
    });
  });

  function updateWalkers(dt) {
    const vw = window.innerWidth;
    for (const w of walkers) {
      const visible = w.only.includes(mode);
      w.el.classList.toggle('gone', !visible);
      if (!visible) continue;
      const width = w.el.offsetWidth || 120;
      if (mode === 'results') {
        // stop and dance at fixed spots
        const spots = { frank: 0.04, z1: 0.86, z2: 0.74 };
        const key = w.el.classList.contains('frank') ? 'frank' : w.el.classList.contains('z1') ? 'z1' : 'z2';
        w.px += (spots[key] * vw - w.px) * 0.05;
        w.dir = key === 'frank' ? 1 : -1;
      } else if (w.paused > 0) {
        w.paused -= dt;
      } else {
        w.px += w.dir * w.speed * (dt / 1000) * (isHost ? 1.6 : 1);
        if (w.px > vw - width * 0.6) w.dir = -1;
        if (w.px < -width * 0.4) w.dir = 1;
      }
      w.el.style.transform = `translateX(${w.px}px) scaleX(${w.dir})`;
      w.el.classList.toggle('dance', mode === 'results');
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
        Sound.unlock();
        Sound.squeak();
        b.zoom = 1;
        spawn(e.clientX, e.clientY, { n: 10, colors: ['#b46bff', '#ff3355', '#fff'] });
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
  const witchWrap = root.querySelector('.witch-wrap');
  const witch = root.querySelector('.witch');
  let witchFlying = false;
  let witchLtr = true;

  function flyWitch() {
    if (witchFlying || mode === 'quiz') return;
    witchFlying = true;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ltr = Math.random() < 0.5;
    witchLtr = ltr;
    const w = witchWrap.offsetWidth || 200;
    const y0 = vh * (0.08 + Math.random() * 0.22);
    const sx = ltr ? 1 : -1;
    const x0 = ltr ? -w - 20 : vw + 20;
    const x1 = ltr ? vw + 20 : -w - 20;
    const kf = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      kf.push({ transform: `translate(${x0 + (x1 - x0) * f}px, ${y0 + Math.sin(f * Math.PI * 2) * 40 - Math.sin(f * Math.PI) * 50}px) scaleX(${sx})` });
    }
    const anim = witchWrap.animate(kf, { duration: isHost ? 9000 : 7000, easing: 'linear' });
    anim.onfinish = () => { witchFlying = false; witchWrap.style.transform = 'translate(-9999px,0)'; };
  }
  function scheduleWitch() {
    setTimeout(() => { flyWitch(); scheduleWitch(); }, 9000 + Math.random() * 12000);
  }
  setTimeout(flyWitch, 2500);
  scheduleWitch();

  witch.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    Sound.unlock();
    Sound.cackle();
    witch.classList.remove('loop');
    void witch.offsetWidth;
    witch.classList.add('loop');
    spawn(e.clientX, e.clientY, { n: 26, colors: ['#b46bff', '#ffb347', '#fff', '#8cff5a'], speed: 4 });
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
  const handBox = root.querySelector('.hands');
  function riseHand() {
    if (document.hidden) return;
    const el = document.createElement('div');
    el.className = 'hand';
    el.innerHTML = HAND_SVG(Math.random() < 0.5 ? '#8fae7a' : '#9fb58c');
    el.style.left = 5 + Math.random() * 88 + '%';
    el.style.setProperty('--tilt', (Math.random() * 30 - 15).toFixed(0) + 'deg');
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.unlock();
      Sound.pop();
      spawn(e.clientX, e.clientY, { n: 16, colors: ['#6b4423', '#8cff5a', '#3d2a1a'], gravity: 0.15 });
      el.classList.add('whacked');
    });
    handBox.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }
  setInterval(riseHand, 3500);
  setTimeout(riseHand, 800);

  // ---------- pumpkins ----------
  root.querySelectorAll('.pumpkin').forEach((p) => {
    p.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.unlock();
      Sound.ghost();
      p.classList.remove('flare');
      void p.offsetWidth;
      p.classList.add('flare');
      const r = p.getBoundingClientRect();
      spawn(r.left + r.width / 2, r.top + r.height / 3, { n: 30, colors: ['#ff7a1a', '#ffb347', '#ffe066'], speed: 4 });
    });
  });

  // ---------- lightning ----------
  const flashEl = root.querySelector('.lightning');
  const boltPath = flashEl.querySelector('path');
  function lightning(withThunder = true) {
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
    if (withThunder) Sound.thunder(0.15, 0.7);
  }
  setInterval(() => { if (mode !== 'quiz' && Math.random() < 0.5) lightning(false); }, 16000);

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

  // ---------- sound toggle ----------
  const mute = document.createElement('button');
  mute.className = 'mute';
  mute.setAttribute('aria-label', 'Toggle sound');
  const paintMute = () => (mute.textContent = Sound.isMuted() ? '🔇' : '🔊');
  paintMute();
  mute.addEventListener('click', () => {
    Sound.unlock();
    Sound.setMuted(!Sound.isMuted());
    paintMute();
    if (!Sound.isMuted()) Sound.pop();
  });
  document.body.appendChild(mute);

  setMode('join');
  requestAnimationFrame(frame);

  return { setMode, lightning, shake, spawn, spawnBat, flyWitch, FRANK_SVG, ZOMBIE_SVG, PUMPKIN_SVG, HAND_SVG };
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
