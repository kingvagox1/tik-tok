/* ============================================================
   StreamGames – Shared Client Logic
   Socket.IO connection, TikTok auth, toast, chat helpers
   ============================================================ */

const socket = io();

/* ── DOM helper ── */
const $id = (id) => document.getElementById(id);

/* ============================================================
   TIKTOK CONNECTION
   ============================================================ */

/**
 * Lee el input #usernameInput, guarda en sessionStorage y emite string directo.
 */
function connectTikTok() {
  const input = $id('usernameInput');
  if (!input) return;

  const username = input.value.trim().replace(/^@/, '');
  if (!username) {
    showToast('Ingresa un usuario de TikTok', 'error');
    return;
  }

  sessionStorage.setItem('tiktokUser', username);
  socket.emit('connect-tiktok', username);
  showToast(`Conectando a @${username}…`, 'info');
}

/**
 * Desconecta de TikTok y limpia la sesión guardada.
 */
function disconnectTikTok() {
  socket.emit('disconnect-tiktok');
  sessionStorage.removeItem('tiktokUser');
  _updateConnectionUI(false, '');
  showToast('Desconectado de TikTok', 'info');
}

/* ── Auto-reconectar desde sessionStorage ── */
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('tiktokUser');
  if (saved) {
    const input = $id('usernameInput');
    if (input) input.value = saved;
    socket.emit('connect-tiktok', saved);
  }
});

/* ── Enter en el input ── */
document.addEventListener('DOMContentLoaded', () => {
  const input = $id('usernameInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') connectTikTok();
    });
  }
});

/* ============================================================
   SOCKET EVENTS
   ============================================================ */

socket.on('tiktok-status', (data) => {
  const { connected, username, error } = data;
  _updateConnectionUI(connected, username || '');

  if (connected) {
    showToast(`✅ Conectado a @${username}`, 'success');
  } else if (error) {
    showToast(`❌ ${error}`, 'error');
    sessionStorage.removeItem('tiktokUser');
  }
});

/**
 * Actualiza statusDot, connectBtn y disconnectBtn según estado.
 * @param {boolean} connected
 * @param {string} username
 */
function _updateConnectionUI(connected, username) {
  const dot          = $id('statusDot');
  const connectBtn   = $id('connectBtn');
  const disconnectBtn = $id('disconnectBtn');
  const input        = $id('usernameInput');

  if (dot) {
    dot.classList.toggle('connected', connected);
    dot.title = connected ? `Conectado: @${username}` : 'Desconectado';
  }

  if (connectBtn)    connectBtn.style.display    = connected ? 'none'        : 'inline-flex';
  if (disconnectBtn) disconnectBtn.style.display = connected ? 'inline-flex' : 'none';

  if (input && connected && username) input.value = username;
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

let _toastTimer = null;

/**
 * Muestra una notificación toast.
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 */
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  _toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

/* ============================================================
   CHAT HELPERS
   ============================================================ */

/**
 * Agrega un mensaje de chat a un feed.
 * Usa data.user y data.comment (campos unificados del servidor).
 * @param {{ user: string, comment?: string, nickname?: string }} data
 * @param {string} feedId - ID del contenedor
 */
function addChatMessage(data, feedId) {
  const feed = $id(feedId);
  if (!feed) return;

  const user    = escapeHtml(data.user || data.nickname || 'anon');
  const text    = escapeHtml(data.comment || '');
  const initial = user.charAt(0).toUpperCase();

  const msg = document.createElement('div');
  msg.className = 'chat-msg';
  msg.innerHTML = `
    <div class="chat-msg-avatar">${initial}</div>
    <div class="chat-msg-body">
      <span class="chat-msg-user">${user}</span>
      <span class="chat-msg-text">${text}</span>
    </div>
  `;

  feed.appendChild(msg);

  while (feed.children.length > 100) feed.removeChild(feed.firstChild);
  feed.scrollTop = feed.scrollHeight;
}

/**
 * Escapa caracteres HTML especiales.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
