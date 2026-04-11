const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app    = express();
const server = http.createServer(app);

// Socket.IO con CORS abierto para funcionar en cualquier dominio
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Confiar en proxy (necesario en Heroku, Railway, Render, etc.)
app.set('trust proxy', 1);

// Servir archivos estáticos
app.use(express.static('public'));

// Health check para hosting
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Estado global ──
let tiktokConnection = null;
let currentUsername  = '';

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar estado actual al nuevo cliente
  if (tiktokConnection && currentUsername) {
    socket.emit('tiktok-status', { connected: true, username: currentUsername });
  }

  // ── Conectar a TikTok Live ──
  socket.on('connect-tiktok', async (rawUsername) => {
    // Acepta string directo o { username }
    const username = (typeof rawUsername === 'object' && rawUsername !== null)
      ? (rawUsername.username || '').toString().trim().replace(/^@/, '')
      : String(rawUsername).trim().replace(/^@/, '');

    if (!username) {
      socket.emit('tiktok-status', { connected: false, error: 'Usuario vacío' });
      return;
    }

    // Desconectar sesión anterior
    if (tiktokConnection) {
      try { tiktokConnection.disconnect(); } catch (_) {}
      tiktokConnection = null;
    }

    currentUsername   = username;
    tiktokConnection  = new WebcastPushConnection(username);

    try {
      await tiktokConnection.connect();
      io.emit('tiktok-status', { connected: true, username });
      console.log(`✅ Conectado al live de @${username}`);
    } catch (err) {
      console.error(`❌ Error conectando a @${username}:`, err.message);
      socket.emit('tiktok-status', { connected: false, error: err.message });
      tiktokConnection = null;
      currentUsername  = '';
      return;
    }

    // Mensajes del chat
    tiktokConnection.on('chat', (data) => {
      io.emit('chat-message', {
        user:           data.uniqueId,
        nickname:       data.nickname,
        comment:        data.comment,
        profilePicture: data.profilePictureUrl || ''
      });
    });

    // Likes
    tiktokConnection.on('like', (data) => {
      io.emit('like', {
        user:      data.uniqueId,
        nickname:  data.nickname,
        likeCount: data.likeCount
      });
    });

    // Nuevos seguidores
    tiktokConnection.on('follow', (data) => {
      io.emit('follow', {
        user:     data.uniqueId,
        nickname: data.nickname
      });
    });

    // Desconexión inesperada
    tiktokConnection.on('disconnected', () => {
      console.warn(`⚠️  Live de @${username} desconectado`);
      io.emit('tiktok-status', { connected: false, error: 'Live desconectado' });
      tiktokConnection = null;
      currentUsername  = '';
    });

    tiktokConnection.on('error', (err) => {
      console.error('TikTok error:', err.message);
    });
  });

  // ── Desconexión manual ──
  socket.on('disconnect-tiktok', () => {
    if (tiktokConnection) {
      try { tiktokConnection.disconnect(); } catch (_) {}
      tiktokConnection = null;
    }
    currentUsername = '';
    io.emit('tiktok-status', { connected: false });
    console.log('🔌 Desconectado manualmente de TikTok');
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
