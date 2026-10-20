const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

// ---- Settings you may want to change ----
const QUIZ_SECONDS = Number(process.env.QUIZ_SECONDS) || 120; // whole-quiz timer
const MAX_QUESTIONS = 5;
const HOST_KEY = process.env.HOST_KEY || ''; // optional: protect /host with ?key=...
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

function loadQuestions() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
  return raw.slice(0, MAX_QUESTIONS);
}

let questions = loadQuestions();
let phase = 'lobby'; // lobby | running | ended
let startedAt = 0;
let endsAt = 0;
let endedAt = 0;
let timer = null;
let results = [];
const players = new Map(); // token -> player

app.use(express.static(path.join(__dirname, 'public')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));

app.get('/api/qr', async (req, res) => {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0];
  const url = process.env.PUBLIC_URL || `${proto}://${req.get('host')}/`;
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: { dark: '#14051f', light: '#ffffff' },
  });
  res.json({ url, svg });
});

const publicQuestions = () => questions.map(({ question, options }) => ({ question, options }));
const remainingMs = () => Math.max(0, endsAt - Date.now());

function playerNames() {
  return [...players.values()].map((p) => p.name);
}

function progress() {
  const all = [...players.values()];
  return {
    total: all.length,
    finished: all.filter((p) => p.finished).length,
    answered: all.reduce((n, p) => n + p.answers.length, 0),
  };
}

function hostState() {
  return {
    phase,
    quizSeconds: QUIZ_SECONDS,
    questionCount: questions.length,
    players: playerNames(),
    remainingMs: remainingMs(),
    progress: progress(),
    results: phase === 'ended' ? results : null,
  };
}

function playerResult(p) {
  const r = results.find((x) => x.token === p.token);
  return {
    rank: r ? r.rank : null,
    correct: p.correct,
    total: questions.length,
    timeMs: r ? r.timeMs : null,
    playerCount: results.length,
    top3: results.slice(0, 3).map(({ name, correct, timeMs }) => ({ name, correct, timeMs })),
  };
}

function playerState(p) {
  return {
    token: p.token,
    name: p.name,
    phase,
    playerCount: players.size,
    quizSeconds: QUIZ_SECONDS,
    questions: phase === 'running' ? publicQuestions() : null,
    answered: p.answers.length,
    remainingMs: remainingMs(),
    result: phase === 'ended' ? playerResult(p) : null,
  };
}

function sendHostUpdate() {
  io.to('host').emit('host:state', hostState());
}

let lobbyUpdateQueued = false;
function sendLobbyCount() {
  // batched so a big crowd joining at once doesn't flood every phone
  if (lobbyUpdateQueued) return;
  lobbyUpdateQueued = true;
  setTimeout(() => {
    lobbyUpdateQueued = false;
    io.to('players').emit('lobby:count', players.size);
  }, 500);
}

function startQuiz() {
  questions = loadQuestions(); // pick up edits to questions.json without a restart
  for (const p of players.values()) {
    p.answers = [];
    p.correct = 0;
    p.finished = false;
    p.finishMs = null;
  }
  phase = 'running';
  startedAt = Date.now();
  endsAt = startedAt + QUIZ_SECONDS * 1000;
  results = [];
  clearTimeout(timer);
  timer = setTimeout(endQuiz, QUIZ_SECONDS * 1000);
  io.to('players').emit('quiz:start', { questions: publicQuestions(), remainingMs: remainingMs(), quizSeconds: QUIZ_SECONDS });
  sendHostUpdate();
}

function endQuiz() {
  if (phase !== 'running') return;
  clearTimeout(timer);
  phase = 'ended';
  endedAt = Date.now();
  const fullTime = endedAt - startedAt;

  // Most correct wins; ties go to whoever finished all questions fastest.
  // Anyone who didn't finish is timed as taking the whole quiz.
  results = [...players.values()]
    .map((p) => ({
      token: p.token,
      name: p.name,
      correct: p.correct,
      answered: p.answers.length,
      timeMs: p.finished ? p.finishMs : fullTime,
    }))
    .sort((a, b) => b.correct - a.correct || a.timeMs - b.timeMs)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  for (const p of players.values()) {
    if (p.socketId) io.to(p.socketId).emit('quiz:over', playerResult(p));
  }
  sendHostUpdate();
}

function resetToLobby() {
  clearTimeout(timer);
  phase = 'lobby';
  results = [];
  for (const p of players.values()) {
    p.answers = [];
    p.correct = 0;
    p.finished = false;
    p.finishMs = null;
  }
  io.to('players').emit('quiz:lobby', { playerCount: players.size });
  sendHostUpdate();
}

io.on('connection', (socket) => {
  // ---- Host ----
  socket.on('host:hello', ({ key } = {}) => {
    if (HOST_KEY && key !== HOST_KEY) return socket.emit('host:denied');
    socket.data.isHost = true;
    socket.join('host');
    socket.emit('host:state', hostState());
  });
  socket.on('host:start', () => socket.data.isHost && phase !== 'running' && startQuiz());
  socket.on('host:end', () => socket.data.isHost && endQuiz());
  socket.on('host:reset', () => socket.data.isHost && resetToLobby());
  socket.on('host:clear', () => {
    if (!socket.data.isHost || phase === 'running') return;
    players.clear();
    io.to('players').emit('quiz:kicked');
    resetToLobby();
  });

  // ---- Players ----
  socket.on('player:join', ({ token, name } = {}, ack) => {
    let p = token && players.get(token);
    if (!p) {
      name = String(name || '').trim().slice(0, 24);
      if (!name) return ack && ack({ error: 'Please enter your name' });
      p = {
        token: crypto.randomUUID(),
        name,
        answers: [],
        correct: 0,
        finished: false,
        finishMs: null,
      };
      players.set(p.token, p);
    }
    p.socketId = socket.id;
    socket.data.token = p.token;
    socket.join('players');
    ack && ack({ ok: true, state: playerState(p) });
    sendLobbyCount();
    sendHostUpdate();
  });

  socket.on('player:answer', ({ q, choice } = {}, ack) => {
    const p = players.get(socket.data.token);
    if (!p || phase !== 'running' || Date.now() > endsAt) return ack && ack({ ok: false });
    if (q !== p.answers.length || q >= questions.length) return ack && ack({ ok: false });
    const options = questions[q].options || [];
    if (!Number.isInteger(choice) || choice < 0 || choice >= options.length) return ack && ack({ ok: false });

    p.answers.push(choice);
    if (choice === questions[q].answer) p.correct++;
    if (p.answers.length === questions.length) {
      p.finished = true;
      p.finishMs = Date.now() - startedAt;
    }
    ack && ack({ ok: true, answered: p.answers.length });
    sendHostUpdate();

    // end early if everyone is done
    if ([...players.values()].every((x) => x.finished)) endQuiz();
  });

  socket.on('disconnect', () => {
    const p = players.get(socket.data.token);
    if (p && p.socketId === socket.id) p.socketId = null;
  });
});

server.listen(PORT, () => {
  // On Render, RENDER_EXTERNAL_URL is the public link; localhost only works on this machine
  const base = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
  console.log(`Halloween quiz running. Player link: ${base}/`);
  console.log(`Host screen: ${base}/host${HOST_KEY ? '?key=' + HOST_KEY : ''}`);
});
