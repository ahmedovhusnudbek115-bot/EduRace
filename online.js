/* Edu Race — onlayn mijoz moduli (API, identifikatsiya). Barcha soʻrovlar faqat oʻz domeniga (CSP connect-src 'self'). */
'use strict';
const EduNet = (() => {
  const KEY = 'eduRace.net';
  const REGIONS = [['tsh', 'Toshkent shahri'], ['tsv', 'Toshkent viloyati'], ['and', 'Andijon'], ['bux', 'Buxoro'], ['fer', 'Fargʻona'], ['jiz', 'Jizzax'], ['xor', 'Xorazm'], ['nam', 'Namangan'], ['nav', 'Navoiy'], ['qash', 'Qashqadaryo'], ['qq', 'Qoraqalpogʻiston'], ['sam', 'Samarqand'], ['sir', 'Sirdaryo'], ['sur', 'Surxondaryo']];
  const RMAP = Object.fromEntries(REGIONS);
  let me = load(), available = null, offset = 0;

  function load() {
    try {
      const s = localStorage.getItem(KEY); if (typeof s !== 'string' || s.length > 600) return null;
      const o = JSON.parse(s);
      if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
      if (typeof o.id !== 'string' || !/^[a-z2-7]{12}$/.test(o.id)) return null;
      if (typeof o.token !== 'string' || !/^[0-9a-f]{40}$/.test(o.token)) return null;
      if (typeof o.nick !== 'string' || o.nick.length < 3 || o.nick.length > 16) return null;
      if (typeof o.region !== 'string' || !RMAP[o.region]) return null;
      return { id: o.id, token: o.token, nick: o.nick, region: o.region };
    } catch (e) { return null; }
  }
  function persist() { try { if (me) localStorage.setItem(KEY, JSON.stringify(me)); else localStorage.removeItem(KEY); } catch (e) {} }

  async function call(path, body) {
    const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin', cache: 'no-store' } : { credentials: 'same-origin' };
    let r;
    try { r = await fetch('api/' + path, opt); } catch (e) { const err = new Error('network'); err.code = 0; throw err; }
    let j = null; try { j = await r.json(); } catch (e) {}
    if (j && typeof j.now === 'number') { const o = j.now - Date.now(); offset = offset ? offset * 0.7 + o * 0.3 : o; }
    if (!r.ok || !j || j.ok !== true) { const err = new Error((j && j.error) || ('http_' + r.status)); err.code = r.status; throw err; }
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

  async function register(nick, region) {
    const body = Object.assign({ nick, region }, auth() || {});
    const j = await call('player', body);
    me = { id: j.id, token: j.token, nick: j.nick, region: j.region }; persist(); return me;
  }
  async function startRace(kind, track) { if (!me) return null; try { return (await call('race', Object.assign({ op: 'start', kind, track }, auth()))).raceId; } catch (e) { return null; } }
  async function finishRace(raceId, d) { return call('race', Object.assign({ op: 'finish', raceId, correct: d.correct, total: d.total, time: Math.round(d.time * 10) / 10, place: d.place }, auth())); }
  async function leaderboard(type, region) {
    const q = new URLSearchParams({ type }); if (type === 'region') q.set('r', region || (me && me.region) || 'tsh'); if (me && type !== 'regions') q.set('me', me.id);
    return call('leaderboard?' + q.toString());
  }
  const room = {
    create: cfg => call('room', Object.assign({ op: 'create', track: cfg.track, subject: cfg.subject, level: cfg.level, car: cfg.car }, auth())),
    join: (code, car) => call('room', Object.assign({ op: 'join', code, car }, auth())),
    start: code => call('room', Object.assign({ op: 'start', code }, auth())),
    sync: (code, s) => call('room', Object.assign({ op: 'sync', code }, s || {}, auth())),
    leave: code => call('room', Object.assign({ op: 'leave', code }, auth())).catch(() => null)
  };
  const ADJ = ['Tezkor', 'Aqlli', 'Chaqqon', 'Mard', 'Zukko', 'Bilimdon', 'Olovli', 'Kumush', 'Oltin', 'Yulduz', 'Shiddatli', 'Dono'];
  const NOUN = ['Burgut', 'Lochin', 'Yoʻlbars', 'Arslon', 'Qoplon', 'Shunqor', 'Tulpor', 'Kometa', 'Chaqmoq', 'Boʻron', 'Sher', 'Ilvirs'];
  function suggest() { const r = n => Math.floor(Math.random() * n); return `${ADJ[r(ADJ.length)]} ${NOUN[r(NOUN.length)]}`; }
  const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

  return Object.freeze({ REGIONS, RMAP, CODE_RE, check, register, startRace, finishRace, leaderboard, room, suggest,
    get me() { return me; }, get available() { return available; }, serverNow: () => Date.now() + offset,
    forget() { me = null; persist(); },
    async deleteMe() { if (!me) return; await call('player', Object.assign({ op: 'delete' }, auth())); me = null; persist(); } });
})();
