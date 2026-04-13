/* ============================================================
   StreamGames – Modo Caos 🌊
   Eventos aleatorios que sorprenden al chat
   ============================================================ */

const CHAOS_EVENTS = [
  {
    id: 'rain',
    name: '🌧️ Lluvia de Créditos',
    desc: 'Todos los usuarios activos reciben créditos aleatorios',
    color: '#c9a84c',
    action: () => {
      socket.emit('chaos-event', { type: 'rain' });
    }
  },
  {
    id: 'double',
    name: '✖️ Multiplicador x2',
    desc: 'Los créditos se duplican por 60 segundos',
    color: '#22c55e',
    action: () => {
      socket.emit('chaos-event', { type: 'double', duration: 60 });
    }
  },
  {
    id: 'mystery',
    name: '📦 Caja Misteriosa Global',
    desc: 'Un usuario aleatorio del chat gana un premio sorpresa',
    color: '#7c3aed',
    action: () => {
      socket.emit('chaos-event', { type: 'mystery' });
    }
  },
  {
    id: 'steal',
    name: '💀 Robo Masivo',
    desc: 'El usuario con más créditos pierde 50 y se reparten',
    color: '#e22227',
    action: () => {
      socket.emit('chaos-event', { type: 'steal' });
    }
  },
  {
    id: 'jackpot',
    name: '🎰 Jackpot',
    desc: 'Un usuario aleatorio gana 500 créditos',
    color: '#fbbf24',
    action: () => {
      socket.emit('chaos-event', { type: 'jackpot' });
    }
  },
  {
    id: 'freeze',
    name: '❄️ Congelado',
    desc: 'Nadie gana ni pierde créditos por 30 segundos',
    color: '#67e8f9',
    action: () => {
      socket.emit('chaos-event', { type: 'freeze', duration: 30 });
    }
  },
];

let _chaosTimer     = null;
let _chaosCountdown = 0;
let _chaosActive    = false;
let _chaosCooldown  = false;
const CHAOS_COOLDOWN = 5 * 60; // 5 minutos en segundos

/* ── CSS ── */
function _chaosCss() {
  if (document.getElementById('_chaosCss')) return;
  const s = document.createElement('style');
  s.id = '_chaosCss';
  s.textContent = `
    @keyframes _chaosIn {
      0%   { opacity:0; transform:scale(0.5) translateY(20px); }
      60%  { transform:scale(1.05) translateY(-5px); }
      100% { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes _chaosPulse {
      0%,100% { box-shadow: 0 0 20px rgba(226,34,39,0.4); }
      50%     { box-shadow: 0 0 40px rgba(226,34,39,0.8), 0 0 80px rgba(201,168,76,0.3); }
    }
    @keyframes _chaosCountdown {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
    #_chaosPanel { animation: _chaosPulse 2s ease infinite; }
    #_chaosBtn.ready { animation: _chaosPulse 1.5s ease infinite; }
  `;
  document.head.appendChild(s);
}

