/* ============================================================
   StreamGames â€“ Chat Panel 3D + TTS (All Games)
   ============================================================ */

let _ttsEnabled  = false;
let _ttsVoices   = [];
let _ttsQueue    = [];
let _ttsSpeaking = false;
let _msgCount    = 0;
let _likeCount   = 0;
let _followCount = 0;
let _collapsed   = false;

/* â”€â”€ Voices â”€â”€ */
function _loadVoices() {
  _ttsVoices = window.speechSynthesis.getVoices();
  const sel = document.getElementById('_vSel');
  if (!sel || sel.options.length > 0) return;
  _ttsVoices.forEach((v, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(o);
  });
  const es = _ttsVoices.findIndex(v => v.lang.startsWith('es'));
  if (es >= 0) sel.value = es;
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = _loadVoices;
  [300, 800, 1500].forEach(t => setTimeout(_loadVoices, t));
}

/* â”€â”€ TTS â”€â”€ */
function toggleGameTTS() {
  _ttsEnabled = !_ttsEnabled;
  _updateTTSBtn();
  if (!_ttsEnabled) { window.speechSynthesis.cancel(); _ttsQueue = []; _ttsSpeaking = false; }
  showToast(_ttsEnabled ? 'ðŸ”Š Voz activada' : 'ðŸ”‡ Voz desactivada', 'info');
}

function _updateTTSBtn() {
  const btn = document.getElementById('_ttsBtn');
  if (!btn) return;
  btn.innerHTML = _ttsEnabled
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  btn.style.color      = _ttsEnabled ? '#22c55e' : '#555';
  btn.style.background = _ttsEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)';
  btn.style.boxShadow  = _ttsEnabled ? '0 0 12px rgba(34,197,94,0.3)' : 'none';
}

function _speak(user, text) {
  if (!_ttsEnabled || !window.speechSynthesis || !text) return;
  if (text.trim().startsWith('!')) return;
  const max = parseInt(document.getElementById('_ttsMax')?.value || 100);
  let msg = text.length > max ? text.slice(0, max) + 'â€¦' : text;
  if (document.getElementById('_ttsUser')?.checked) msg = `${user} dice: ${msg}`;
  _ttsQueue.push(msg);
  _runQueue();
}

function _runQueue() {
  if (_ttsSpeaking || !_ttsQueue.length || !_ttsEnabled) return;
  _ttsSpeaking = true;
  const u = new SpeechSynthesisUtterance(_ttsQueue.shift());
  const i = parseInt(document.getElementById('_vSel')?.value ?? -1);
  if (_ttsVoices[i]) u.voice = _ttsVoices[i];
  u.rate   = parseFloat(document.getElementById('_ttsRate')?.value ?? 1.2);
  u.volume = parseFloat(document.getElementById('_ttsVol')?.value ?? 1);
  u.onend = u.onerror = () => { _ttsSpeaking = false; _runQueue(); };
  window.speechSynthesis.speak(u);
}

/* â”€â”€ Add message â”€â”€ */
const _COLORS = ['#ff2d55','#7c3aed','#f59e0b','#22c55e','#3b82f6','#ec4899','#14b8a6','#f97316'];
function _addMsg(data, isFollow) {
  const feed = document.getElementById('_feed');
  if (!feed) return;
  feed.querySelector('._ph')?.remove();

  const user  = escapeHtml(data.user || 'anon');
  const text  = escapeHtml(data.comment || (isFollow ? 'â¤ï¸ siguiÃ³ el perfil' : ''));
  const init  = user.charAt(0).toUpperCase();
  const color = _COLORS[user.charCodeAt(0) % _COLORS.length];

  const el = document.createElement('div');
  el.style.cssText = `display:flex;gap:8px;align-items:flex-start;padding:6px 0;
    border-bottom:1px solid rgba(255,255,255,0.04);animation:_fu 0.2s ease;`;
  el.innerHTML = isFollow
    ? `<div style="width:100%;padding:4px 8px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);
        border-radius:6px;font-size:0.75rem;color:#22c55e;">â¤ï¸ <strong>${user}</strong> te siguiÃ³</div>`
    : `<div style="width:26px;height:26px;border-radius:50%;background:${color};display:flex;align-items:center;
        justify-content:center;font-size:0.68rem;font-weight:800;color:#fff;flex-shrink:0;margin-top:1px;
        box-shadow:0 2px 8px ${color}66;">${init}</div>
       <div style="flex:1;min-width:0;font-size:0.8rem;line-height:1.45;word-break:break-word;">
         <span style="font-weight:700;color:${color};margin-right:4px;">${user}</span>
         <span style="color:#c9d1d9;">${text}</span>
       </div>`;
  feed.appendChild(el);
  while (feed.children.length > 100) feed.removeChild(feed.firstChild);
  feed.scrollTop = feed.scrollHeight;
}

