const socket = io();
const $ = (id) => document.getElementById(id);
const key = new URLSearchParams(location.search).get('key') || '';

let phase = null;
let endAt = 0;
let tick = null;
let shownNames = 0;
let questionCount = 5;
let revealTimers = [];

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
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
  }
  shownNames = names.length;
  chips.scrollTop = chips.scrollHeight;
}

function updateCountdown() {
  const left = Math.max(0, endAt - Date.now());
  const el = $('countdown');
  el.textContent = formatClock(left);
  el.classList.toggle('warn', left <= 30000 && left > 10000);
  el.classList.toggle('danger', left <= 10000);
  if (left <= 0) clearInterval(tick);
}

// ---- dramatic winners reveal: 3rd, then 2nd, then 1st ----
let lastResults = [];
function reveal(results) {
  lastResults = results;
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  [1, 2, 3].forEach((n) => {
    const el = $('place-' + n);
    el.classList.remove('show');
    const r = results[n - 1];
    el.querySelector('.who').textContent = r ? r.name : '—';
    el.querySelector('.meta').textContent = r ? `${r.correct}/${questionCount} · ${formatTime(r.timeMs)}` : '';
    el.style.visibility = r ? 'visible' : 'hidden';
  });
  $('board').classList.remove('show');
  $('board-body').innerHTML = results
    .map((r) => `<tr><td>${r.rank}</td><td>${escapeHtml(r.name)}</td><td>${r.correct}/${questionCount}</td><td>${formatTime(r.timeMs)}</td></tr>`)
    .join('');

  const msg = $('reveal-msg');
  const at = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
  msg.textContent = 'The spirits are counting…';
  at(1800, () => { msg.textContent = 'In third place…'; });
  at(3300, () => { $('place-3').classList.add('show'); });
  at(5000, () => { msg.textContent = 'In second place…'; });
  at(6500, () => { $('place-2').classList.add('show'); });
  at(8300, () => { msg.textContent = 'And the Supreme Ghoul is…'; });
  at(10300, () => {
    $('place-1').classList.add('show');
    msg.textContent = results[0] ? `👑 ${results[0].name}! 👑` : 'Nobody played… spooky.';
    celebrate();
  });
  at(12500, () => $('board').classList.add('show'));
}

function celebrate() {
  if (typeof confetti !== 'function') return;
  const colors = ['#ff7a1a', '#8cff5a', '#6b2fa3', '#ffb347', '#ffffff'];
  const end = Date.now() + 3000;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 }, colors });
}

// ---- buttons ----
$('start-btn').onclick = () => socket.emit('host:start');
$('end-btn').onclick = () => confirm('End the quiz for everyone now?') && socket.emit('host:end');
$('reset-btn').onclick = () => socket.emit('host:reset');
$('replay-btn').onclick = () => reveal(lastResults);
$('clear-btn').onclick = () => confirm('Remove all joined players?') && socket.emit('host:clear');
