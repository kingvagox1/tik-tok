/* ============================================================
   StreamGames – Sistema de Créditos (Servidor)
   Guarda en data/credits.json
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'credits.json');

// Asegurar que existe la carpeta data
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Cargar datos
let db = { users: {}, updatedAt: Date.now() };
if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (_) { db = { users: {}, updatedAt: Date.now() }; }
}

// Guardar con debounce para no escribir en cada mensaje
let _saveTimer = null;
function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    db.updatedAt = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  }, 1000);
}

// Obtener o crear usuario
function getUser(username) {
  if (!db.users[username]) {
    db.users[username] = {
      username,
      credits:   0,
      totalEarned: 0,
      spins:     0,
      votes:     0,
      wins:      0,
      joinedAt:  Date.now(),
      lastSeen:  Date.now(),
    };
  }
  db.users[username].lastSeen = Date.now();
  return db.users[username];
}

// Agregar créditos
function addCredits(username, amount, reason) {
  const user = getUser(username);
  user.credits     += amount;
  user.totalEarned += amount;
  save();
  return user;
}

// Gastar créditos
function spendCredits(username, amount) {
  const user = getUser(username);
  if (user.credits < amount) return false;
  user.credits -= amount;
  save();
  return true;
}

// Registrar acción de juego
function recordAction(username, action) {
  const user = getUser(username);
  if (action === 'spin')  user.spins++;
  if (action === 'vote')  user.votes++;
  if (action === 'win')   user.wins++;
  save();
  return user;
}

// Top leaderboard
function getLeaderboard(limit = 10) {
  return Object.values(db.users)
    .sort((a, b) => b.credits - a.credits)
    .slice(0, limit);
}

// Obtener usuario
function getCredits(username) {
  return db.users[username]?.credits ?? 0;
}

// Resetear todos
function resetAll() {
  db.users = {};
  save();
}

module.exports = { getUser, addCredits, spendCredits, recordAction, getLeaderboard, getCredits, resetAll };
