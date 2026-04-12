/* ============================================================
   StreamGames – Draggable Panels
   Hace que los paneles flotantes se puedan arrastrar
   ============================================================ */

/**
 * Hace un panel arrastrable agarrándolo por su header.
 * @param {HTMLElement} panel  - El panel completo
 * @param {HTMLElement} handle - El header por donde se arrastra
 */
function makeDraggable(panel, handle) {
  if (!panel || !handle) return;

  let startX, startY, startLeft, startTop;
  let isDragging = false;

  // Asegurar que el panel tenga posición fija y coordenadas iniciales
  function initPosition() {
    if (panel.style.position !== 'fixed') return;
    // Si no tiene left/top explícitos, calcularlos desde getBoundingClientRect
    if (!panel.style.left || panel.style.left === '') {
      const rect = panel.getBoundingClientRect();
      panel.style.left   = rect.left + 'px';
      panel.style.top    = rect.top  + 'px';
      panel.style.right  = 'auto';
      panel.style.bottom = 'auto';
    }
  }

  handle.addEventListener('mousedown', onMouseDown);
  handle.addEventListener('touchstart', onTouchStart, { passive: false });

  function onMouseDown(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' || e.target.closest('button')) return;
    e.preventDefault();
    initPosition();
    startX    = e.clientX;
    startY    = e.clientY;
    startLeft = parseInt(panel.style.left) || 0;
    startTop  = parseInt(panel.style.top)  || 0;
    isDragging = true;
    panel.style.transition = 'none';
    panel.style.zIndex = '10000';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function onTouchStart(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    const touch = e.touches[0];
    initPosition();
    startX    = touch.clientX;
    startY    = touch.clientY;
    startLeft = parseInt(panel.style.left) || 0;
    startTop  = parseInt(panel.style.top)  || 0;
    isDragging = true;
    panel.style.transition = 'none';
    panel.style.zIndex = '10000';
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend',  onTouchEnd);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    move(e.clientX - startX, e.clientY - startY);
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    move(touch.clientX - startX, touch.clientY - startY);
  }

  function move(dx, dy) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;

    let newLeft = startLeft + dx;
    let newTop  = startTop  + dy;

    // Mantener dentro de la pantalla
    newLeft = Math.max(0, Math.min(newLeft, vw - pw));
    newTop  = Math.max(0, Math.min(newTop,  vh - ph));

    panel.style.left = newLeft + 'px';
    panel.style.top  = newTop  + 'px';
  }

  function onMouseUp() {
    isDragging = false;
    panel.style.transition = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
    savePosition(panel);
  }

  function onTouchEnd() {
    isDragging = false;
    panel.style.transition = '';
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend',  onTouchEnd);
    savePosition(panel);
  }
}

/* ── Guardar y restaurar posiciones en localStorage ── */
function savePosition(panel) {
  if (!panel.id) return;
  const pos = { left: panel.style.left, top: panel.style.top };
  localStorage.setItem('panel-pos-' + panel.id, JSON.stringify(pos));
}

function restorePosition(panel) {
  if (!panel.id) return;
  try {
    const saved = localStorage.getItem('panel-pos-' + panel.id);
    if (!saved) return;
    const pos = JSON.parse(saved);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panel.offsetWidth  || 300;
    const ph = panel.offsetHeight || 200;
    const left = Math.max(0, Math.min(parseInt(pos.left), vw - pw));
    const top  = Math.max(0, Math.min(parseInt(pos.top),  vh - ph));
    panel.style.left   = left + 'px';
    panel.style.top    = top  + 'px';
    panel.style.right  = 'auto';
    panel.style.bottom = 'auto';
  } catch (_) {}
}

/* ── Inicializar todos los paneles cuando el DOM esté listo ── */
function initDraggablePanels() {
  // Panel de chat (index.html)
  const chatPanel = document.getElementById('chatPanel');
  if (chatPanel) {
    const chatHeader = chatPanel.querySelector('.chat-panel-header');
    restorePosition(chatPanel);
    makeDraggable(chatPanel, chatHeader);
  }

  // Panel TTS de juegos (_chatPanel)
  const ttsPanel = document.getElementById('_chatPanel');
  if (ttsPanel) {
    const ttsHeader = ttsPanel.querySelector('div');
    restorePosition(ttsPanel);
    makeDraggable(ttsPanel, ttsHeader);
  }

  // Panel de créditos (_creditPanel)
  const creditPanel = document.getElementById('_creditPanel');
  if (creditPanel) {
    const creditHeader = creditPanel.querySelector('div');
    restorePosition(creditPanel);
    makeDraggable(creditPanel, creditHeader);
  }

  // Panel de donaciones (_donPanel)
  const donPanel = document.getElementById('_donPanel');
  if (donPanel) {
    const donHeader = donPanel.querySelector('div');
    restorePosition(donPanel);
    makeDraggable(donPanel, donHeader);
  }
}

/* ── Observar cuando los paneles se crean dinámicamente ── */
const _dragObserver = new MutationObserver(() => {
  initDraggablePanels();
});

_dragObserver.observe(document.body, { childList: true, subtree: false });

// También inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDraggablePanels);
} else {
  initDraggablePanels();
  // Reintentar después de que los paneles dinámicos se creen
  setTimeout(initDraggablePanels, 500);
  setTimeout(initDraggablePanels, 1500);
}
