/* ============================================================
   StreamGames – Panel de Créditos (Cliente)
   Muestra ranking, créditos ganados y notificaciones
   ============================================================ */

/* ── Config de puntos (visible para el streamer) ── */
const CREDIT_RULES = [
  { action: '!entrar, !girar, !rojo, !azul, !atacar', points: '+5',  icon: '🎮' },
  { action: 'Votar A/B/C/D en trivia',                points: '+3',  icon: '🧠' },
  { action: 'Acertar en trivia',                       points: '+10', icon: '✅' },
  { action: 'Fallar en trivia',                        points: '-3',  icon: '❌' },
  { action: 'Acertar Mayor o Menor',                   points: '+8',  icon: '🃏' },
  { action: 'Fallar Mayor o Menor',                    points: '-3',  icon: '🃏' },
  { action: 'Ganar Batalla de Equipos',                points: '+15', icon: '⚔️' },
  { action: 'Perder Batalla de Equipos',               points: '-5',  icon: '💀' },
  { action: 'Proponer frase/verdad/reto',              points: '+8',  icon: '💬' },
  { action: 'Seguir el canal',                         points: '+20', icon: '❤️' },
  { action: 'Enviar regalo',                           points: '+2x💎', icon: '🎁' },
];

/* ── Notificaciones flotantes de créditos ── */
const _notifQueue = [];
let _notifActive  = false;

function _showCreditNotif(user, earned, reason) {
  _notifQueue.push({ user, earned, reason });
  if (!_notifActive) _nextNotif();
}