/* â”€â”€ Stats â”€â”€ */
function _updateStats() {
  const m = document.getElementById('_sM');
  const l = document.getElementById('_sL');
  const f = document.getElementById('_sF');
  const c = document.getElementById('_cnt');
  if (m) m.textContent = _msgCount   > 9999 ? '9k+' : _msgCount;
  if (l) l.textContent = _likeCount  > 9999 ? '9k+' : _likeCount;
  if (f) f.textContent = _followCount > 999  ? '999+': _followCount;
  if (c) c.textContent = _msgCount   > 999  ? '999+': _msgCount;
}

/* â”€â”€ Socket â”€â”€ */
socket.on('chat-message', (data) => {
  _msgCount++;
  _addMsg(data, false);
  _speak(data.user || 'anon', data.comment || '');
  _updateStats();
});
socket.on('like', (data) => {
  _likeCount += (data.likeCount || 1);
  _updateStats();
});
socket.on('follow', (data) => {
  _followCount++;
  _addMsg(data, true);
  _updateStats();
});

/* â”€â”€ Panel toggle â”€â”€ */
function _toggleCollapse() {
  _collapsed = !_collapsed;
  const body = document.getElementById('_body');
  const btn  = document.getElementById('_colBtn');
  if (body) {
    body.style.maxHeight = _collapsed ? '0' : '420px';
    body.style.opacity   = _collapsed ? '0' : '1';
  }
  if (btn) btn.textContent = _collapsed ? 'ï¼‹' : 'âˆ’';
}

function _toggleSettings() {
  const s = document.getElementById('_cfg');
  if (!s) return;
  const open = s.style.maxHeight !== '0px' && s.style.maxHeight !== '';
  s.style.maxHeight = open ? '0' : '300px';
  s.style.opacity   = open ? '0' : '1';
  if (!open) _loadVoices();
}

/* â”€â”€ CSS â”€â”€ */
function _css() {
  if (document.getElementById('_panelCSS')) return;
  const s = document.createElement('style');
  s.id = '_panelCSS';
  s.textContent = `
    @keyframes _fu { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes _glow { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3),0 20px 60px rgba(0,0,0,0.7)}
                       50%{box-shadow:0 0 30px rgba(255,45,85,0.3),0 20px 60px rgba(0,0,0,0.7)} }
    #_panel { animation: _glow 4s ease infinite; }
    #_panel *{ box-sizing:border-box; font-family:'Segoe UI',system-ui,sans-serif; }
    #_feed::-webkit-scrollbar{ width:3px }
    #_feed::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.1);border-radius:3px }
    ._pBtn { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
      color:#555;cursor:pointer;padding:5px 7px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;line-height:1; }
    ._pBtn:hover { background:rgba(255,255,255,0.1);color:#f0f0f0; }
    ._range { -webkit-appearance:none;appearance:none;height:3px;border-radius:2px;
      background:rgba(255,255,255,0.1);outline:none;cursor:pointer;width:100%; }
    ._range::-webkit-slider-thumb { -webkit-appearance:none;width:13px;height:13px;
      border-radius:50%;background:linear-gradient(135deg,#ff2d55,#7c3aed);cursor:pointer;
      box-shadow:0 0 6px rgba(124,58,237,0.5); }
    ._sel { background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      color:#f0f0f0;padding:5px 8px;border-radius:8px;font-size:0.75rem;
      outline:none;width:100%;transition:border-color 0.2s; }
    ._sel:focus { border-color:#7c3aed; }
    ._cfg { overflow:hidden;transition:max-height 0.3s ease,opacity 0.3s ease; }
    #_body { overflow:hidden;transition:max-height 0.35s ease,opacity 0.3s ease; }
  `;
  document.head.appendChild(s);
}

