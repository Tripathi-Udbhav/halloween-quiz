const socket = io();
const $ = (id) => document.getElementById(id);
const TOKEN_KEY = 'halloween-quiz-token';
const RING_LEN = 2 * Math.PI * 19;

let me = null;
let questions = [];
let current = 0;
let endAt = 0;
let totalMs = 120000;
let tick = null;
let resultShown = false;
let lastBeat = 0;
let laughing = false;
let pendingStart = null;

function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} }

const SCENE_FOR = { 's-join': 'join', 's-lobby': 'lobby', 's-quiz': 'quiz', 's-done': 'done', 's-result': 'results' };
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  Scene.setMode(SCENE_FOR[id]);
  document.body.classList.toggle('danger', false);
  window.scrollTo(0, 0);
}

function applyState(state) {
  me = state;
  setToken(state.token);
  $('lobby-name').textContent = state.name;
  $('quiz-name').textContent = state.name;
  $('lobby-count').textContent = state.playerCount;
  totalMs = state.quizSeconds * 1000;
  const mins = state.quizSeconds / 60;
  $('lobby-time').textContent = Number.isInteger(mins) ? `${mins} minute${mins === 1 ? '' : 's'}` : `${state.quizSeconds} seconds`;
  if (state.phase === 'lobby') show('s-lobby');
  else if (state.phase === 'running') beginQuiz(state.questions, state.remainingMs - (Date.now() - (state.receivedAt || Date.now())), state.answered);
  else if (state.phase === 'ended') showResult(state.result);
}

// ---- join, with the evil laugh ----
function playLaugh() {
  laughing = true;
  const word = 'MWA-HA-HA-HA!';
  $('laugh-text').innerHTML = [...word].map((c) => `<span>${c}</span>`).join('');
  $('laugh').classList.add('show');
  Sound.evilLaugh();
  setTimeout(() => { Scene.lightning(false); Scene.shake(); }, 450);
  return new Promise((resolve) => setTimeout(() => {
    $('laugh').classList.remove('show');
    laughing = false;
    resolve();
  }, 2700));
}

$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  Sound.unlock();
  $('join-btn').disabled = true;
  $('join-error').textContent = '';
  const r = $('join-btn').getBoundingClientRect();
  Scene.spawn(r.left + r.width / 2, r.top + r.height / 2, { n: 30, speed: 5 });

  const joined = new Promise((resolve) => socket.emit('player:join', { name }, resolve));
  const laugh = playLaugh();
  joined.then((res) => {
    $('join-btn').disabled = false;
    if (res.error) {
      $('laugh').classList.remove('show');
      $('join-error').textContent = res.error;
      return;
    }
    // remember the token immediately so a refresh during the laugh still rejoins
    setToken(res.state.token);
    me = res.state;
    res.state.receivedAt = Date.now();
    laugh.then(() => {
      applyState(res.state);
      if (pendingStart) {
        const p = pendingStart;
        pendingStart = null;
        beginQuiz(p.questions, p.endAt - Date.now(), 0);
      }
    });
  });
});

// rejoin automatically after refresh or a dropped connection
socket.on('connect', () => {
  const token = getToken();
  if (!token) return;
  socket.emit('player:join', { token }, (res) => {
    if (res.ok) applyState(res.state);
    else setToken(null);
  });
});

socket.on('lobby:count', (n) => {
  const el = $('lobby-count');
  if (String(n) === el.textContent) return;
  el.textContent = n;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
});

// ---- quiz ----
socket.on('quiz:start', ({ questions: qs, remainingMs, quizSeconds }) => {
  if (!me) return; // not joined yet
  totalMs = quizSeconds * 1000;
  if (laughing) {
    // the host started while the laugh was playing: begin right after it
    pendingStart = { questions: qs, endAt: Date.now() + remainingMs };
    return;
  }
  Scene.lightning(true);
  beginQuiz(qs, remainingMs, 0);
});