function _nextNotif() {
  if (!_notifQueue.length) { _notifActive = false; return; }
  _notifActive = true;
  const { user, earned, reason } = _notifQueue.shift();

  let container = document.getElementById('_creditNotifs');
  if (!container) {
    container = document.createElement('div');
    container.id = '_creditNotifs';
    container.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9997;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.style.cssText = `
    background:${earned < 0
      ? 'linear-gradient(135deg,rgba(239,68,68,0.9),rgba(185,28,28,0.9))'
      : 'linear-gradient(135deg,rgba(124,58,237,0.9),rgba(255,45,85,0.9))'};
    border-radius:12px;padding:10px 16px;
    box-shadow:0 8px 24px rgba(0,0,0,0.5);
    animation:_cnIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    display:flex;align-items:center;gap:10px;
    min-width:220px;max-width:280px;
  `;
  el.innerHTML = `
    <div style="font-size:1.4rem;">${earned < 0 ? '💸' : '⭐'}</div>
    <div>
      <div style="font-weight:700;color:#fff;font-size:0.85rem;">@${escapeHtml(user)}</div>
      <div style="color:rgba(255,255,255,0.85);font-size:0.75rem;">${earned < 0 ? '' : '+'}${earned} créditos · ${escapeHtml(reason||'')}</div>
    </div>
    <div style="margin-left:auto;font-size:1.1rem;font-weight:900;color:${earned < 0 ? '#fca5a5' : '#fde68a'};">${earned < 0 ? '' : '+'}${earned}</div>
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => { el.remove(); _nextNotif(); }, 320);
  }, 2500);
}

/* ── CSS ── */
function _creditCSS() {
  if (document.getElementById('_creditCSS')) return;
  const s = document.createElement('style');
  s.id = '_creditCSS';
  s.textContent = `
    @keyframes _cnIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
    @keyframes _cpGlow {
      0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3),0 20px 60px rgba(0,0,0,0.7)}
      50%{box-shadow:0 0 30px rgba(255,45,85,0.3),0 20px 60px rgba(0,0,0,0.7)}
    }
    #_creditPanel { animation:_cpGlow 4s ease infinite; }
    #_creditPanel *{ box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif; }
    #_lbList::-webkit-scrollbar{ width:3px; }
    #_lbList::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.1);border-radius:3px; }
    ._cpBtn { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
      color:#888;cursor:pointer;padding:5px 10px;border-radius:8px;
      font-size:0.78rem;font-weight:600;transition:all 0.2s; }
    ._cpBtn:hover { background:rgba(255,255,255,0.1);color:#f0f0f0; }
    ._cpInput { background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      color:#f0f0f0;padding:6px 10px;border-radius:8px;font-size:0.8rem;outline:none;width:100%; }
    ._cpInput:focus { border-color:#7c3aed; }
    ._cpInput::placeholder { color:#555; }
  `;
  document.head.appendChild(s);
}

/* ── Build panel ── */
function _buildCreditPanel() {
  if (document.getElementById('_creditPanel')) return;
  _creditCSS();

  const p = document.createElement('div');
  p.id = '_creditPanel';
  p.style.cssText = [
    'position:fixed','top:80px','right:24px','z-index:9996',
    'width:300px',
    'background:linear-gradient(160deg,#1a1a2e 0%,#13131f 60%,#0f0f1a 100%)',
    'border:1px solid rgba(255,255,255,0.1)',
    'border-radius:18px','overflow:hidden',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.08)',
  ].join(';');

  p.innerHTML = `
    <!-- Top glow -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(124,58,237,0.8),rgba(255,45,85,0.8),transparent);z-index:1;"></div>

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;
      background:rgba(255,255,255,0.025);border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:1rem;">⭐</span>
      <span style="font-size:0.82rem;font-weight:700;color:#f0f0f0;flex:1;">Sistema de Créditos</span>
      <button class="_cpBtn" onclick="_toggleCreditPanel()" id="_cpColBtn">−</button>
    </div>

    <!-- Body -->
    <div id="_cpBody">

      <!-- Tabs -->
      <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.06);">
        <button id="_tabLB" onclick="_switchTab('lb')"
          style="flex:1;padding:9px;background:rgba(124,58,237,0.15);border:none;
          border-bottom:2px solid #7c3aed;color:#a78bfa;cursor:pointer;font-size:0.78rem;font-weight:700;">
          🏆 Ranking
        </button>
        <button id="_tabRules" onclick="_switchTab('rules')"
          style="flex:1;padding:9px;background:transparent;border:none;border-bottom:2px solid transparent;
          color:#555;cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.2s;">
          📋 Reglas
        </button>
        <button id="_tabAdmin" onclick="_switchTab('admin')"
          style="flex:1;padding:9px;background:transparent;border:none;border-bottom:2px solid transparent;
          color:#555;cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.2s;">
          ⚙️ Admin
        </button>
      </div>

      <!-- Leaderboard tab -->
      <div id="_tabContentLB" style="padding:10px 14px;">
        <div id="_lbList" style="display:flex;flex-direction:column;gap:3px;max-height:280px;overflow-y:auto;">
          <div style="color:#444;font-size:0.78rem;text-align:center;padding:20px 0;">Cargando ranking...</div>
        </div>
        <button class="_cpBtn" onclick="socket.emit('get-leaderboard')"
          style="width:100%;margin-top:10px;text-align:center;">🔄 Actualizar</button>
      </div>

      <!-- Rules tab -->
      <div id="_tabContentRules" style="display:none;padding:12px 14px;">
        <div style="font-size:0.68rem;font-weight:700;color:#555;text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:10px;">Cómo ganar créditos</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${CREDIT_RULES.map(r => {
            const isLoss = r.points.toString().startsWith('-');
            const color  = isLoss ? '#ef4444' : '#a78bfa';
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;
              background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
              <span style="font-size:1.1rem;">${r.icon}</span>
              <div style="flex:1;font-size:0.75rem;color:#aaa;">${r.action}</div>
              <div style="font-weight:700;color:${color};font-size:0.8rem;white-space:nowrap;">${r.points}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Admin tab -->
      <div id="_tabContentAdmin" style="display:none;padding:12px 14px;">
        <div style="font-size:0.68rem;font-weight:700;color:#555;text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:12px;">Dar créditos manualmente</div>

        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
          <input class="_cpInput" id="_adminUser" placeholder="@usuario" />
          <input class="_cpInput" id="_adminAmount" type="number" placeholder="Cantidad de créditos" min="1" />
          <input class="_cpInput" id="_adminReason" placeholder="Razón (opcional)" />
          <button class="_cpBtn" onclick="_giveCredits()"
            style="background:rgba(124,58,237,0.2);border-color:rgba(124,58,237,0.4);color:#a78bfa;">
            ⭐ Dar créditos
          </button>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
          <div style="font-size:0.68rem;font-weight:700;color:#555;text-transform:uppercase;
            letter-spacing:0.1em;margin-bottom:8px;">Peligro</div>
          <button class="_cpBtn" onclick="_resetCredits()"
            style="width:100%;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#ef4444;">
            🗑 Resetear todos los créditos
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(p);
  socket.emit('get-leaderboard');
}

/* ── Tab switching ── */
function _switchTab(tab) {
  ['lb','rules','admin'].forEach(t => {
    const content = document.getElementById(`_tabContent${t.charAt(0).toUpperCase()+t.slice(1)}`);
    const btn     = document.getElementById(`_tab${t.charAt(0).toUpperCase()+t.slice(1)}`);
    const active  = t === tab;
    if (content) content.style.display = active ? 'block' : 'none';
    if (btn) {
      btn.style.background   = active ? 'rgba(124,58,237,0.15)' : 'transparent';
      btn.style.borderBottom = active ? '2px solid #7c3aed' : '2px solid transparent';
      btn.style.color        = active ? '#a78bfa' : '#555';
    }
  });
}

/* ── Render leaderboard ── */
function _renderLeaderboard(data) {
  const list = document.getElementById('_lbList');
  if (!list) return;
  if (!data || !data.length) {
    list.innerHTML = '<div style="color:#444;font-size:0.78rem;text-align:center;padding:20px 0;">Sin jugadores aún</div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  list.innerHTML = data.map((u, i) => {
    const rank   = medals[i] || `#${i+1}`;
    const color  = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#555';
    const initial = (u.username||'?').charAt(0).toUpperCase();
    const barW   = data[0].credits > 0 ? Math.round(u.credits / data[0].credits * 100) : 0;
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 6px;
        border-radius:8px;transition:background 0.2s;cursor:default;"
        onmouseover="this.style.background='rgba(255,255,255,0.04)'"
        onmouseout="this.style.background='transparent'">
        <span style="font-size:0.9rem;min-width:24px;text-align:center;">${rank}</span>
        <div style="width:26px;height:26px;border-radius:50%;
          background:linear-gradient(135deg,#ff2d55,#7c3aed);
          display:flex;align-items:center;justify-content:center;
          font-size:0.68rem;font-weight:800;color:#fff;flex-shrink:0;">${initial}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.78rem;font-weight:700;color:#f0f0f0;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">@${escapeHtml(u.username)}</div>
          <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:3px;overflow:hidden;">
            <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,#7c3aed,#ff2d55);border-radius:2px;"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:0.82rem;font-weight:800;color:${color};">${u.credits}</div>
          <div style="font-size:0.62rem;color:#444;">créditos</div>
        </div>
      </div>`;
  }).join('');
}

/* ── Admin actions ── */
function _giveCredits() {
  const user   = document.getElementById('_adminUser')?.value.trim().replace('@','');
  const amount = parseInt(document.getElementById('_adminAmount')?.value);
  const reason = document.getElementById('_adminReason')?.value.trim() || 'Premio del streamer';
  if (!user || !amount || amount < 1) return showToast('Completa usuario y cantidad', 'error');
  socket.emit('add-credits', { user, amount, reason });
  showToast(`+${amount} créditos a @${user}`, 'success');
  document.getElementById('_adminUser').value = '';
  document.getElementById('_adminAmount').value = '';
  document.getElementById('_adminReason').value = '';
}

function _resetCredits() {
  if (!confirm('¿Resetear TODOS los créditos? Esta acción no se puede deshacer.')) return;
  socket.emit('reset-credits');
  showToast('Créditos reseteados', 'info');
}

/* ── Panel collapse ── */
let _cpCollapsed = false;
function _toggleCreditPanel() {
  _cpCollapsed = !_cpCollapsed;
  const body = document.getElementById('_cpBody');
  const btn  = document.getElementById('_cpColBtn');
  if (body) body.style.display = _cpCollapsed ? 'none' : 'block';
  if (btn)  btn.textContent    = _cpCollapsed ? '＋' : '−';
}

/* ── Socket events ── */
socket.on('leaderboard', _renderLeaderboard);

socket.on('credits-update', (data) => {
  _showCreditNotif(data.user, data.earned, data.reason);
  // Actualizar leaderboard cada 5 actualizaciones
  if (Math.random() < 0.2) socket.emit('get-leaderboard');
});

socket.on('credits-reset', () => {
  _renderLeaderboard([]);
  showToast('Créditos reseteados', 'info');
});

/* ── Init ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _buildCreditPanel);
} else {
  _buildCreditPanel();
}

/* ============================================================
   RANGOS, LOGROS Y TIENDA – Extensión del panel de créditos
   ============================================================ */

const RANKS_CLIENT = [
  { id: 'legend',  label: 'Leyenda',  emoji: '👑', min: 5000, color: '#e8c96a' },
  { id: 'diamond', label: 'Diamante', emoji: '💎', min: 2000, color: '#67e8f9' },
  { id: 'gold',    label: 'Oro',      emoji: '🥇', min: 500,  color: '#fbbf24' },
  { id: 'silver',  label: 'Plata',    emoji: '🥈', min: 100,  color: '#94a3b8' },
  { id: 'bronze',  label: 'Bronce',   emoji: '🥉', min: 0,    color: '#b45309' },
];

function _getRankClient(totalEarned) {
  return RANKS_CLIENT.find(r => totalEarned >= r.min) || RANKS_CLIENT[RANKS_CLIENT.length - 1];
}

/* ── Notificación de logro ── */
function _showAchievementNotif(user, achievements) {
  achievements.forEach((a, i) => {
    setTimeout(() => {
      let container = document.getElementById('_achieveNotifs');
      if (!container) {
        container = document.createElement('div');
        container.id = '_achieveNotifs';
        container.style.cssText = 'position:fixed;top:80px;left:24px;z-index:9997;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
        document.body.appendChild(container);
      }
      const el = document.createElement('div');
      el.style.cssText = `
        background:linear-gradient(135deg,rgba(201,168,76,0.95),rgba(108,1,2,0.95));
        border:1px solid rgba(201,168,76,0.5);
        border-radius:14px;padding:12px 18px;
        box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(201,168,76,0.3);
        animation:_cnIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        display:flex;align-items:center;gap:12px;min-width:240px;
      `;
      el.innerHTML = `
        <span style="font-size:2rem;">${a.emoji}</span>
        <div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em;">¡Logro desbloqueado!</div>
          <div style="font-weight:800;color:#fff;font-size:0.95rem;">@${escapeHtml(user)}</div>
          <div style="font-size:0.78rem;color:rgba(255,255,255,0.85);">${a.label} – ${a.desc}</div>
        </div>
      `;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0'; el.style.transform = 'translateX(-20px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => el.remove(), 320);
      }, 4000);
    }, i * 600);
  });
}

/* ── Actualizar leaderboard con rangos ── */
const _origRenderLB = _renderLeaderboard;
_renderLeaderboard = function(data) {
  const list = document.getElementById('_lbList');
  if (!list) return;
  if (!data || !data.length) {
    list.innerHTML = '<div style="color:var(--muted,#888);font-size:0.78rem;text-align:center;padding:20px 0;">Sin jugadores aún</div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  list.innerHTML = data.map((u, i) => {
    const rank      = medals[i] || `#${i+1}`;
    const rankInfo  = _getRankClient(u.totalEarned || u.credits || 0);
    const initial   = (u.username||'?').charAt(0).toUpperCase();
    const barW      = data[0].credits > 0 ? Math.round(u.credits / data[0].credits * 100) : 0;
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:8px;transition:background 0.2s;"
        onmouseover="this.style.background='rgba(255,255,255,0.04)'"
        onmouseout="this.style.background='transparent'">
        <span style="font-size:0.9rem;min-width:24px;text-align:center;">${rank}</span>
        <div style="width:26px;height:26px;border-radius:50%;
          background:linear-gradient(135deg,#e22227,#6c0102);
          display:flex;align-items:center;justify-content:center;
          font-size:0.68rem;font-weight:800;color:#fff;flex-shrink:0;">${initial}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="font-size:0.78rem;font-weight:700;color:#f0f0f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">@${escapeHtml(u.username)}</span>
            <span title="${rankInfo.label}" style="font-size:0.85rem;">${rankInfo.emoji}</span>
          </div>
          <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:3px;overflow:hidden;">
            <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,#e22227,#c9a84c);border-radius:2px;"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:0.82rem;font-weight:800;color:${rankInfo.color};">${u.credits}</div>
          <div style="font-size:0.62rem;color:#555;">créditos</div>
        </div>
      </div>`;
  }).join('');
};

/* ── Agregar pestaña de Tienda al panel ── */
function _addShopTab() {
  const panel = document.getElementById('_creditPanel');
  if (!panel || panel.querySelector('#_shopTab')) return;

  // Agregar botón de pestaña
  const tabsEl = panel.querySelector('[id^="tab"]')?.parentElement;
  if (tabsEl) {
    const shopBtn = document.createElement('button');
    shopBtn.id = '_shopTabBtn';
    shopBtn.style.cssText = 'flex:1;padding:9px;background:transparent;border:none;border-bottom:2px solid transparent;color:#555;cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.2s;';
    shopBtn.textContent = '🏪 Tienda';
    shopBtn.onclick = () => {
      _switchTab('shop', shopBtn);
      socket.emit('get-shop');
    };
    tabsEl.appendChild(shopBtn);
  }

  // Agregar contenido de tienda
  const body = panel.querySelector('#_cpBody');
  if (!body) return;
  const shopContent = document.createElement('div');
  shopContent.id = '_tabContentShop';
  shopContent.style.display = 'none';
  shopContent.style.padding = '12px 14px';
  shopContent.innerHTML = `
    <div style="font-size:0.68rem;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">
      🏪 Tienda de Créditos
    </div>
    <div id="_shopItemsList" style="display:flex;flex-direction:column;gap:8px;">
      <div style="color:#555;font-size:0.78rem;text-align:center;padding:16px 0;">Cargando tienda...</div>
    </div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:0.68rem;color:#555;margin-bottom:8px;">Comprar para usuario:</div>
      <div style="display:flex;gap:8px;">
        <input id="_shopUser" placeholder="@usuario" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#f0f0f0;padding:7px 10px;border-radius:8px;font-size:0.78rem;outline:none;">
      </div>
    </div>
  `;
  body.appendChild(shopContent);
}

/* ── Renderizar items de tienda ── */
socket.on('shop-items', (items) => {
  _addShopTab();
  const list = document.getElementById('_shopItemsList');
  if (!list || !items) return;
  list.innerHTML = items.map(item => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:10px;transition:border-color 0.2s;"
      onmouseover="this.style.borderColor='rgba(201,168,76,0.3)'"
      onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
      <span style="font-size:1.5rem;">${item.emoji}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.82rem;color:#f0f0f0;">${item.label}</div>
        <div style="font-size:0.72rem;color:#666;">${item.desc}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-weight:800;color:#c9a84c;font-size:0.85rem;">${item.price} ⭐</div>
        <button onclick="_buyItem('${item.id}')"
          style="margin-top:4px;background:linear-gradient(135deg,#e22227,#6c0102);border:none;
          color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.72rem;font-weight:700;">
          Comprar
        </button>
      </div>
    </div>
  `).join('');
});

function _buyItem(itemId) {
  const userInput = document.getElementById('_shopUser');
  const user = userInput ? userInput.value.trim().replace('@','') : '';
  if (!user) return showToast('Escribe el usuario primero', 'error');
  socket.emit('buy-item', { user, itemId });
}

socket.on('buy-result', (result) => {
  if (result.ok) {
    showToast(`✅ ${result.item.label} comprado para @${document.getElementById('_shopUser')?.value || ''}`, 'success');
    if (result.mystery) showToast(`📦 Caja misteriosa: +${result.mystery} créditos!`, 'success');
  } else {
    showToast(`❌ ${result.error}`, 'error');
  }
});

/* ── Escuchar logros ── */
socket.on('achievement', (data) => {
  _showAchievementNotif(data.user, data.achievements);
});

/* ── Inicializar tienda cuando el panel esté listo ── */
setTimeout(() => {
  _addShopTab();
  socket.emit('get-shop');
}, 1000);