/* â”€â”€ Build panel â”€â”€ */
function _build() {
  if (document.getElementById('_panel')) return;
  _css();

  const p = document.createElement('div');
  p.id = '_panel';
  p.style.cssText = [
    'position:fixed','bottom:24px','left:24px','z-index:9999',
    'width:300px',
    'background:linear-gradient(160deg,#1c1c30 0%,#13131f 60%,#0f0f1a 100%)',
    'border:1px solid rgba(255,255,255,0.1)',
    'border-radius:18px',
    'overflow:hidden',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.08)',
    'transform-style:preserve-3d',
    'perspective:1000px',
  ].join(';');

  p.innerHTML = `
    <!-- Glow top border -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(124,58,237,0.8),rgba(255,45,85,0.8),transparent);
      z-index:1;"></div>

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:7px;padding:11px 14px;
      background:rgba(255,255,255,0.025);border-bottom:1px solid rgba(255,255,255,0.06);position:relative;">

      <!-- Live dot -->
      <div style="position:relative;width:8px;height:8px;flex-shrink:0;">
        <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;
          box-shadow:0 0 8px #22c55e;"></div>
        <div style="position:absolute;inset:-3px;border-radius:50%;background:rgba(34,197,94,0.2);
          animation:_fu 1.5s ease infinite;"></div>
      </div>

      <span style="font-size:0.82rem;font-weight:700;color:#f0f0f0;flex:1;letter-spacing:0.01em;">
        ðŸ’¬ Chat en vivo
      </span>

      <!-- Msg counter badge -->
      <span id="_cnt" style="font-size:0.68rem;color:#888;background:rgba(255,255,255,0.07);
        padding:2px 8px;border-radius:10px;font-weight:600;border:1px solid rgba(255,255,255,0.06);">0</span>

      <!-- TTS btn -->
      <button id="_ttsBtn" class="_pBtn" onclick="toggleGameTTS()" title="Activar/desactivar voz">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      </button>

      <!-- Settings btn -->
      <button class="_pBtn" onclick="_toggleSettings()" title="Configurar voz">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      <!-- Collapse btn -->
      <button id="_colBtn" class="_pBtn" onclick="_toggleCollapse()" style="font-size:0.9rem;font-weight:700;">âˆ’</button>
    </div>

    <!-- Body -->
    <div id="_body" style="max-height:420px;opacity:1;">

      <!-- TTS Settings -->
      <div id="_cfg" class="_cfg" style="max-height:0;opacity:0;">
        <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);
          background:rgba(0,0,0,0.35);">
          <div style="font-size:0.68rem;font-weight:700;color:#555;text-transform:uppercase;
            letter-spacing:0.1em;margin-bottom:10px;">âš™ï¸ ConfiguraciÃ³n de voz</div>

          <div style="margin-bottom:10px;">
            <div style="font-size:0.72rem;color:#666;margin-bottom:5px;">Voz</div>
            <select id="_vSel" class="_sel"></select>
          </div>

          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#666;margin-bottom:5px;">
              <span>Velocidad</span><span id="_rV" style="color:#a78bfa;font-weight:600;">1.2x</span>
            </div>
            <input type="range" id="_ttsRate" class="_range" min="0.5" max="2.5" step="0.1" value="1.2"
              oninput="document.getElementById('_rV').textContent=parseFloat(this.value).toFixed(1)+'x'">
          </div>

          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#666;margin-bottom:5px;">
              <span>Volumen</span><span id="_vV" style="color:#a78bfa;font-weight:600;">100%</span>
            </div>
            <input type="range" id="_ttsVol" class="_range" min="0" max="1" step="0.05" value="1"
              oninput="document.getElementById('_vV').textContent=Math.round(this.value*100)+'%'">
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:0.72rem;color:#666;">Leer nombre</span>
            <input type="checkbox" id="_ttsUser" checked style="accent-color:#7c3aed;width:14px;height:14px;cursor:pointer;">
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-size:0.72rem;color:#666;margin-bottom:5px;">MÃ¡x. caracteres</div>
            <input type="number" id="_ttsMax" value="100" min="20" max="300"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
              color:#f0f0f0;padding:5px 8px;border-radius:7px;font-size:0.75rem;outline:none;width:80px;">
          </div>

          <button onclick="(()=>{var s=_ttsEnabled;_ttsEnabled=true;_speak('StreamGames','Hola, esta es la voz que leerÃ¡ tu chat en vivo.');_ttsEnabled=s;})()"
            style="width:100%;padding:7px;background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(255,45,85,0.15));
            border:1px solid rgba(124,58,237,0.4);color:#a78bfa;border-radius:9px;cursor:pointer;
            font-size:0.78rem;font-weight:600;transition:all 0.2s;">
            â–¶ Probar voz
          </button>
        </div>
      </div>

      <!-- Feed -->
      <div id="_feed" style="height:230px;overflow-y:auto;padding:8px 14px;">
        <div class="_ph" style="display:flex;flex-direction:column;align-items:center;
          justify-content:center;height:100%;gap:10px;color:#333;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span style="font-size:0.78rem;color:#444;">Esperando mensajes...</span>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="display:flex;justify-content:space-around;padding:9px 14px;
        border-top:1px solid rgba(255,255,255,0.05);
        background:linear-gradient(0deg,rgba(0,0,0,0.3),transparent);">
        <div style="text-align:center;">
          <div id="_sM" style="font-size:0.9rem;font-weight:800;
            background:linear-gradient(135deg,#ff2d55,#7c3aed);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">0</div>
          <div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px;">Msgs</div>
        </div>
        <div style="width:1px;background:rgba(255,255,255,0.06);"></div>
        <div style="text-align:center;">
          <div id="_sL" style="font-size:0.9rem;font-weight:800;color:#f0f0f0;">0</div>
          <div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px;">Likes</div>
        </div>
        <div style="width:1px;background:rgba(255,255,255,0.06);"></div>
        <div style="text-align:center;">
          <div id="_sF" style="font-size:0.9rem;font-weight:800;color:#f0f0f0;">0</div>
          <div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px;">Follows</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(p);
  _loadVoices();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _build);
} else {
  _build();
}

