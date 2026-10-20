const socket = io();
const $ = (id) => document.getElementById(id);
const TOKEN_KEY = 'halloween-quiz-token';

let me = null;
let questions = [];
let current = 0;
let endAt = 0;
let totalMs = 120000;
let tick = null;
let resultShown = false;

function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} }

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
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
  else if (state.phase === 'running') beginQuiz(state.questions, state.remainingMs, state.answered);
  else if (state.phase === 'ended') showResult(state.result);
}

// ---- join ----
$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  $('join-btn').disabled = true;
  socket.emit('player:join', { name }, (res) => {
    $('join-btn').disabled = false;
    if (res.error) return ($('join-error').textContent = res.error);
    applyState(res.state);
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

socket.on('lobby:count', (n) => ($('lobby-count').textContent = n));

// ---- quiz ----
socket.on('quiz:start', ({ questions: qs, remainingMs, quizSeconds }) => {
  if (!me) return; // not joined yet
  totalMs = quizSeconds * 1000;
  beginQuiz(qs, remainingMs, 0);
});

function beginQuiz(qs, remainingMs, answered) {
  resultShown = false;
  questions = qs;
  current = answered;
  endAt = Date.now() + remainingMs;
  clearInterval(tick);
  tick = setInterval(updateTimer, 250);
  updateTimer();
  if (current >= questions.length) return showDone(true);
  show('s-quiz');
  renderQuestion();
}

function updateTimer() {
  const left = Math.max(0, endAt - Date.now());
  const el = $('timer');
  el.textContent = formatClock(left);
  el.classList.toggle('warn', left <= 30000 && left > 10000);
  el.classList.toggle('danger', left <= 10000);
  $('timebar').style.width = (left / totalMs) * 100 + '%';
  if (left <= 0) {
    clearInterval(tick);
    if (!resultShown && $('s-quiz').classList.contains('active')) {
      $('flash').classList.remove('show');
      void $('flash').offsetWidth;
      $('flash').classList.add('show');
      showDone(false);
    }
  }
}

const TAGS = ['🎃', '👻', '🦇', '💀', '🕷️', '🧙'];

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
    b.onclick = () => answer(i, b);
    box.appendChild(b);
  });
  $('dots').innerHTML = questions
    .map((_, i) => `<span class="${i < current ? 'done' : i === current ? 'now' : ''}"></span>`)
    .join('');
  const card = document.querySelector('.question-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'rise 0.35s ease';
}

function answer(choice, btn) {
  document.querySelectorAll('.option').forEach((b) => (b.disabled = true));
  btn.classList.add('picked');
  if (navigator.vibrate) navigator.vibrate(30);
  socket.emit('player:answer', { q: current, choice }, (res) => {
    if (!res.ok) return; // time ran out; server will send results
    current = res.answered;
    setTimeout(() => {
      if (resultShown) return;
      current >= questions.length ? showDone(true) : renderQuestion();
    }, 250);
  });
}

function showDone(finishedAll) {
  $('done-title').textContent = finishedAll ? 'Answers Sealed!' : "Time's Up!";
  $('done-text').textContent = finishedAll
    ? 'Your fate is locked in the coffin. Wait for the others…'
    : 'The clock has struck. Your answers so far are locked in.';
  show('s-done');
}

// ---- results ----
socket.on('quiz:over', (result) => {
  clearInterval(tick);
  showResult(result);
});

function showResult(r) {
  if (!r || r.rank == null) return show('s-lobby');
  resultShown = true;
  $('res-rank').textContent = '#' + r.rank;
  $('res-of').textContent = `out of ${r.playerCount} ${r.playerCount === 1 ? 'player' : 'players'}`;
  $('res-score').textContent = `${r.correct}/${r.total}`;
  $('res-time').textContent = formatTime(r.timeMs);
  $('res-emoji').textContent = r.rank === 1 ? '🏆' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.correct ? '🎃' : '💀';
  const medals = ['🥇', '🥈', '🥉'];
  $('res-top').innerHTML = r.top3
    .map((p, i) => `<div><span>${medals[i]} ${escapeHtml(p.name)}</span><span class="muted">${p.correct}/${r.total} · ${formatTime(p.timeMs)}</span></div>`)
    .join('');
  show('s-result');
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
