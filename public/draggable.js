/* ============================================================
   StreamGames – Draggable Panels v2
   Paneles arrastrables que nunca se salen de la pantalla
   ============================================================ */

// IDs de paneles y sus posiciones por defecto
const PANEL_DEFAULTS = {
  'chatPanel':    { right: 24, bottom: 24 },
  '_chatPanel':   { left:  24, bottom: 24 },
  '_creditPanel': { right: 24, top:    80 },
  '_donPanel':    { right: 24, bottom: 24 },
};

const _draggableInited = new Set();

function _drag(panel) {
  if (!panel || _draggableInited.has(panel.id)) return;
  _draggableInited.add(panel.id);

  // El handle es el primer div hijo (header)
  const handle = panel.firstElementChild;
  if (!handle) return;

  handle.style.cursor = 'grab';

  let ox = 0, oy = 0, dragging = false;

  function getPos() {
    const r = panel.getBoundingClientRect();
    return { left: r.left, top: r.top };
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function applyPos(left, top) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panel.offsetWidth  || 300;
    const ph = panel.offsetHeight || 100;
    const l  = clamp(left, 0, vw - pw);
    const t  = clamp(top,  0, vh - ph);
    panel.style.left   = l + 'px';
    panel.style.top    = t + 'px';
    panel.style.right  = 'auto';
    panel.style.bottom = 'auto';
    panel.style.position = 'fixed';
  }

  function start(cx, cy) {
    const pos = getPos();
    ox = cx - pos.left;
    oy = cy - pos.top;
    dragging = true;
    handle.style.cursor = 'grabbing';
    panel.style.transition = 'none';
    panel.style.zIndex = '10001';
  }

  function moveTo(cx, cy) {
    if (!dragging) return;
    applyPos(cx - ox, cy - oy);
  }

  function end() {
    if (!dragging) return;
    dragging = false;
    handle.style.cursor = 'grab';
    panel.style.transition = '';
    // Guardar posición
    if (panel.id) {
      localStorage.setItem('sg-panel-' + panel.id, JSON.stringify({
        left: panel.style.left, top: panel.style.top
      }));
    }
  }

  // Mouse
  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('button,input,select,a')) return;
    e.preventDefault();
    start(e.clientX, e.clientY);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  function onMove(e) { moveTo(e.clientX, e.clientY); }
  function onUp()    { end(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }

  // Touch
  handle.addEventListener('touchstart', (e) => {
    if (e.target.closest('button,input,select,a')) return;
    const t = e.touches[0];
    start(t.clientX, t.clientY);
    document.addEventListener('touchmove', onTMove, { passive: false });
    document.addEventListener('touchend',  onTUp);
  }, { passive: true });

  function onTMove(e) { e.preventDefault(); const t = e.touches[0]; moveTo(t.clientX, t.clientY); }
  function onTUp()    { end(); document.removeEventListener('touchmove', onTMove); document.removeEventListener('touchend', onTUp); }
}

function _restoreOrDefault(panel) {
  if (!panel) return;
  const id = panel.id;

  // Intentar restaurar posición guardada
  try {
    const saved = localStorage.getItem('sg-panel-' + id);
    if (saved) {
      const pos = JSON.parse(saved);
      const left = parseInt(pos.left) || 0;
      const top  = parseInt(pos.top)  || 0;
      const vw   = window.innerWidth;
      const vh   = window.innerHeight;
      // Validar que esté dentro de la pantalla
      if (left >= 0 && top >= 0 && left < vw - 50 && top < vh - 50) {
        panel.style.left   = Math.min(left, vw - (panel.offsetWidth  || 300)) + 'px';
        panel.style.top    = Math.min(top,  vh - (panel.offsetHeight || 100)) + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
        panel.style.position = 'fixed';
        return;
      }
    }
  } catch (_) {}

  // Limpiar posición guardada inválida
  localStorage.removeItem('sg-panel-' + id);
}

function _initAll() {
  Object.keys(PANEL_DEFAULTS).forEach(id => {
    const panel = document.getElementById(id);
    if (!panel) return;
    _restoreOrDefault(panel);
    _drag(panel);
  });
}

// Observar creación dinámica de paneles
new MutationObserver(_initAll).observe(document.body, { childList: true });

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initAll);
} else {
  _initAll();
  setTimeout(_initAll, 400);
  setTimeout(_initAll, 1200);
}

// Reset de emergencia
window.resetPanels = function() {
  Object.keys(PANEL_DEFAULTS).forEach(id => {
    localStorage.removeItem('sg-panel-' + id);
    const el = document.getElementById(id);
    if (!el) return;
    const def = PANEL_DEFAULTS[id];
    el.style.left   = def.left   != null ? def.left   + 'px' : '';
    el.style.top    = def.top    != null ? def.top    + 'px' : '';
    el.style.right  = def.right  != null ? def.right  + 'px' : '';
    el.style.bottom = def.bottom != null ? def.bottom + 'px' : '';
  });
  location.reload();
};
