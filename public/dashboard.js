/* ============================================================
   StreamGames – Dashboard en tiempo real 📊
   Estadísticas del stream
   ============================================================ */

const _dash = {
  msgs:         0,
  likes:        0,
  follows:      0,
  gifts:        0,
  activeUsers:  new Map(),   // user -> lastSeen timestamp
  msgHistory:   [],          // { t, count } por minuto
  peakMsgs:     0,
  peakMinute:   0,
  startTime:    Date.now(),
  topUsers:     {},          // user -> msgCount
  currentMinuteMsgs: 0,
  lastMinute:   Math.floor(Date.now() / 60000),
};

/* ── Actualizar datos ── */
socket.on('chat-message', (data) => {
  _dash.msgs++;
  _dash.currentMinuteMsgs++;
  const user = data.user || 'anon';
  _dash.activeUsers.set(user, Date.now());
  _dash.topUsers[user] = (_dash.topUsers[user] || 0) + 1;
  _dashUpdate();
});

socket.on('like',   (d) => { _dash.likes += (d.likeCount || 1); _dashUpdate(); });
socket.on('follow', ()  => { _dash.follows++; _dashUpdate(); });
socket.on('gift',   ()  => { _dash.gifts++;   _dashUpdate(); });

// Actualizar historial por minuto
setInterval(() => {
  const now = Math.floor(Date.now() / 60000);
  if (now !== _dash.lastMinute) {
    _dash.msgHistory.push({ t: _dash.lastMinute, count: _dash.currentMinuteMsgs });
    if (_dash.currentMinuteMsgs > _dash.peakMsgs) {
      _dash.peakMsgs = _dash.currentMinuteMsgs;
    }
    if (_dash.msgHistory.length > 30) _dash.msgHistory.shift();
    _dash.currentMinuteMsgs = 0;
    _dash.lastMinute = now;
  }
  // Limpiar usuarios inactivos (más de 5 min)
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [user, ts] of _dash.activeUsers) {
    if (ts < cutoff) _dash.activeUsers.delete(user);
  }
  _dashUpdate();
}, 10000);

