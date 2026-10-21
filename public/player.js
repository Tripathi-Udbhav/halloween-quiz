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
let quizOver = false;
let laughing = false;
let pendingStart = null;

function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} }

const SCENE_FOR = { 's-join': 'join', 's-lobby': 'lobby', 's-quiz': 'quiz', 's-done': 'done' };
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
  else if (state.phase === 'ended') showOver();
}

// ---- join, with the evil laugh ----
function playLaugh() {
  laughing = true;
  const word = 'MWA-HA-HA-HA!';
  $('laugh-text').innerHTML = [...word].map((c) => `<span>${c}</span>`).join('');
  $('laugh').classList.add('show');
  setTimeout(() => { Scene.lightning(); Scene.shake(); }, 450);
  return new Promise((resolve) => setTimeout(() => {
    $('laugh').classList.remove('show');
    laughing = false;
    resolve();
  }, 2700));
}

$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  const email = $('email').value.trim();
  const fail = (msg, field) => {
    $('join-error').textContent = msg;
    field.classList.add('bad');
    field.focus();
  };
  $('name').classList.remove('bad');
  $('email').classList.remove('bad');
  if (!name) return fail('Please enter your name', $('name'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Please enter a valid email address', $('email'));
  $('join-btn').disabled = true;
  $('join-error').textContent = '';
  const r = $('join-btn').getBoundingClientRect();
  Scene.spawn(r.left + r.width / 2, r.top + r.height / 2, { n: 30, speed: 5 });

  socket.emit('player:join', { name, email }, (res) => {
    $('join-btn').disabled = false;
    if (res.error) return fail(res.error, /email/i.test(res.error) ? $('email') : $('name'));
    // remember the token immediately so a refresh during the laugh still rejoins
    setToken(res.state.token);
    me = res.state;
    res.state.receivedAt = Date.now();
    playLaugh().then(() => {
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
  Scene.lightning();
  beginQuiz(qs, remainingMs, 0);
});

function beginQuiz(qs, remainingMs, answered) {
  quizOver = false;
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
  if (left <= 0) {
    clearInterval(tick);
    if (!quizOver && onQuiz) {
      Scene.lightning();
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
  Scene.spawn(e.clientX || 0, e.clientY || 0, { n: 20, colors: ['#ff7a1a', '#b46bff', '#8cff5a'] });
  if (navigator.vibrate) navigator.vibrate(30);
  socket.emit('player:answer', { q: current, choice }, (res) => {
    if (!res.ok) return; // time ran out; server will send results
    current = res.answered;
    setTimeout(() => {
      if (quizOver) return;
      if (current >= questions.length) showDone(true);
      else renderQuestion();
    }, 380);
  });
}

function showDone(finishedAll) {
  $('done-title').textContent = finishedAll ? 'Answers Sealed!' : "Time's Up!";
  $('done-text').textContent = finishedAll
    ? 'Your fate is locked in the coffin. Wait for the results on the big screen…'
    : 'The clock has struck midnight. Your answers so far are locked in. Wait for the results on the big screen…';
  show('s-done');
}

// ---- quiz over: positions are only revealed on the big screen ----
socket.on('quiz:over', () => {
  clearInterval(tick);
  showOver();
});

function showOver() {
  quizOver = true;
  $('done-title').textContent = 'The Graves Are Sealed';
  $('done-text').textContent = 'All souls have answered. Eyes on the big screen — the champions are about to rise…';
  show('s-done');
  Scene.lightning();
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
