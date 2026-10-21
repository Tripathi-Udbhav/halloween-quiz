const socket = io();
const $ = (id) => document.getElementById(id);
const key = new URLSearchParams(location.search).get('key') || '';
const RING_LEN = 2 * Math.PI * 46;

let phase = null;
let endAt = 0;
let totalMs = 120000;
let tick = null;
let shownNames = 0;
let questionCount = 5;
let playerCount = 0;

const SCENE_FOR = { 'h-lobby': 'lobby', 'h-running': 'quiz', 'h-results': 'results', 'h-answers': 'quiz', 'h-denied': 'join' };
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  Scene.setMode(SCENE_FOR[id]);
}

fetch('/api/qr')
  .then((r) => r.json())
  .then(({ url, svg }) => {
    $('qr').innerHTML = svg;
    $('qr-url').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  });

socket.on('connect', () => socket.emit('host:hello', { key }));
socket.on('host:denied', () => show('h-denied'));

socket.on('host:state', (s) => {
  questionCount = s.questionCount;
  totalMs = s.quizSeconds * 1000;
  const prev = phase;
  phase = s.phase;

  if (s.phase === 'lobby') {
    if (prev !== 'lobby') { shownNames = 0; $('chips').innerHTML = ''; }
    renderLobby(s.players);
    $('start-btn').disabled = s.players.length === 0;
    show('h-lobby');
  } else if (s.phase === 'running') {
    if (prev !== 'running') {
      endAt = Date.now() + s.remainingMs;
      clearInterval(tick);
      tick = setInterval(updateCountdown, 250);
      updateCountdown();
      show('h-running');
      if (prev === 'lobby') { Scene.lightning(); Scene.shake(); }
    }
    const { finished, total } = s.progress;
    $('finished').textContent = finished;
    $('total').textContent = total;
    $('finished-bar').style.width = total ? (finished / total) * 100 + '%' : '0';
  } else if (s.phase === 'ended') {
    clearInterval(tick);
    answers = s.answers || [];
    if (prev !== 'ended') {
      setupGraves(s.results);
      show('h-results');
    }
  }
});

function renderLobby(names) {
  $('count').textContent = names.length;
  const chips = $('chips');
  if (names.length < shownNames) { chips.innerHTML = ''; shownNames = 0; }
  if (shownNames === 0 && names.length) chips.innerHTML = '';
  if (!names.length) {
    chips.innerHTML = '<span class="muted">Waiting for the first brave soul…</span>';
    return;
  }
  const icons = ['🎃', '👻', '🦇', '💀', '🕷️', '🧙', '🧛', '🧟'];
  for (let i = shownNames; i < names.length; i++) {
    const c = document.createElement('span');
    c.className = 'chip';
    c.textContent = icons[i % icons.length] + ' ' + names[i];
    chips.appendChild(c);
    // puff of sparks where each new soul appears
    requestAnimationFrame(() => {
      const r = c.getBoundingClientRect();
      Scene.spawn(r.left + r.width / 2, r.top + r.height / 2, { n: 12, colors: ['#b46bff', '#8cff5a', '#fff'] });
    });
  }
  shownNames = names.length;
  chips.scrollTop = chips.scrollHeight;
}

function updateCountdown() {
  const left = Math.max(0, endAt - Date.now());
  $('countdown').textContent = formatClock(left);
  for (const id of ['big-prog', 'big-glow']) {
    $(id).style.strokeDasharray = RING_LEN;
    $(id).style.strokeDashoffset = RING_LEN * (1 - left / totalMs);
  }
  const ring = $('big-ring');
  ring.classList.toggle('warn', left <= 30000 && left > 10000);
  ring.classList.toggle('danger', left <= 10000);
  if (left <= 0) clearInterval(tick);
}

// ---- results: three sealed graves; the host opens each one with a bomb ----
let lastResults = [];
const opened = new Set();
const PLACE_LABEL = { 1: 'the Supreme Ghoul', 2: 'second place', 3: 'third place' };
const BOMB_SVG = `
  <svg viewBox="0 0 120 130" aria-hidden="true">
    <defs><radialGradient id="bombg" cx=".35" cy=".35"><stop offset="0" stop-color="#6b5a80"/><stop offset=".45" stop-color="#241a30"/><stop offset="1" stop-color="#07040b"/></radialGradient></defs>
    <path class="fuse" d="M70 30 q10 -18 26 -14 q12 4 10 -10" fill="none" stroke="#c9a14a" stroke-width="5" stroke-linecap="round"/>
    <rect x="56" y="24" width="22" height="16" rx="4" fill="#3a2f45" transform="rotate(20 67 32)"/>
    <circle cx="56" cy="78" r="46" fill="url(#bombg)" stroke="rgba(180,107,255,.5)" stroke-width="2"/>
    <ellipse cx="40" cy="60" rx="12" ry="7" fill="rgba(255,255,255,.35)" transform="rotate(-35 40 60)"/>
    <text x="56" y="92" text-anchor="middle" font-family="Creepster, cursive" font-size="30" fill="#ff7a1a">BOO</text>
  </svg>`;

