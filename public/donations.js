/* ============================================================
   StreamGames – Panel de Donaciones / Regalos
   Sonido, alertas visuales y configuración
   ============================================================ */

/* ── Estado ── */
const _don = {
  enabled:       true,
  soundEnabled:  true,
  alertEnabled:  true,
  volume:        0.8,
  minDiamonds:   0,       // mínimo de diamantes para activar alerta
  soundType:     'coins', // coins | bell | chime | custom
  alertDuration: 4,       // segundos que dura la alerta
  history:       [],
  totalDiamonds: 0,
  totalGifts:    0,
};

/* ── Sonidos generados con Web Audio API ── */
const _AC = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;

function _getAC() {
  if (!_audioCtx) _audioCtx = new _AC();
  return _audioCtx;
}

function _playSound(type, vol) {
  try {
    const ac  = _getAC();
    const gain = ac.createGain();
    gain.gain.value = vol ?? _don.volume;
    gain.connect(ac.destination);

    const plays = {
      coins: () => {
        // Monedas: notas ascendentes rápidas
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.connect(g); g.connect(gain);
          o.frequency.value = freq;
          o.type = 'sine';
          const t = ac.currentTime + i * 0.08;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.4, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.start(t); o.stop(t + 0.2);
        });
      },
      bell: () => {
        // Campana: tono largo con armónicos
        [880, 1760, 2640].forEach((freq, i) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.connect(g); g.connect(gain);
          o.frequency.value = freq;
          o.type = i === 0 ? 'sine' : 'sine';
          const t = ac.currentTime;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.3 / (i + 1), t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
          o.start(t); o.stop(t + 1.6);
        });
      },
      chime: () => {
        // Chime: acorde alegre
        [523, 659, 784, 1047, 1319].forEach((freq, i) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.connect(g); g.connect(gain);
          o.frequency.value = freq;
          o.type = 'sine';
          const t = ac.currentTime + i * 0.05;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.25, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          o.start(t); o.stop(t + 0.9);
        });
      },
      pop: () => {
        // Pop suave
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(gain);
        o.frequency.setValueAtTime(400, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.1);
        o.type = 'sine';
        g.gain.setValueAtTime(0.5, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
        o.start(); o.stop(ac.currentTime + 0.2);
      },
    };

    (plays[type] || plays.coins)();
  } catch(e) { console.warn('Audio error:', e); }
}

/* ── Alerta visual ── */
let _alertTimer = null;