function beginQuiz(qs, remainingMs, answered) {
  resultShown = false;
  questions = qs;
  current = answered;
  endAt = Date.now() + remainingMs;
  clearInterval(tick);
  tick = setInterval(updateTimer, 250);
  if (current >= questions.length) return showDone(true);
  show('s-quiz');
  updateTimer();
  renderQuestion();
}

function updateTimer() {
  const left = Math.max(0, endAt - Date.now());
  $('timer').textContent = formatClock(left);
  for (const id of ['ring-prog', 'ring-glow']) {
    $(id).style.strokeDasharray = RING_LEN;
    $(id).style.strokeDashoffset = RING_LEN * (1 - left / totalMs);
  }
  const ring = $('ring');
  ring.classList.toggle('warn', left <= 30000 && left > 10000);
  ring.classList.toggle('danger', left <= 10000);
  const onQuiz = $('s-quiz').classList.contains('active');
  document.body.classList.toggle('danger', onQuiz && left <= 10000 && left > 0);
  if (onQuiz && left <= 10000 && left > 0 && Date.now() - lastBeat > 950) {
    lastBeat = Date.now();
    Sound.heartbeat();
  }
  if (left <= 0) {
    clearInterval(tick);
    if (!resultShown && onQuiz) {
      Scene.lightning(true);
      Scene.shake();
      showDone(false);
    }
  }
}

const TAGS = ['🎃', '👻', '🦇', '💀', '🕷️', '🧙'];
const DOTS = ['🎃', '🦇', '👻', '💀', '🧟'];

function renderQuestion() {
  const q = questions[current];
  $('q-count').textContent = `Question ${current + 1} of ${questions.length}`;
  $('q-text').textContent = q.question;
  const box = $('options');
  box.innerHTML = '';
  q.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option';
    b.innerHTML = `<span class="tag">${TAGS[i % TAGS.length]}</span><span></span>`;
    b.lastChild.textContent = opt;
    b.onclick = (e) => answer(i, b, e);
    box.appendChild(b);
  });
  $('dots').innerHTML = questions
    .map((_, i) => `<span class="${i < current ? 'done' : i === current ? 'now' : ''}">${DOTS[i % DOTS.length]}</span>`)
    .join('');
  const card = document.querySelector('.question-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'rise-in 0.45s cubic-bezier(.2,.9,.3,1.2)';
}

function answer(choice, btn, e) {
  document.querySelectorAll('.option').forEach((b) => (b.disabled = true));
  btn.classList.add('picked');
  Sound.bubble();
  Scene.spawn(e.clientX || 0, e.clientY || 0, { n: 20, colors: ['#ff7a1a', '#b46bff', '#8cff5a'] });
  if (navigator.vibrate) navigator.vibrate(30);
  socket.emit('player:answer', { q: current, choice }, (res) => {
    if (!res.ok) return; // time ran out; server will send results
    current = res.answered;
    setTimeout(() => {
      if (resultShown) return;
      if (current >= questions.length) {
        Sound.ghost();
        showDone(true);
      } else renderQuestion();
    }, 380);
  });
}

function showDone(finishedAll) {
  $('done-title').textContent = finishedAll ? 'Answers Sealed!' : "Time's Up!";
  $('done-text').textContent = finishedAll
    ? 'Your fate is locked in the coffin. Wait for the others…'
    : 'The clock has struck midnight. Your answers so far are locked in.';
  show('s-done');
}

// ---- results ----
socket.on('quiz:over', (result) => {
  clearInterval(tick);
  showResult(result);
});

