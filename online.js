/* Edu Race — onlayn mijoz moduli: akkaunt (login/parol), reyting, xonalar, bulut saqlash.
   Barcha soʻrovlar faqat oʻz domeniga (CSP connect-src 'self'). Parol qurilmada saqlanmaydi — faqat imzolangan token. */
'use strict';
const EduNet = (() => {
  const KEY = 'eduRace.acct', OLD_KEY = 'eduRace.net';
  const REGIONS = [['tsh', 'Toshkent shahri'], ['tsv', 'Toshkent viloyati'], ['and', 'Andijon'], ['bux', 'Buxoro'], ['fer', 'Fargʻona'], ['jiz', 'Jizzax'], ['xor', 'Xorazm'], ['nam', 'Namangan'], ['nav', 'Navoiy'], ['qash', 'Qashqadaryo'], ['qq', 'Qoraqalpogʻiston'], ['sam', 'Samarqand'], ['sir', 'Sirdaryo'], ['sur', 'Surxondaryo']];
  const RMAP = Object.fromEntries(REGIONS);
  const TOKEN_RE = /^\d{1,6}\.[0-9a-f]{40}$/, ID_RE = /^[a-z2-7]{12}$/;
  try { localStorage.removeItem(OLD_KEY); } catch (e) {} // eski anonim profil (v3) endi ishlatilmaydi
  let me = load(), available = null, offset = 0;

  const str = (v, a, b) => typeof v === 'string' && v.length >= a && v.length <= b;
  const num = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b;
  function cleanProfile(p) {
    if (!p || typeof p !== 'object') return null;
    if (!str(p.username, 3, 20) || !/^[a-z0-9_]+$/.test(p.username) || !str(p.nick, 3, 16) || !RMAP[p.region]) return null;
    const lg = p.league && typeof p.league === 'object' ? p.league : {};
    return { username: p.username, nick: p.nick, region: p.region, grade: num(p.grade, 4, 11) ? p.grade : 7, rating: num(p.rating, 0, 1e5) ? Math.round(p.rating) : 1000,
      league: { id: str(lg.id, 1, 12) ? lg.id : 'bronza', name: str(lg.name, 1, 12) ? lg.name : 'Bronza', ic: str(lg.ic, 1, 4) ? lg.ic : '🥉' },
      games: num(p.games, 0, 1e7) ? p.games : 0, wins: num(p.wins, 0, 1e7) ? p.wins : 0, xp: num(p.xp, 0, 1e9) ? p.xp : 0, level: num(p.level, 1, 1e4) ? p.level : 1, rank: num(p.rank, 1, 1e8) ? p.rank : null };
  }
  function load() {
    try {
      const s = localStorage.getItem(KEY); if (typeof s !== 'string' || s.length > 1500) return null;
      const o = JSON.parse(s);
      if (!o || typeof o !== 'object' || Array.isArray(o) || !ID_RE.test(o.id) || !TOKEN_RE.test(o.token)) return null;
      const p = cleanProfile(o.p); if (!p) return null;
      return Object.assign({ id: o.id, token: o.token }, p);
    } catch (e) { return null; }
  }
  function persist() {
    try { if (me) { const { id, token, ...p } = me; localStorage.setItem(KEY, JSON.stringify({ id, token, p })); } else localStorage.removeItem(KEY); } catch (e) {}
  }
  function setMe(id, token, profile) { const p = cleanProfile(profile); if (!p) throw Object.assign(new Error('profile'), { code: 500 }); me = Object.assign({ id, token }, p); persist(); return me; }

  async function call(path, body) {
    const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin', cache: 'no-store' } : { credentials: 'same-origin' };
    let r;
    try { r = await fetch('api/' + path, opt); } catch (e) { const err = new Error('network'); err.code = 0; throw err; }
    let j = null; try { j = await r.json(); } catch (e) {}
    if (j && typeof j.now === 'number') { const o = j.now - Date.now(); offset = offset ? offset * 0.7 + o * 0.3 : o; }
    if (!r.ok || !j || j.ok !== true) {
      const err = new Error((j && j.error) || ('http_' + r.status)); err.code = r.status;
      if (r.status === 401 && me && path !== 'account') { /* token eskirgan — qayta kirish kerak */ me = null; persist(); err.message = 'auth'; }
      throw err;
    }
    return j;
  }
  async function check(force) {
    if (available !== null && !force) return available;
    if (location.protocol === 'file:' || /\.github\.io$/.test(location.hostname)) { available = false; return false; } // statik nusxalarda server yoʻq
    try { const r = await fetch('api/health', { cache: 'no-store', credentials: 'same-origin' }); const j = r.ok ? await r.json() : null; available = !!(j && j.ok === true); if (j && j.now) offset = j.now - Date.now(); }
    catch (e) { available = false; }
    return available;
  }
  const auth = () => me ? { id: me.id, token: me.token } : null;

  async function register(d) { const j = await call('account', { op: 'register', username: d.username, password: d.password, nick: d.nick, region: d.region, grade: d.grade }); return setMe(j.id, j.token, j.profile); }
  async function login(username, password) { const j = await call('account', { op: 'login', username, password }); return setMe(j.id, j.token, j.profile); }
  async function refresh() {
    if (!me) return null;
    try { const j = await call('account', Object.assign({ op: 'me' }, auth())); return setMe(me.id, me.token, j.profile); }
    catch (e) { if (e.code === 401) { me = null; persist(); } throw e; }
  }
  async function update(d) { const j = await call('account', Object.assign({ op: 'update' }, d, auth())); return setMe(me.id, me.token, j.profile); }
  async function changePassword(oldPw, newPw) { const j = await call('account', Object.assign({ op: 'password', password: oldPw, newPassword: newPw }, auth())); me.token = j.token; persist(); return true; }
  async function deleteAccount(pw) { await call('account', Object.assign({ op: 'delete', password: pw }, auth())); me = null; persist(); }
  function logout() { me = null; persist(); }

  async function startRace(kind, track) { if (!me) return null; try { return (await call('race', Object.assign({ op: 'start', kind, track }, auth()))).raceId; } catch (e) { return null; } }
  async function finishRace(raceId, d) { return call('race', Object.assign({ op: 'finish', raceId, correct: d.correct, total: d.total, time: Math.round(d.time * 10) / 10, place: d.place }, auth())); }
  async function leaderboard(type, region) {
    const q = new URLSearchParams({ type }); if (type === 'region') q.set('r', region || (me && me.region) || 'tsh'); if (me && type !== 'regions') q.set('me', me.id);
    return call('leaderboard?' + q.toString());
  }
  const cloud = {
    get: () => call('save', Object.assign({ op: 'get' }, auth())),
    put: data => call('save', Object.assign({ op: 'put', data }, auth()))
  };
  const room = {
    create: cfg => call('room', Object.assign({ op: 'create', track: cfg.track, subject: cfg.subject, level: cfg.level, car: cfg.car }, auth())),
    quick: cfg => call('room', Object.assign({ op: 'quick', track: cfg.track, subject: cfg.subject, level: cfg.level, car: cfg.car }, auth())),
    join: (code, car) => call('room', Object.assign({ op: 'join', code, car }, auth())),
    start: code => call('room', Object.assign({ op: 'start', code }, auth())),
    sync: (code, s) => call('room', Object.assign({ op: 'sync', code }, s || {}, auth())),
    leave: code => call('room', Object.assign({ op: 'leave', code }, auth())).catch(() => null)
  };
  const ADJ = ['Tezkor', 'Aqlli', 'Chaqqon', 'Mard', 'Zukko', 'Bilimdon', 'Olovli', 'Kumush', 'Oltin', 'Yulduz', 'Shiddatli', 'Dono'];
  const NOUN = ['Burgut', 'Lochin', 'Yoʻlbars', 'Arslon', 'Qoplon', 'Shunqor', 'Tulpor', 'Kometa', 'Chaqmoq', 'Boʻron', 'Sher', 'Ilvirs'];
  function suggest() { const r = n => Math.floor(Math.random() * n); return `${ADJ[r(ADJ.length)]} ${NOUN[r(NOUN.length)]}`; }
  const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
  const LEAGUES = [[0, '🥉', 'Bronza'], [1100, '🥈', 'Kumush'], [1250, '🥇', 'Oltin'], [1400, '💠', 'Platina'], [1550, '💎', 'Olmos'], [1700, '👑', 'Chempion']];
  function nextLeague(r) { const n = LEAGUES.find(l => l[0] > r); return n ? { at: n[0], ic: n[1], name: n[2] } : null; }
  const levelXp = lv => (lv - 1) * (lv - 1) * 120;

  return Object.freeze({ REGIONS, RMAP, CODE_RE, LEAGUES, nextLeague, levelXp, check, register, login, refresh, update, changePassword, deleteAccount, logout,
    startRace, finishRace, leaderboard, cloud, room, suggest,
    get me() { return me; }, get available() { return available; }, serverNow: () => Date.now() + offset });
})();
