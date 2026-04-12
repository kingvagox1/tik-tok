const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const credits = require('./credits');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('trust proxy', 1);
app.use(express.static('public'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/credits', (_req, res) => res.json(credits.getLeaderboard(50)));
app.get('/api/credits/:user', (req, res) => res.json(credits.getUser(req.params.user)));

// ── Estado global ──
let tiktokConnection = null;
let currentUsername  = '';
let demoInterval     = null;

const DEMO_USERS = ['maria123','juanito_gamer','streamer_fan','tiktok_user','pepito22','laura_live','carlos_x','sofia_vip'];
const DEMO_MSGS  = ['!entrar','hola!!','!girar','buenas noches','!atacar','!rojo','!azul','!nunca comer pizza a las 3am','!si','!no','A','B','C','D','!verdad dime un secreto','!reto baila 10 segundos','!mayor','!menor','jajaja','que divertido!','yo quiero participar','hola streamer','buena suerte a todos'];

function startDemo() {
  if (demoInterval) return;
  demoInterval = setInterval(() => {
    const user    = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    const comment = DEMO_MSGS[Math.floor(Math.random() * DEMO_MSGS.length)];
    io.emit('chat-message', { user, nickname: user, comment, profilePicture: '' });
    if (Math.random() < 0.2) io.emit('like', { user, nickname: user, likeCount: Math.floor(Math.random() * 5) + 1 });
    if (Math.random() < 0.05) io.emit('follow', { user, nickname: user });
  }, 1500);
  console.log('🎮 Modo demo activado');
}

function stopDemo() {
  if (demoInterval) { clearInterval(demoInterval); demoInterval = null; }
}

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar estado actual al nuevo cliente
  if (tiktokConnection && currentUsername) socket.emit('tiktok-status', { connected: true, username: currentUsername });
  else if (demoInterval) socket.emit('tiktok-status', { connected: true, username: 'DEMO' });

  // ── Estado ──
  socket.on('get-status', () => {
    if (tiktokConnection && currentUsername) socket.emit('current-status', { connected: true, username: currentUsername });
    else if (demoInterval) socket.emit('current-status', { connected: true, username: 'DEMO' });
    else socket.emit('current-status', { connected: false });
  });

  // ── Moderadores – Trivia ──
  socket.on('mod-add-question', (q) => {
    if (!q || !q.text || !q.options || q.options.length < 2) return;
    io.emit('mod-question-added', q);
    console.log('Mod agregó pregunta:', q.text);
  });
  socket.on('mod-reveal-answer', () => io.emit('mod-reveal-answer'));
  socket.on('mod-next-question', () => io.emit('mod-next-question'));
  socket.on('mod-start-timer',  (s) => io.emit('mod-start-timer', s || 30));

  // ── Créditos ──
  socket.on('get-leaderboard', () => socket.emit('leaderboard', credits.getLeaderboard(20)));

  socket.on('add-credits', ({ user, amount, reason }) => {
    if (!user || !amount) return;
    const u = credits.addCredits(user, amount, reason || 'manual');
    io.emit('credits-update', { user, credits: u.credits, earned: amount, reason: reason || 'Premio del streamer' });
    io.emit('leaderboard', credits.getLeaderboard(20));
  });

  socket.on('reset-credits', () => {
    credits.resetAll();
    io.emit('credits-reset');
    io.emit('leaderboard', credits.getLeaderboard(20));
  });

  socket.on('get-user-credits', (username) => socket.emit('user-credits', credits.getUser(username)));

  socket.on('game-result', ({ winners = [], losers = [], winAmount = 10, loseAmount = 5, game = '' }) => {
    const updates = [];
    winners.forEach(user => {
      if (!user) return;
      const u = credits.addCredits(user, winAmount, `win_${game}`);
      credits.recordAction(user, 'win');
      updates.push({ user, credits: u.credits, earned: winAmount, reason: `¡Ganó en ${game}!` });
    });
    losers.forEach(user => {
      if (!user) return;
      credits.spendCredits(user, loseAmount);
      const u = credits.getUser(user);
      updates.push({ user, credits: u.credits, earned: -loseAmount, reason: `Perdió en ${game}` });
    });
    updates.forEach(upd => io.emit('credits-update', upd));
    io.emit('leaderboard', credits.getLeaderboard(20));
  });

  // ── Demo ──
  socket.on('start-demo', () => {
    stopDemo();
    currentUsername = 'DEMO';
    io.emit('tiktok-status', { connected: true, username: 'DEMO' });
    startDemo();
  });
  socket.on('stop-demo', () => {
    stopDemo();
    currentUsername = '';
    io.emit('tiktok-status', { connected: false });
  });

  // ── Conectar TikTok ──
  socket.on('connect-tiktok', async (rawUsername) => {
    const username = (typeof rawUsername === 'object' && rawUsername !== null)
      ? (rawUsername.username || '').toString().trim().replace(/^@/, '')
      : String(rawUsername).trim().replace(/^@/, '');

    if (!username) { socket.emit('tiktok-status', { connected: false, error: 'Usuario vacío' }); return; }

    stopDemo();
    if (tiktokConnection) { try { tiktokConnection.disconnect(); } catch (_) {} tiktokConnection = null; }

    currentUsername  = username;
    tiktokConnection = new WebcastPushConnection(username);

    try {
      await tiktokConnection.connect();
      io.emit('tiktok-status', { connected: true, username });
      console.log(`✅ Conectado al live de @${username}`);
    } catch (err) {
      console.error(`❌ Error conectando a @${username}:`, err.message);
      socket.emit('tiktok-status', { connected: false, error: err.message });
      tiktokConnection = null; currentUsername = ''; return;
    }

    tiktokConnection.on('chat', (data) => {
      const user = data.uniqueId;
      const msg  = (data.comment || '').trim().toLowerCase();
      const GAME_CMDS = ['!entrar','!girar','!rojo','!azul','!atacar','!mayor','!menor','!si','!no'];
      const VOTE_CMDS = ['a','b','c','d'];

      if (GAME_CMDS.includes(msg)) {
        const u = credits.addCredits(user, 5, 'game_cmd');
        credits.recordAction(user, 'spin');
        io.emit('credits-update', { user, credits: u.credits, earned: 5, reason: 'Participó en juego' });
      } else if (VOTE_CMDS.includes(msg)) {
        const u = credits.addCredits(user, 3, 'vote');
        credits.recordAction(user, 'vote');
        io.emit('credits-update', { user, credits: u.credits, earned: 3, reason: 'Votó en trivia' });
      } else if (msg.startsWith('!nunca ') || msg.startsWith('!verdad ') || msg.startsWith('!reto ')) {
        const u = credits.addCredits(user, 8, 'propose');
        io.emit('credits-update', { user, credits: u.credits, earned: 8, reason: 'Propuso en juego' });
      }

      io.emit('chat-message', {
        user, nickname: data.nickname, comment: data.comment,
        profilePicture: data.profilePictureUrl || '',
        userCredits: credits.getCredits(user)
      });
    });

    tiktokConnection.on('like', (data) => {
      io.emit('like', { user: data.uniqueId, nickname: data.nickname, likeCount: data.likeCount });
    });

    tiktokConnection.on('gift', (data) => {
      const user     = data.uniqueId;
      const diamonds = (data.diamondCount || 0) * (data.repeatCount || 1);
      const earned   = Math.max(10, diamonds * 2);
      const u = credits.addCredits(user, earned, 'gift');
      io.emit('gift', {
        user, nickname: data.nickname,
        giftName: data.giftName, giftId: data.giftId,
        repeatCount: data.repeatCount || 1,
        diamondCount: data.diamondCount || 0,
        giftPicture:    data.giftPictureUrl || '',
        profilePicture: data.profilePictureUrl || ''
      });
      io.emit('credits-update', { user, credits: u.credits, earned, reason: `Envió ${data.giftName}` });
    });

    tiktokConnection.on('follow', (data) => {
      const user = data.uniqueId;
      const u = credits.addCredits(user, 20, 'follow');
      io.emit('follow', { user, nickname: data.nickname, profilePicture: data.profilePictureUrl || '' });
      io.emit('credits-update', { user, credits: u.credits, earned: 20, reason: '¡Siguió el canal!' });
    });

    tiktokConnection.on('disconnected', () => {
      console.warn(`⚠️  Live de @${username} desconectado`);
      io.emit('tiktok-status', { connected: false, error: 'Live desconectado' });
      tiktokConnection = null; currentUsername = '';
    });

    tiktokConnection.on('error', (err) => console.error('TikTok error:', err.message));
  });

  socket.on('disconnect-tiktok', () => {
    stopDemo();
    if (tiktokConnection) { try { tiktokConnection.disconnect(); } catch (_) {} tiktokConnection = null; }
    currentUsername = '';
    io.emit('tiktok-status', { connected: false });
  });

  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