function _showAlert(data) {
  if (!_don.alertEnabled) return;

  let overlay = document.getElementById('_donAlert');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '_donAlert';
    overlay.style.cssText = [
      'position:fixed','top:0','left:0','right:0','bottom:0',
      'z-index:99999','pointer-events:none',
      'display:flex','align-items:center','justify-content:center',
    ].join(';');
    document.body.appendChild(overlay);
  }

  const user     = escapeHtml(data.user || 'alguien');
  const gift     = escapeHtml(data.giftName || 'Regalo');
  const count    = data.repeatCount > 1 ? ` x${data.repeatCount}` : '';
  const diamonds = data.diamondCount > 0
    ? `<div style="color:#fbbf24;font-size:0.9rem;margin-top:4px;">💎 ${data.diamondCount * (data.repeatCount||1)} diamantes</div>`
    : '';

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#1c1c30,#13131f);
      border:2px solid rgba(251,191,36,0.6);
      border-radius:20px;
      padding:28px 40px;
      text-align:center;
      box-shadow:0 0 60px rgba(251,191,36,0.4),0 20px 60px rgba(0,0,0,0.8);
      animation:_donIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
      max-width:400px;
      width:90%;
    ">
      ${data.profilePicture
        ? `<img src="${data.profilePicture}" alt="" style="width:72px;height:72px;border-radius:50%;border:3px solid rgba(251,191,36,0.6);margin-bottom:12px;object-fit:cover;box-shadow:0 0 20px rgba(251,191,36,0.4);">`
        : `<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#ff2d55,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:900;color:#fff;margin:0 auto 12px;border:3px solid rgba(251,191,36,0.6);">${(data.user||'?').charAt(0).toUpperCase()}</div>`
      }
      <div style="font-size:3rem;margin-bottom:8px;animation:_donBounce 0.6s ease;">🎁</div>
      <div style="font-size:1.6rem;font-weight:900;
        background:linear-gradient(135deg,#fbbf24,#f59e0b);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;margin-bottom:6px;">${gift}${count}</div>
      <div style="color:#d1d5db;font-size:1rem;">
        <strong style="color:#f0f0f0;">${user}</strong> envió un regalo
      </div>
      ${diamonds}
    </div>
  `;

  if (_alertTimer) clearTimeout(_alertTimer);
  _alertTimer = setTimeout(() => {
    if (overlay) overlay.innerHTML = '';
  }, _don.alertDuration * 1000);
}

/* ── Recibir regalo ── */
function _handleGift(data) {
  if (!_don.enabled) return;
  const diamonds = (data.diamondCount || 0) * (data.repeatCount || 1);
  if (diamonds < _don.minDiamonds) return;

  _don.totalGifts++;
  _don.totalDiamonds += diamonds;
  _don.history.unshift({ ...data, time: Date.now() });
  if (_don.history.length > 50) _don.history.pop();

  if (_don.soundEnabled) _playSound(_don.soundType, _don.volume);
  _showAlert(data);
  _updateDonStats();
  _renderDonHistory();
}

function _updateDonStats() {
  const tg = document.getElementById('_donTotalGifts');
  const td = document.getElementById('_donTotalDiamonds');
  if (tg) tg.textContent = _don.totalGifts;
  if (td) td.textContent = _don.totalDiamonds;
}

function _renderDonHistory() {
  const list = document.getElementById('_donHistList');
  if (!list) return;
  if (_don.history.length === 0) {
    list.innerHTML = '<div style="color:#444;font-size:0.78rem;text-align:center;padding:16px 0;">Sin regalos aún</div>';
    return;
  }
  list.innerHTML = _don.history.slice(0, 15).map(d => {
    const mins = Math.floor((Date.now() - d.time) / 60000);
    const time = mins < 1 ? 'ahora' : mins + 'm';
    const diamonds = d.diamondCount > 0 ? `<span style="color:#fbbf24;font-size:0.7rem;">💎${d.diamondCount*(d.repeatCount||1)}</span>` : '';
    const count = d.repeatCount > 1 ? ` x${d.repeatCount}` : '';
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;
        border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.78rem;">
        ${d.profilePicture
          ? `<img src="${d.profilePicture}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
          : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#fff;flex-shrink:0;">${(d.user||'?').charAt(0).toUpperCase()}</div>`
        }
        <div style="flex:1;min-width:0;">
          <span style="font-weight:700;color:#fbbf24;">${escapeHtml(d.user||'anon')}</span>
          <span style="color:#888;"> → </span>
          <span style="color:#f0f0f0;">${escapeHtml(d.giftName||'Regalo')}${count}</span>
          ${diamonds}
        </div>
        <span style="color:#555;font-size:0.68rem;flex-shrink:0;">${time}</span>
      </div>`;
  }).join('');
}

/* ── CSS ── */
function _donCSS() {
  if (document.getElementById('_donCSS')) return;
  const s = document.createElement('style');
  s.id = '_donCSS';
  s.textContent = `
    @keyframes _donIn {
      from { opacity:0; transform:scale(0.6) translateY(20px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes _donBounce {
      0%,100% { transform:scale(1); }
      40%     { transform:scale(1.3); }
      70%     { transform:scale(0.9); }
    }
    @keyframes _donGlow {
      0%,100% { box-shadow:0 0 20px rgba(251,191,36,0.3),0 20px 60px rgba(0,0,0,0.7); }
      50%     { box-shadow:0 0 40px rgba(251,191,36,0.6),0 20px 60px rgba(0,0,0,0.7); }
    }
    #_donPanel { animation:_donGlow 3s ease infinite; }
    #_donPanel *{ box-sizing:border-box; font-family:'Segoe UI',system-ui,sans-serif; }
    #_donHistList::-webkit-scrollbar{ width:3px; }
    #_donHistList::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.1);border-radius:3px; }
    ._donRange { -webkit-appearance:none;appearance:none;height:3px;border-radius:2px;
      background:rgba(255,255,255,0.1);outline:none;cursor:pointer;width:100%; }
    ._donRange::-webkit-slider-thumb { -webkit-appearance:none;width:13px;height:13px;
      border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);cursor:pointer;
      box-shadow:0 0 6px rgba(251,191,36,0.5); }
    ._donBtn { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
      color:#888;cursor:pointer;padding:5px 8px;border-radius:8px;
      transition:all 0.2s;font-size:0.8rem;font-weight:600; }
    ._donBtn:hover { background:rgba(255,255,255,0.1);color:#f0f0f0; }
    ._donBtn.active { background:rgba(251,191,36,0.15);border-color:rgba(251,191,36,0.4);color:#fbbf24; }
    ._soundBtn { padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);
      background:rgba(255,255,255,0.04);color:#888;cursor:pointer;font-size:0.78rem;
      font-weight:600;transition:all 0.2s;text-align:center; }
    ._soundBtn:hover { border-color:rgba(251,191,36,0.4);color:#fbbf24; }
    ._soundBtn.active { background:rgba(251,191,36,0.15);border-color:rgba(251,191,36,0.5);
      color:#fbbf24;box-shadow:0 0 12px rgba(251,191,36,0.2); }
  `;
  document.head.appendChild(s);
}

/* ── Build panel ── */
function _buildDonPanel() {
  if (document.getElementById('_donPanel')) return;
  _donCSS();

  const p = document.createElement('div');
  p.id = '_donPanel';
  p.style.cssText = [
    'position:fixed','bottom:24px','right:24px','z-index:9998',
    'width:300px',
    'background:linear-gradient(160deg,#1e1a10 0%,#16130a 60%,#0f0d07 100%)',
    'border:1px solid rgba(251,191,36,0.25)',
    'border-radius:18px','overflow:hidden',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(251,191,36,0.06),inset 0 1px 0 rgba(251,191,36,0.1)',
  ].join(';');

  p.innerHTML = `
    <!-- Top glow border -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(251,191,36,0.8),rgba(245,158,11,0.8),transparent);z-index:1;"></div>

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:7px;padding:11px 14px;
      background:rgba(251,191,36,0.04);border-bottom:1px solid rgba(251,191,36,0.1);">
      <span style="font-size:1.1rem;">🎁</span>
      <span style="font-size:0.82rem;font-weight:700;color:#fde68a;flex:1;letter-spacing:0.01em;">Donaciones</span>

      <!-- Stats badges -->
      <span style="font-size:0.68rem;color:#888;background:rgba(255,255,255,0.06);
        padding:2px 7px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
        🎁 <span id="_donTotalGifts">0</span>
      </span>
      <span style="font-size:0.68rem;color:#fbbf24;background:rgba(251,191,36,0.1);
        padding:2px 7px;border-radius:10px;border:1px solid rgba(251,191,36,0.2);">
        💎 <span id="_donTotalDiamonds">0</span>
      </span>

      <!-- Toggle btn -->
      <button id="_donToggleBtn" class="_donBtn active" onclick="_toggleDonPanel()" style="padding:4px 8px;">−</button>
    </div>

    <!-- Body -->
    <div id="_donBody" style="display:none;">

      <!-- Quick controls -->
      <div style="display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(251,191,36,0.08);">
        <button id="_donEnableBtn" class="_donBtn active" onclick="_toggleDonEnabled()" style="flex:1;">
          ✅ Alertas ON
        </button>
        <button id="_donSoundBtn" class="_donBtn active" onclick="_toggleDonSound()" style="flex:1;">
          🔊 Sonido ON
        </button>
        <button class="_donBtn" onclick="_testDonation()" title="Probar alerta">▶ Test</button>
      </div>

      <!-- Sound selector -->
      <div style="padding:12px 14px;border-bottom:1px solid rgba(251,191,36,0.08);">
        <div style="font-size:0.68rem;font-weight:700;color:#666;text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:10px;">🎵 Tipo de sonido</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;" id="_soundBtns">
          <button class="_soundBtn active" data-sound="coins" onclick="_selectSound('coins',this)">🪙 Monedas</button>
          <button class="_soundBtn" data-sound="bell" onclick="_selectSound('bell',this)">🔔 Campana</button>
          <button class="_soundBtn" data-sound="chime" onclick="_selectSound('chime',this)">🎵 Chime</button>
          <button class="_soundBtn" data-sound="pop" onclick="_selectSound('pop',this)">💥 Pop</button>
        </div>

        <!-- Volume -->
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#666;margin-bottom:5px;">
            <span>Volumen</span>
            <span id="_donVolVal" style="color:#fbbf24;font-weight:600;">80%</span>
          </div>
          <input type="range" class="_donRange" id="_donVol" min="0" max="1" step="0.05" value="0.8"
            oninput="_don.volume=parseFloat(this.value);document.getElementById('_donVolVal').textContent=Math.round(this.value*100)+'%'">
        </div>
      </div>

      <!-- Alert settings -->
      <div style="padding:12px 14px;border-bottom:1px solid rgba(251,191,36,0.08);">
        <div style="font-size:0.68rem;font-weight:700;color:#666;text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:10px;">⚙️ Configuración de alerta</div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:0.75rem;color:#888;">Duración (segundos)</span>
          <input type="number" id="_donDuration" value="4" min="1" max="15"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
            color:#f0f0f0;padding:4px 8px;border-radius:7px;font-size:0.78rem;outline:none;width:60px;text-align:center;"
            oninput="_don.alertDuration=parseInt(this.value)||4">
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.75rem;color:#888;">Mín. diamantes para alerta</span>
          <input type="number" id="_donMinDiamonds" value="0" min="0" max="10000"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
            color:#f0f0f0;padding:4px 8px;border-radius:7px;font-size:0.78rem;outline:none;width:70px;text-align:center;"
            oninput="_don.minDiamonds=parseInt(this.value)||0">
        </div>
      </div>

      <!-- History -->
      <div style="padding:10px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:0.68rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.1em;">📜 Historial</span>
          <button class="_donBtn" onclick="_don.history=[];_don.totalGifts=0;_don.totalDiamonds=0;_updateDonStats();_renderDonHistory();"
            style="font-size:0.7rem;padding:3px 8px;">Limpiar</button>
        </div>
        <div id="_donHistList" style="max-height:180px;overflow-y:auto;">
          <div style="color:#444;font-size:0.78rem;text-align:center;padding:16px 0;">Sin regalos aún</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(p);
}

/* ── Panel controls ── */
let _donPanelCollapsed = true;
function _toggleDonPanel() {
  _donPanelCollapsed = !_donPanelCollapsed;
  const body = document.getElementById('_donBody');
  const btn  = document.getElementById('_donToggleBtn');
  if (body) body.style.display = _donPanelCollapsed ? 'none' : 'block';
  if (btn)  btn.textContent    = _donPanelCollapsed ? '＋' : '−';
}

function _toggleDonEnabled() {
  _don.alertEnabled = !_don.alertEnabled;
  const btn = document.getElementById('_donEnableBtn');
  if (btn) {
    btn.textContent = _don.alertEnabled ? '✅ Alertas ON' : '❌ Alertas OFF';
    btn.classList.toggle('active', _don.alertEnabled);
  }
}

function _toggleDonSound() {
  _don.soundEnabled = !_don.soundEnabled;
  const btn = document.getElementById('_donSoundBtn');
  if (btn) {
    btn.textContent = _don.soundEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF';
    btn.classList.toggle('active', _don.soundEnabled);
  }
}

function _selectSound(type, el) {
  _don.soundType = type;
  document.querySelectorAll('._soundBtn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _playSound(type, _don.volume);
}

function _testDonation() {
  _handleGift({
    user: 'fan123',
    giftName: 'Rosa',
    repeatCount: 5,
    diamondCount: 10,
  });
}

/* ── Socket ── */
socket.on('gift', _handleGift);

/* ── Init ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _buildDonPanel);
} else {
  _buildDonPanel();
}