function setupGraves(results) {
  lastResults = results;
  playerCount = results.length;
  opened.clear();
  [1, 2, 3].forEach((n) => {
    const el = $('place-' + n);
    el.classList.remove('revealed', 'empty', 'rumble');
    const r = results[n - 1];
    el.querySelector('.who').textContent = r ? r.name : 'An empty grave';
    el.querySelector('.meta').textContent = r ? `${r.correct}/${questionCount} · ${formatTime(r.timeMs)}` : 'No soul rests here 🕸️';
    el.querySelector('.ttl').textContent = r ? ghoulTitle(n, r.correct, questionCount, playerCount).title : '';
  });
  $('board').classList.remove('show');
  $('board-body').innerHTML = results
    .map((r, i) => {
      const t = ghoulTitle(r.rank, r.correct, questionCount, playerCount);
      return `<tr style="animation-delay:${Math.min(i, 20) * 0.06}s"><td>${r.rank}</td><td>${escapeHtml(r.name)}</td><td class="ttl">${t.icon} ${t.title}</td><td>${r.correct}/${questionCount}</td><td>${formatTime(r.timeMs)}</td></tr>`;
    })
    .join('');
  $('reveal-msg').textContent = results.length ? 'Three graves… three champions. Who dares open them?' : 'Nobody played… how spooky.';
}

function openGrave(n) {
  if (opened.has(n) || !$('h-results').classList.contains('active')) return;
  opened.add(n);
  const el = $('place-' + n);
  const r = lastResults[n - 1];
  const msg = $('reveal-msg');
  if (!r) {
    el.classList.add('revealed', 'empty');
    msg.textContent = 'This grave is empty… 🕸️';
    afterOpen();
    return;
  }
  msg.textContent = `Opening the grave of ${PLACE_LABEL[n]}…`;
  el.classList.add('rumble');

  // a bomb drops onto the grave, its fuse fizzes… then BOOM
  const stone = el.querySelector('.stone').getBoundingClientRect();
  const size = Math.min(140, stone.width * 0.55);
  const bomb = document.createElement('div');
  bomb.className = 'bomb';
  bomb.innerHTML = BOMB_SVG;
  bomb.style.width = size + 'px';
  document.body.appendChild(bomb);
  const bx = stone.left + stone.width / 2 - size / 2;
  const by = stone.top - size * 0.75;
  bomb.animate(
    [
      { transform: `translate(${bx}px, ${-size * 1.5}px) rotate(-30deg)` },
      { transform: `translate(${bx}px, ${by}px) rotate(8deg)`, offset: 0.7 },
      { transform: `translate(${bx}px, ${by - 24}px) rotate(-4deg)`, offset: 0.85 },
      { transform: `translate(${bx}px, ${by}px) rotate(0deg)` },
    ],
    { duration: 650, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' }
  );
  const fizz = setInterval(() => {
    const f = bomb.getBoundingClientRect();
    Scene.spawn(f.left + f.width * 0.88, f.top + f.height * 0.05, { n: 4, colors: ['#fff36b', '#ffb347', '#ffffff'], speed: 2.5, gravity: 0.02 });
  }, 60);
  setTimeout(() => bomb.classList.add('swell'), 900);
  setTimeout(() => {
    clearInterval(fizz);
    const cx = stone.left + stone.width / 2;
    const cy = stone.top + stone.height * 0.25;
    bomb.remove();
    el.classList.remove('rumble');
    el.classList.add('revealed');
    Scene.lightning();
    Scene.shake();
    Scene.burst(cx, cy, 320);
    Scene.spawn(cx, cy, { n: 80, colors: ['#ffb347', '#ff7a1a', '#ffe066', '#ffffff', '#6b4423'], speed: 9, gravity: 0.15 });
    boomConfetti(cx / window.innerWidth, cy / window.innerHeight, n);
    msg.textContent = n === 1 ? `👑 ${r.name} rules the graveyard! 👑` : `${n === 2 ? '🥈' : '🥉'} ${r.name} rises from the grave!`;
    if (n === 1) Scene.flyWitch();
    afterOpen();
  }, 1600);
}

function afterOpen() {
  if (opened.size < 3) return;
  setTimeout(() => $('board').classList.add('show'), 2500);
}

function boomConfetti(x, y, n) {
  if (typeof confetti !== 'function') return;
  const colors = ['#ff7a1a', '#8cff5a', '#b46bff', '#ffd54a', '#ffffff'];
  const origin = { x, y };
  confetti({ particleCount: 160, spread: 110, startVelocity: 48, origin, colors, scalar: 1.1 });
  confetti({ particleCount: 70, spread: 360, startVelocity: 30, origin, colors, ticks: 260 });
  if (n !== 1) return;
  // the winner gets a few extra seconds of confetti streams
  const end = Date.now() + 3500;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

[1, 2, 3].forEach((n) => {
  const el = $('place-' + n);
  el.addEventListener('click', () => openGrave(n));
  el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openGrave(n)));
});

