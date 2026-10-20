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
let revealTimers = [];
let lastJoinSound = 0;
let lastBeat = 0;

const SCENE_FOR = { 'h-lobby': 'lobby', 'h-running': 'quiz', 'h-results': 'results', 'h-denied': 'join' };
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
      if (prev === 'lobby') { Scene.lightning(true); Scene.shake(); }
    }
    const { finished, total } = s.progress;
    $('finished').textContent = finished;
    $('total').textContent = total;
    $('finished-bar').style.width = total ? (finished / total) * 100 + '%' : '0';
  } else if (s.phase === 'ended') {
    clearInterval(tick);
    if (prev !== 'ended') {
      show('h-results');
      reveal(s.results);
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
  if (names.length > shownNames && Date.now() - lastJoinSound > 900) {
    lastJoinSound = Date.now();
    Sound.ghost();
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
  if (left <= 10000 && left > 0 && Date.now() - lastBeat > 950) {
    lastBeat = Date.now();
    Sound.heartbeat();
  }
  if (left <= 0) clearInterval(tick);
}

// ---- results: tombstones rise from the graveyard, 3rd, then 2nd, then 1st ----
let lastResults = [];
function reveal(results) {
  lastResults = results;
  playerCount = results.length;
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  [1, 2, 3].forEach((n) => {
    const el = $('place-' + n);
    el.classList.remove('show');
    el.querySelectorAll('.zhand').forEach((h) => h.remove());
    const r = results[n - 1];
    el.querySelector('.who').textContent = r ? r.name : '—';
    el.querySelector('.meta').textContent = r ? `${r.correct}/${questionCount} · ${formatTime(r.timeMs)}` : '';
    el.querySelector('.ttl').textContent = r ? ghoulTitle(n, r.correct, questionCount, playerCount).title : '';
    el.style.visibility = r ? 'visible' : 'hidden';
    // zombie hands pushing each tombstone up
    ['l', 'r'].forEach((side) => {
      const h = document.createElement('div');
      h.className = 'zhand ' + side;
      h.innerHTML = Scene.HAND_SVG('#8fae7a');
      el.appendChild(h);
    });
  });
  $('board').classList.remove('show');
  $('board-body').innerHTML = results
    .map((r, i) => {
      const t = ghoulTitle(r.rank, r.correct, questionCount, playerCount);
      return `<tr style="animation-delay:${Math.min(i, 20) * 0.06}s"><td>${r.rank}</td><td>${escapeHtml(r.name)}</td><td class="ttl">${t.icon} ${t.title}</td><td>${r.correct}/${questionCount}</td><td>${formatTime(r.timeMs)}</td></tr>`;
    })
    .join('');

  const msg = $('reveal-msg');
  const crystal = $('crystal');
  const at = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
  const rise = (n) => {
    const el = $('place-' + n);
    if (!results[n - 1]) return;
    el.classList.add('show');
    Scene.lightning(true);
    Scene.shake();
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      Scene.spawn(r.left + r.width / 2, r.bottom - 10, { n: 40, colors: ['#6b4423', '#3d2a1a', '#8cff5a', '#b46bff'], gravity: 0.12, speed: 5 });
    }, 300);
  };

  msg.textContent = 'The spirits are counting…';
  crystal.classList.add('show');
  Sound.drumroll(1.8);
  at(2200, () => { crystal.classList.remove('show'); msg.textContent = 'From the third grave rises…'; });
  at(3400, () => rise(3));
  at(5600, () => { msg.textContent = 'From the second grave…'; Sound.drumroll(1.2); });
  at(6900, () => rise(2));
  at(9100, () => { msg.textContent = 'And the Supreme Ghoul is…'; Sound.drumroll(2); });
  at(11200, () => {
    rise(1);
    msg.textContent = results[0] ? `👑 ${results[0].name}! 👑` : 'Nobody played… how spooky.';
    if (!results[0]) return;
    Sound.fanfare();
    setTimeout(() => Sound.evilLaugh(), 1500);
    Scene.flyWitch();
    celebrate();
  });
  at(14000, () => $('board').classList.add('show'));
}

function celebrate() {
  if (typeof confetti !== 'function') return;
  const colors = ['#ff7a1a', '#8cff5a', '#b46bff', '#ffd54a', '#ffffff'];
  const end = Date.now() + 4000;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 180, spread: 110, origin: { y: 0.5 }, colors });
}

// ---- buttons ----
$('start-btn').onclick = () => { Sound.unlock(); socket.emit('host:start'); };
$('end-btn').onclick = () => confirm('End the quiz for everyone now?') && socket.emit('host:end');
$('reset-btn').onclick = () => socket.emit('host:reset');
$('replay-btn').onclick = () => reveal(lastResults);
$('clear-btn').onclick = () => confirm('Remove all joined players?') && socket.emit('host:clear');