function _dashUpdate() {
  const el = (id) => document.getElementById(id);
  if (!el('_dashMsgs')) return;

  el('_dashMsgs').textContent    = _dash.msgs;
  el('_dashLikes').textContent   = _dash.likes;
  el('_dashFollows').textContent = _dash.follows;
  el('_dashGifts').textContent   = _dash.gifts;
  el('_dashActive').textContent  = _dash.activeUsers.size;
  el('_dashPeak').textContent    = _dash.peakMsgs + '/min';

  const elapsed = Math.floor((Date.now() - _dash.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  if (el('_dashTime')) el('_dashTime').textContent = `${mins}:${secs.toString().padStart(2,'0')}`;

  // Top 5 usuarios
  const topList = el('_dashTopList');
  if (topList) {
    const sorted = Object.entries(_dash.topUsers)
      .sort((a,b) => b[1]-a[1]).slice(0,5);
    if (sorted.length === 0) {
      topList.innerHTML = '<div style="color:#555;font-size:0.75rem;text-align:center;padding:8px 0;">Sin datos aún</div>';
    } else {
      topList.innerHTML = sorted.map(([user, count], i) => {
        const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
        const pct = sorted[0][1] > 0 ? Math.round(count / sorted[0][1] * 100) : 0;
        return `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:0.75rem;">
          <span>${medals[i]}</span>
          <span style="flex:1;color:#d1d5db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">@${escapeHtml(user)}</span>
          <div style="width:50px;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#e22227,#c9a84c);border-radius:2px;"></div>
          </div>
          <span style="color:#c9a84c;font-weight:700;min-width:20px;text-align:right;">${count}</span>
        </div>`;
      }).join('');
    }
  }

  // Mini gráfica de actividad
  _drawMiniChart();
}

function _drawMiniChart() {
  const canvas = document.getElementById('_dashChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const data = [..._dash.msgHistory, { t: _dash.lastMinute, count: _dash.currentMinuteMsgs }];
  if (data.length < 2) return;

  const max = Math.max(...data.map(d => d.count), 1);
  const step = w / (data.length - 1);

  // Gradiente de fondo
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(226,34,39,0.3)');
  grad.addColorStop(1, 'rgba(226,34,39,0)');

  ctx.beginPath();
  data.forEach((d, i) => {
    const x = i * step;
    const y = h - (d.count / max) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  // Cerrar para el relleno
  ctx.lineTo((data.length - 1) * step, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Línea
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = i * step;
    const y = h - (d.count / max) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#e22227';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ── Construir panel ── */
function _buildDashboard() {
  if (document.getElementById('_dashPanel')) return;

  const p = document.createElement('div');
  p.id = '_dashPanel';
  p.style.cssText = [
    'position:fixed','bottom:24px','left:24px','z-index:9994',
    'width:260px',
    'background:linear-gradient(160deg,#1a1a2e 0%,#13131f 100%)',
    'border:1px solid rgba(201,168,76,0.15)',
    'border-radius:16px','overflow:hidden',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(201,168,76,0.06)',
  ].join(';');

  p.innerHTML = `
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent);"></div>
    <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:rgba(255,255,255,0.025);border-bottom:1px solid rgba(255,255,255,0.06);cursor:grab;" id="_dashHandle">
      <span style="font-size:1rem;">📊</span>
      <span style="font-size:0.82rem;font-weight:700;color:#c9a84c;flex:1;">Dashboard</span>
      <span id="_dashTime" style="font-size:0.68rem;color:#555;background:rgba(255,255,255,0.05);padding:2px 7px;border-radius:10px;">0:00</span>
      <button onclick="document.getElementById('_dashBody').style.display=document.getElementById('_dashBody').style.display==='none'?'block':'none'"
        style="background:none;border:none;color:#555;cursor:pointer;font-size:0.9rem;">−</button>
    </div>
    <div id="_dashBody">
      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);">
        ${[
          { id:'_dashMsgs',    label:'Mensajes', emoji:'💬' },
          { id:'_dashActive',  label:'Activos',  emoji:'👥' },
          { id:'_dashLikes',   label:'Likes',    emoji:'❤️' },
          { id:'_dashFollows', label:'Follows',  emoji:'➕' },
          { id:'_dashGifts',   label:'Regalos',  emoji:'🎁' },
          { id:'_dashPeak',    label:'Pico',     emoji:'📈' },
        ].map(s => `
          <div style="padding:10px 12px;background:rgba(26,26,46,0.8);text-align:center;">
            <div style="font-size:0.7rem;">${s.emoji}</div>
            <div id="${s.id}" style="font-size:1rem;font-weight:800;color:#f0f0f0;margin:2px 0;">0</div>
            <div style="font-size:0.6rem;color:#555;text-transform:uppercase;letter-spacing:0.06em;">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Mini chart -->
      <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:0.65rem;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Actividad (últimos 30 min)</div>
        <canvas id="_dashChart" width="232" height="48" style="width:100%;height:48px;border-radius:6px;background:rgba(0,0,0,0.2);"></canvas>
      </div>

      <!-- Top usuarios -->
      <div style="padding:10px 14px;">
        <div style="font-size:0.65rem;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Top participantes</div>
        <div id="_dashTopList">
          <div style="color:#555;font-size:0.75rem;text-align:center;padding:8px 0;">Sin datos aún</div>
        </div>
      </div>

      <!-- Reset -->
      <div style="padding:0 14px 12px;">
        <button onclick="_resetDash()"
          style="width:100%;padding:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
          color:#555;border-radius:8px;cursor:pointer;font-size:0.72rem;font-weight:600;">
          ↺ Resetear estadísticas
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(p);
  if (window.makeDraggable) makeDraggable(p, document.getElementById('_dashHandle'));
  _dashUpdate();
}

function _resetDash() {
  _dash.msgs = 0; _dash.likes = 0; _dash.follows = 0; _dash.gifts = 0;
  _dash.activeUsers.clear(); _dash.msgHistory = []; _dash.peakMsgs = 0;
  _dash.topUsers = {}; _dash.currentMinuteMsgs = 0; _dash.startTime = Date.now();
  _dashUpdate();
  showToast('Dashboard reseteado', 'info');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _buildDashboard);
} else {
  _buildDashboard();
  setTimeout(_buildDashboard, 800);
}