// presenter clickers / arrow keys open the graves in suspense order: 3rd, 2nd, then 1st
document.addEventListener('keydown', (e) => {
  if (!$('h-results').classList.contains('active')) return;
  if (!['ArrowRight', 'PageDown'].includes(e.key)) return;
  e.preventDefault();
  const next = [3, 2, 1].find((n) => !opened.has(n));
  if (next) openGrave(next);
  else $('board').classList.add('show');
});

// ---- answer review: one question at a time, then the correct answer and why ----
let answers = [];
let rvIndex = 0;
let rvTimers = [];
const TAGS = ['🎃', '👻', '🦇', '💀', '🕷️', '🧙'];

function showReview(i) {
  if (!answers.length) return;
  rvIndex = Math.max(0, Math.min(answers.length - 1, i));
  const a = answers[rvIndex];
  rvTimers.forEach(clearTimeout);
  rvTimers = [];
  show('h-answers');
  $('rv-count').textContent = `Question ${rvIndex + 1} of ${answers.length}`;
  $('rv-q').textContent = a.question;
  $('rv-prev').disabled = rvIndex === 0;
  $('rv-next').textContent = rvIndex === answers.length - 1 ? 'Finish 🎃' : 'Next ▶';
  $('rv-expl').classList.remove('show');
  $('rv-expl-text').textContent = a.explanation;
  const box = $('rv-options');
  box.innerHTML = '';
  a.options.forEach((opt, o) => {
    const pct = a.players ? Math.round((a.picks[o] / a.players) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'rv-opt';
    row.innerHTML = `<div class="fill"></div><span class="tag">${TAGS[o % TAGS.length]}</span><span class="txt"></span><span class="pct">${pct}%</span><span class="tick">✔</span>`;
    row.querySelector('.txt').textContent = opt;
    row.dataset.pct = pct;
    box.appendChild(row);
  });
  const card = document.querySelector('.review');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'rise-in 0.5s cubic-bezier(.2,.9,.3,1.2)';

  const at = (ms, fn) => rvTimers.push(setTimeout(fn, ms));
  // how the room voted, then the correct answer, then the explanation
  at(600, () => box.querySelectorAll('.rv-opt').forEach((r) => (r.querySelector('.fill').style.width = r.dataset.pct + '%')));
  at(1700, () => {
    box.querySelectorAll('.rv-opt').forEach((r, o) => r.classList.add(o === a.answer ? 'correct' : 'wrong'));
    const c = box.children[a.answer];
    if (!c) return;
    const r = c.getBoundingClientRect();
    Scene.spawn(r.left + 40, r.top + r.height / 2, { n: 50, colors: ['#8cff5a', '#c7ff8a', '#ffffff', '#ffd54a'], speed: 6 });
    Scene.lightning();
  });
  at(2400, () => $('rv-expl').classList.add('show'));
}

function reviewNext() {
  if (rvIndex >= answers.length - 1) return show('h-results');
  showReview(rvIndex + 1);
}

document.addEventListener('keydown', (e) => {
  if (!$('h-answers').classList.contains('active')) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); reviewNext(); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); showReview(rvIndex - 1); }
});

// ---- buttons ----
$('start-btn').onclick = () => socket.emit('host:start');
$('end-btn').onclick = () => confirm('End the quiz for everyone now?') && socket.emit('host:end');
$('reset-btn').onclick = () => socket.emit('host:reset');
$('replay-btn').onclick = () => setupGraves(lastResults);
$('board-btn').onclick = () => $('board').classList.toggle('show');
$('answers-btn').onclick = () => showReview(0);
$('csv-btn').href = '/api/results.csv' + (key ? '?key=' + encodeURIComponent(key) : '');
$('rv-next').onclick = reviewNext;
$('rv-prev').onclick = () => showReview(rvIndex - 1);
$('rv-back').onclick = () => show('h-results');
$('clear-btn').onclick = () => confirm('Remove all joined players?') && socket.emit('host:clear');
