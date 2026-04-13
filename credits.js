/* ============================================================
   StreamGames – Sistema de Créditos + Rangos + Logros
   Guarda en data/credits.json
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'credits.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

let db = { users: {}, updatedAt: Date.now() };
if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (_) { db = { users: {}, updatedAt: Date.now() }; }
}

let _saveTimer = null;
function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    db.updatedAt = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  }, 1000);
}

/* ── Rangos ── */
const RANKS = [
  { id: 'legend',   label: 'Leyenda',  emoji: '👑', min: 5000, color: '#e8c96a' },
  { id: 'diamond',  label: 'Diamante', emoji: '💎', min: 2000, color: '#67e8f9' },
  { id: 'gold',     label: 'Oro',      emoji: '🥇', min: 500,  color: '#fbbf24' },
  { id: 'silver',   label: 'Plata',    emoji: '🥈', min: 100,  color: '#94a3b8' },
  { id: 'bronze',   label: 'Bronce',   emoji: '🥉', min: 0,    color: '#b45309' },
];

function getRank(credits) {
  return RANKS.find(r => credits >= r.min) || RANKS[RANKS.length - 1];
}

function getNextRank(credits) {
  const idx = RANKS.findIndex(r => credits >= r.min);
  return idx > 0 ? RANKS[idx - 1] : null;
}

/* ── Logros ── */
const ACHIEVEMENTS = [
  { id: 'first_spin',    label: 'Primer Giro',      emoji: '🎰', desc: 'Participaste por primera vez',        check: u => u.spins >= 1 },
  { id: 'spin_10',       label: 'Girador',           emoji: '🌀', desc: 'Participaste 10 veces',               check: u => u.spins >= 10 },
  { id: 'spin_50',       label: 'Adicto al Giro',    emoji: '🎡', desc: 'Participaste 50 veces',               check: u => u.spins >= 50 },
  { id: 'first_vote',    label: 'Votante',           emoji: '🗳️', desc: 'Votaste por primera vez',             check: u => u.votes >= 1 },
  { id: 'vote_20',       label: 'Demócrata',         emoji: '📊', desc: 'Votaste 20 veces',                    check: u => u.votes >= 20 },
  { id: 'first_win',     label: 'Ganador',           emoji: '🏆', desc: 'Ganaste tu primer juego',             check: u => u.wins >= 1 },
  { id: 'win_5',         label: 'Campeón',           emoji: '🥇', desc: 'Ganaste 5 juegos',                    check: u => u.wins >= 5 },
  { id: 'win_20',        label: 'Leyenda Viva',      emoji: '👑', desc: 'Ganaste 20 juegos',                   check: u => u.wins >= 20 },
  { id: 'credits_100',   label: 'Ahorrador',         emoji: '💰', desc: 'Acumulaste 100 créditos',             check: u => u.totalEarned >= 100 },
  { id: 'credits_500',   label: 'Rico',              emoji: '💎', desc: 'Acumulaste 500 créditos',             check: u => u.totalEarned >= 500 },
  { id: 'credits_2000',  label: 'Millonario',        emoji: '🤑', desc: 'Acumulaste 2000 créditos',            check: u => u.totalEarned >= 2000 },
  { id: 'follower',      label: 'Fan',               emoji: '❤️', desc: 'Seguiste el canal',                   check: u => u.followed === true },
  { id: 'gifter',        label: 'Generoso',          emoji: '🎁', desc: 'Enviaste un regalo',                  check: u => u.gifts >= 1 },
  { id: 'gifter_5',      label: 'Mecenas',           emoji: '🌟', desc: 'Enviaste 5 regalos',                  check: u => u.gifts >= 5 },
  { id: 'veteran',       label: 'Veterano',          emoji: '🎖️', desc: 'Llevas más de 7 días en el chat',    check: u => (Date.now() - u.joinedAt) > 7 * 86400000 },
];

function checkAchievements(user) {
  if (!user.achievements) user.achievements = [];
  const newOnes = [];
  ACHIEVEMENTS.forEach(a => {
    if (!user.achievements.includes(a.id) && a.check(user)) {
      user.achievements.push(a.id);
      newOnes.push(a);
    }
  });
  return newOnes;
}