const EPITAPHS = {
  win: ['Rose from the grave to rule them all.', 'Feared by the living, envied by the dead.', 'The crypt bows to its new ruler.'],
  podium: ['So close to the throne, they can smell the crown.', 'A legend whispered around every cauldron.', 'Too powerful to stay buried.'],
  good: ['Potted with skill, haunted by one mistake.', 'Will return next Halloween… stronger.', 'Gone, but not forgotten by the leaderboard.'],
  meh: ['Wandered the graveyard, found some answers.', 'Lost in the fog… but still standing.', 'Brains: present. Answers: partially.'],
  zero: ['Rest in peace, sweet potting soul.', 'The pumpkins remain unlit… for now.', 'Even the zombies feel sorry.'],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function showResult(r) {
  if (!r || r.rank == null) return show('s-lobby');
  resultShown = true;
  const t = ghoulTitle(r.rank, r.correct, r.total, r.playerCount);
  $('res-icon').textContent = r.rank === 1 ? '🏆' : t.icon; // the tombstone already wears the crown
  $('res-title').textContent = t.title;
  $('res-name').textContent = me ? me.name : '';
  $('res-of').textContent = `of ${r.playerCount} ${r.playerCount === 1 ? 'soul' : 'souls'}`;
  $('res-score').textContent = `${r.correct}/${r.total}`;
  $('res-time').textContent = formatTime(r.timeMs);

  const tomb = $('tomb');
  tomb.className = 'tomb' + (r.rank === 1 ? ' gold' : r.rank === 2 ? ' silver' : r.rank === 3 ? ' bronze' : '');
  $('tomb-crown').style.display = r.rank === 1 ? '' : 'none';
  $('tomb-lies').textContent = r.rank <= 3 && r.correct > 0 ? 'ALL HAIL' : 'HERE LIES';
  const tier = r.correct === 0 ? 'zero' : r.rank === 1 ? 'win' : r.rank <= 3 ? 'podium' : r.correct >= r.total * 0.6 ? 'good' : 'meh';
  $('res-epitaph').textContent = '“' + pick(EPITAPHS[tier]) + '”';

  const medals = ['🥇', '🥈', '🥉'];
  $('res-top').innerHTML = r.top3
    .map((p, i) => `<div class="row"><span>${medals[i]} ${escapeHtml(p.name)}</span><span class="muted">${p.correct}/${r.total} · ${formatTime(p.timeMs)}</span></div>`)
    .join('');

  // pumpkins: one per question, lit for each correct answer
  const row = $('res-pumpkins');
  row.innerHTML = Array.from({ length: r.total }, () => `<div class="pk">${Scene.PUMPKIN_SVG}</div>`).join('');
  show('s-result');

  // rank "rises from the grave": count down from the bottom to the real rank
  const rankEl = $('res-rank');
  const from = Math.max(r.playerCount, r.rank);
  const steps = Math.min(20, from - r.rank);
  rankEl.textContent = from;
  let s = 0;
  const count = setInterval(() => {
    s++;
    rankEl.textContent = steps ? Math.round(from - ((from - r.rank) * s) / steps) : r.rank;
    if (s >= steps) clearInterval(count);
  }, 60);

  [...row.children].forEach((el, i) => {
    if (i < r.correct) setTimeout(() => { el.classList.add('lit'); Sound.pop(); }, 1300 + i * 260);
  });

  setTimeout(() => {
    if (r.rank === 1) {
      Sound.fanfare();
      setTimeout(() => Sound.evilLaugh(), 1400);
      celebrate();
      Scene.flyWitch();
    } else if (r.rank <= 3) {
      Sound.cackle();
      celebrate();
      Scene.flyWitch();
    } else {
      Sound.groan(1.1);
    }
  }, 1200);
}

function celebrate() {
  if (typeof confetti !== 'function') return;
  const colors = ['#ff7a1a', '#b46bff', '#8cff5a', '#ffd54a', '#ffffff'];
  const end = Date.now() + 2500;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 90, spread: 100, origin: { y: 0.5 }, colors: ['#ff7a1a', '#b46bff', '#8cff5a', '#ffd54a'] });
}

socket.on('quiz:lobby', ({ playerCount }) => {
  clearInterval(tick);
  if (!me) return;
  $('lobby-count').textContent = playerCount;
  show('s-lobby');
});

socket.on('quiz:kicked', () => {
  setToken(null);
  me = null;
  show('s-join');
});
