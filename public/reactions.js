/* ============================================================
   StreamGames – Reacciones flotantes en vivo
   Los emojis del chat flotan en pantalla como en TikTok
   ============================================================ */

const REACTION_EMOJIS = new Set([
  '❤️','🔥','😂','😍','🥳','👏','💯','🎉','😭','🤣',
  '💪','🙌','😎','🤩','💀','👑','✨','🌟','💥','🎊',
  '❤','🧡','💛','💚','💙','💜','🖤','🤍','💗','💓',
  '😆','😅','🤔','😱','🥰','😘','🤯','🫶','👍','🫡'
]);

const REACTION_COLORS = [
  '#e22227','#c9a84c','#ff6b6b','#ffd93d','#6bcb77',
  '#4d96ff','#ff6bff','#ff9f43','#ee5a24','#0abde3'
];

function _isEmoji(str) {
  // Detectar si el mensaje es principalmente emojis
  const clean = str.replace(/\s/g, '');
  if (clean.length === 0) return false;
  // Verificar si contiene emojis conocidos
  for (const e of REACTION_EMOJIS) {
    if (str.includes(e)) return true;
  }
  // Detectar emojis por regex
  const emojiRegex = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const matches = str.match(emojiRegex);
  return matches && matches.length >= 1 && matches.length >= clean.length * 0.5;
}

function _extractEmojis(str) {
  const emojiRegex = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|❤️|🔥|😂|😍|🥳|👏|💯|🎉|😭|🤣|💪|🙌|😎|🤩|💀|👑|✨|🌟|💥|🎊|❤|🧡|💛|💚|💙|💜|🖤|🤍|💗|💓|😆|😅|🤔|😱|🥰|😘|🤯|🫶|👍|🫡/gu;
  return str.match(emojiRegex) || [];
}

function _spawnReaction(emoji) {
  const container = document.getElementById('_reactionsContainer');
  if (!container) return;

  const el = document.createElement('div');
  const x  = 10 + Math.random() * 80; // % horizontal
  const size = 1.8 + Math.random() * 1.4; // rem
  const dur  = 2.5 + Math.random() * 2;   // segundos
  const delay = Math.random() * 0.3;
  const color = REACTION_COLORS[Math.floor(Math.random() * REACTION_COLORS.length)];
  const drift = (Math.random() - 0.5) * 60; // px horizontal drift

  el.style.cssText = `
    position: absolute;
    bottom: 0;
    left: ${x}%;
    font-size: ${size}rem;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    animation: _reactionFloat ${dur}s ease-out ${delay}s forwards;
    --drift: ${drift}px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    z-index: 1;
  `;
  el.textContent = emoji;
  container.appendChild(el);
  setTimeout(() => el.remove(), (dur + delay + 0.5) * 1000);
}

function _createReactionsContainer() {
  if (document.getElementById('_reactionsContainer')) return;

  // CSS de animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes _reactionFloat {
      0%   { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
      10%  { transform: translateY(-20px) translateX(calc(var(--drift) * 0.1)) scale(1.2); opacity: 1; }
      50%  { transform: translateY(-50vh) translateX(calc(var(--drift) * 0.5)) scale(1); opacity: 0.9; }
      100% { transform: translateY(-90vh) translateX(var(--drift)) scale(0.6); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Contenedor
  const container = document.createElement('div');
  container.id = '_reactionsContainer';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 8000;
    overflow: hidden;
  `;
  document.body.appendChild(container);
}

// Throttle para no spawnear demasiados
let _lastReaction = 0;
const _REACTION_THROTTLE = 150; // ms entre reacciones

function handleReaction(comment) {
  const now = Date.now();
  if (now - _lastReaction < _REACTION_THROTTLE) return;

  const emojis = _extractEmojis(comment);
  if (!emojis.length) return;

  _lastReaction = now;
  // Spawnear hasta 3 emojis del mensaje
  emojis.slice(0, 3).forEach((emoji, i) => {
    setTimeout(() => _spawnReaction(emoji), i * 80);
  });
}

/* ── Escuchar chat ── */
socket.on('chat-message', (data) => {
  if (data.comment) handleReaction(data.comment);
});

/* ── Init ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _createReactionsContainer);
} else {
  _createReactionsContainer();
}