/* ── Panel de Modo Caos ── */
function _buildChaosPanel() {
  if (document.getElementById('_chaosPanel')) return;
  _chaosCss();

  const p = document.createElement('div');
  p.id = '_chaosPanel';
  p.style.cssText = [
    'position:fixed','top:80px','left:24px','z-index:9995',
    'width:260px',
    'background:linear-gradient(160deg,#1c0a0a 0%,#13131f 100%)',
    'border:1px solid rgba(226,34,39,0.3)',
    'border-radius:16px','overflow:hidden',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(226,34,39,0.1)',
  ].join(';');

  p.innerHTML = `
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,34,39,0.8),rgba(201,168,76,0.5),transparent);"></div>
    <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:rgba(226,34,39,0.06);border-bottom:1px solid rgba(226,34,39,0.15);cursor:grab;" id="_chaosHandle">
      <span style="font-size:1.1rem;">🌊</span>
      <span style="font-size:0.82rem;font-weight:800;color:#e22227;flex:1;letter-spacing:0.02em;">MODO CAOS</span>
      <span id="_chaosCdLabel" style="font-size:0.68rem;color:#555;background:rgba(255,255,255,0.05);padding:2px 7px;border-radius:10px;">Listo</span>
      <button onclick="document.getElementById('_chaosBody').style.display=document.getElementById('_chaosBody').style.display==='none'?'block':'none'"
        style="background:none;border:none;color:#555;cursor:pointer;font-size:0.9rem;">−</button>
    </div>
    <div id="_chaosBody">
      <div style="padding:12px 14px;">
        <button id="_chaosBtn" class="ready" onclick="_triggerRandomChaos()"
          style="width:100%;padding:14px;border-radius:12px;
          background:linear-gradient(135deg,#e22227,#6c0102);
          border:none;color:#fff;font-size:0.95rem;font-weight:800;
          cursor:pointer;letter-spacing:0.03em;
          box-shadow:0 4px 20px rgba(226,34,39,0.4);
          transition:all 0.2s;">
          🎲 ¡ACTIVAR CAOS!
        </button>
        <div id="_chaosCdBar" style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:8px;overflow:hidden;display:none;">
          <div id="_chaosCdFill" style="height:100%;background:linear-gradient(90deg,#e22227,#c9a84c);border-radius:2px;transform-origin:left;"></div>
        </div>
      </div>
      <div style="padding:0 14px 12px;">
        <div style="font-size:0.65rem;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Eventos disponibles</div>
        <div id="_chaosEventsList" style="display:flex;flex-direction:column;gap:5px;"></div>
      </div>
      <div id="_chaosLog" style="padding:8px 14px;border-top:1px solid rgba(255,255,255,0.05);max-height:100px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;"></div>
    </div>
  `;

  document.body.appendChild(p);

  // Renderizar eventos
  const list = document.getElementById('_chaosEventsList');
  CHAOS_EVENTS.forEach(ev => {
    const el = document.createElement('div');
    el.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 8px;
      background:rgba(255,255,255,0.03);border-radius:7px;font-size:0.72rem;
      border-left:2px solid ${ev.color};cursor:pointer;transition:background 0.2s;`;
    el.innerHTML = `<span style="flex:1;color:#d1d5db;">${ev.name}</span>
      <button onclick="_triggerChaos('${ev.id}')"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
        color:#888;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:0.68rem;font-weight:700;">
        ▶
      </button>`;
    el.onmouseover = () => el.style.background = 'rgba(255,255,255,0.06)';
    el.onmouseout  = () => el.style.background = 'rgba(255,255,255,0.03)';
    list.appendChild(el);
  });

  // Hacer arrastrable
  if (window.makeDraggable) makeDraggable(p, document.getElementById('_chaosHandle'));
}

function _triggerRandomChaos() {
  if (_chaosCooldown) return;
  const ev = CHAOS_EVENTS[Math.floor(Math.random() * CHAOS_EVENTS.length)];
  _triggerChaos(ev.id);
}

function _triggerChaos(id) {
  if (_chaosCooldown) { showToast('Modo Caos en cooldown', 'error'); return; }
  const ev = CHAOS_EVENTS.find(e => e.id === id);
  if (!ev) return;
  ev.action();
  _startCooldown();
  _logChaos(ev);
}

function _startCooldown() {
  _chaosCooldown = true;
  _chaosCountdown = CHAOS_COOLDOWN;
  const btn   = document.getElementById('_chaosBtn');
  const bar   = document.getElementById('_chaosCdBar');
  const fill  = document.getElementById('_chaosCdFill');
  const label = document.getElementById('_chaosCdLabel');
  if (btn)   { btn.disabled = true; btn.classList.remove('ready'); btn.style.opacity = '0.5'; }
  if (bar)   bar.style.display = 'block';
  if (fill)  { fill.style.transition = `transform ${CHAOS_COOLDOWN}s linear`; fill.style.transform = 'scaleX(0)'; }

  const interval = setInterval(() => {
    _chaosCountdown--;
    const mins = Math.floor(_chaosCountdown / 60);
    const secs = _chaosCountdown % 60;
    if (label) label.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
    if (_chaosCountdown <= 0) {
      clearInterval(interval);
      _chaosCooldown = false;
      if (btn)   { btn.disabled = false; btn.classList.add('ready'); btn.style.opacity = '1'; }
      if (bar)   bar.style.display = 'none';
      if (fill)  { fill.style.transition = 'none'; fill.style.transform = 'scaleX(1)'; }
      if (label) label.textContent = 'Listo';
      showToast('🌊 Modo Caos disponible!', 'success');
    }
  }, 1000);
}

function _logChaos(ev) {
  const log = document.getElementById('_chaosLog');
  if (!log) return;
  const el = document.createElement('div');
  el.style.cssText = `font-size:0.72rem;color:#888;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.04);`;
  el.innerHTML = `<span style="color:${ev.color};">${ev.name}</span> activado`;
  log.insertBefore(el, log.firstChild);
  while (log.children.length > 5) log.removeChild(log.lastChild);
}

/* ── Overlay de evento caos ── */
socket.on('chaos-result', (data) => {
  _showChaosOverlay(data);
});

function _showChaosOverlay(data) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99998;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
    animation:fadeIn 0.3s ease;
  `;
  overlay.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#1c0a0a,#13131f);
      border:2px solid rgba(226,34,39,0.6);
      border-radius:24px;padding:40px 52px;text-align:center;
      box-shadow:0 0 80px rgba(226,34,39,0.4),0 24px 64px rgba(0,0,0,0.8);
      animation:_chaosIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
      max-width:420px;width:90%;
    ">
      <div style="font-size:4rem;margin-bottom:12px;">${data.emoji || '🌊'}</div>
      <div style="font-size:1.8rem;font-weight:900;
        background:linear-gradient(135deg,#e22227,#c9a84c);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;margin-bottom:8px;">${data.title || 'MODO CAOS'}</div>
      <div style="color:#d1d5db;font-size:1rem;margin-bottom:16px;">${data.desc || ''}</div>
      ${data.winner ? `<div style="font-size:1.2rem;font-weight:800;color:#c9a84c;">🏆 @${data.winner}</div>` : ''}
      ${data.amount ? `<div style="font-size:1.5rem;font-weight:900;color:#22c55e;margin-top:8px;">+${data.amount} créditos</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.4s';
    setTimeout(() => overlay.remove(), 420);
  }, 3500);
}

/* ── Init ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _buildChaosPanel);
} else {
  _buildChaosPanel();
  setTimeout(_buildChaosPanel, 800);
}