/* ── Tienda ── */
const SHOP_ITEMS = [
  { id: 'vip_tag',     label: 'Tag VIP',         emoji: '⭐', desc: 'Aparece con tag VIP en el chat', price: 200,  type: 'cosmetic' },
  { id: 'extra_spin',  label: 'Giro Extra',       emoji: '🎰', desc: 'Un giro extra en la ruleta',     price: 50,   type: 'power' },
  { id: 'double_pts',  label: 'Doble Puntos',     emoji: '✖️', desc: '2x créditos por 10 minutos',     price: 150,  type: 'power' },
  { id: 'shield',      label: 'Escudo',           emoji: '🛡️', desc: 'Protege tus créditos 1 vez',     price: 100,  type: 'power' },
  { id: 'bomb',        label: 'Bomba',            emoji: '💣', desc: 'Roba 10 créditos a un rival',    price: 80,   type: 'attack' },
  { id: 'crown',       label: 'Corona',           emoji: '👑', desc: 'Aparece en el top del ranking',  price: 500,  type: 'cosmetic' },
  { id: 'mystery',     label: 'Caja Misteriosa',  emoji: '📦', desc: 'Premio sorpresa (10-300 pts)',   price: 75,   type: 'mystery' },
];

function buyItem(username, itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return { ok: false, error: 'Item no existe' };
  const user = getUser(username);
  if (user.credits < item.price) return { ok: false, error: 'Créditos insuficientes' };

  user.credits -= item.price;
  if (!user.inventory) user.inventory = [];

  // Item especial: caja misteriosa
  if (item.type === 'mystery') {
    const prize = Math.floor(Math.random() * 291) + 10;
    user.credits += prize;
    user.totalEarned += prize;
    save();
    return { ok: true, item, mystery: prize };
  }

  user.inventory.push({ id: itemId, boughtAt: Date.now() });
  save();
  return { ok: true, item };
}

/* ── CRUD ── */
function getUser(username) {
  if (!db.users[username]) {
    db.users[username] = {
      username, credits: 0, totalEarned: 0,
      spins: 0, votes: 0, wins: 0, gifts: 0,
      followed: false, achievements: [], inventory: [],
      rank: 'bronze', joinedAt: Date.now(), lastSeen: Date.now(),
    };
  }
  const u = db.users[username];
  u.lastSeen = Date.now();
  // Actualizar rango
  u.rank = getRank(u.totalEarned).id;
  return u;
}

function addCredits(username, amount, reason) {
  const user = getUser(username);
  user.credits     += amount;
  user.totalEarned += amount;
  user.rank = getRank(user.totalEarned).id;
  const newAchievements = checkAchievements(user);
  save();
  return { user, newAchievements };
}

function spendCredits(username, amount) {
  const user = getUser(username);
  if (user.credits < amount) return false;
  user.credits -= amount;
  save();
  return true;
}

function recordAction(username, action) {
  const user = getUser(username);
  if (action === 'spin')   user.spins++;
  if (action === 'vote')   user.votes++;
  if (action === 'win')    user.wins++;
  if (action === 'gift')   user.gifts = (user.gifts || 0) + 1;
  if (action === 'follow') user.followed = true;
  const newAchievements = checkAchievements(user);
  save();
  return { user, newAchievements };
}

function getLeaderboard(limit = 10) {
  return Object.values(db.users)
    .sort((a, b) => b.credits - a.credits)
    .slice(0, limit)
    .map(u => ({ ...u, rankInfo: getRank(u.totalEarned) }));
}

function getCredits(username) {
  return db.users[username]?.credits ?? 0;
}

function resetAll() {
  db.users = {};
  save();
}

module.exports = {
  getUser, addCredits, spendCredits, recordAction,
  getLeaderboard, getCredits, resetAll,
  getRank, getNextRank, RANKS, ACHIEVEMENTS, SHOP_ITEMS, buyItem,
};
