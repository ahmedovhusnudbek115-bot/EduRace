'use strict';
// Doʻstlar bilan jonli poyga: xona (4 belgili kod), 2–6 oʻyinchi, bir xil seed, server vaqti boʻyicha marra tartibi.
const L = require('./_lib');
const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', TTL = 7200, MAXP = 6;
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
function code() { let s = ''; const b = require('crypto').randomBytes(4); for (const x of b) s += ALPH[x % ALPH.length]; return s; }
function view(room, players, states, fins) {
  const P = L.hobj(players), S = L.hobj(states), F = L.hobj(fins);
  const list = Object.keys(P).map(pid => { const p = parse(P[pid]) || {}; const s = parse(S[pid]) || null; const f = F[pid] ? Number(F[pid]) - room.startAt : null;
    return { id: pid, nick: p.nick || '—', region: p.region || 'tsh', car: L.CARS.includes(p.car) ? p.car : 'ilm1', j: p.j || 0, s: s ? { p: s.p, x: s.x, c: s.c, t: s.t } : null, ft: f }; })
    .sort((a, b) => a.j - b.j);
  return { status: room.status, startAt: room.startAt, host: room.host, seed: room.seed, track: room.track, subject: room.subject, level: room.level, players: list };
}
module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST']); if (!b) return;
  if (!L.verify(b.id, b.token)) return L.fail(res, 401, 'auth');
  const id = b.id, now = Date.now();
  const car = L.CARS.includes(b.car) ? b.car : 'ilm1';
  if (b.op === 'create') {
    if (!L.TRACKS.includes(b.track) || !L.SUBJECTS.includes(b.subject) || !L.isInt(b.level, 1, 3)) return L.fail(res, 400, 'params');
    if (!(await L.rateLimit('rc:' + id, 20, 3600))) return L.fail(res, 429, 'limit');
    const [pl] = await L.redis([['HGET', 'pl', id]]); const me = L.parsePlayer(pl); if (!me) return L.fail(res, 404, 'player');
    const room = { host: id, seed: require('crypto').randomBytes(4).readUInt32BE(0), status: 'lobby', track: b.track, subject: b.subject, level: b.level, created: now, startAt: 0 };
    let c = null;
    for (let i = 0; i < 6 && !c; i++) { const t = code(); const [ok] = await L.redis([['SET', 'room:' + t, JSON.stringify(room), 'EX', TTL, 'NX']]); if (ok === 'OK') c = t; }
    if (!c) return L.fail(res, 503, 'busy');
    await L.redis([['HSET', 'rp:' + c, id, JSON.stringify({ nick: me.nick, region: me.region, car, j: now })], ['EXPIRE', 'rp:' + c, TTL]]);
    return L.send(res, 200, { ok: true, code: c, now, room: view(room, { [id]: JSON.stringify({ nick: me.nick, region: me.region, car, j: now }) }, {}, {}) });
  }
  if (typeof b.code !== 'string' || !CODE_RE.test(b.code)) return L.fail(res, 400, 'code');
  const C = b.code;
  if (b.op === 'join') {
    if (!(await L.rateLimit('rj:' + id, 60, 3600))) return L.fail(res, 429, 'limit');
    const [rs, plist, pl] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C], ['HGET', 'pl', id]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    const P = L.hobj(plist), me = L.parsePlayer(pl); if (!me) return L.fail(res, 404, 'player');
    if (!P[id]) { if (room.status !== 'lobby') return L.fail(res, 409, 'started'); if (Object.keys(P).length >= MAXP) return L.fail(res, 409, 'full'); }
    P[id] = JSON.stringify({ nick: me.nick, region: me.region, car, j: P[id] ? (parse(P[id]) || {}).j || now : now });
    await L.redis([['HSET', 'rp:' + C, id, P[id]], ['EXPIRE', 'rp:' + C, TTL]]);
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, P, {}, {}) });
  }
  if (b.op === 'start') {
    const [rs, plist] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    if (room.host !== id) return L.fail(res, 403, 'host');
    if (room.status !== 'lobby') return L.fail(res, 409, 'started');
    if (Object.keys(L.hobj(plist)).length < 2) return L.fail(res, 409, 'players');
    room.status = 'race'; room.startAt = now + 5000;
    await L.redis([['SET', 'room:' + C, JSON.stringify(room), 'EX', TTL], ['EXPIRE', 'rp:' + C, TTL]]);
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, plist, {}, {}) });
  }
  if (b.op === 'sync') {
    if (!(await L.rateLimit('sy:' + id, 240, 60))) return L.fail(res, 429, 'limit');
    const [rs, plist] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    const P = L.hobj(plist); if (!P[id]) return L.fail(res, 403, 'member');
    const cmds = [];
    if (room.status === 'race' && now >= room.startAt) {
      const p = b.p, x = b.x, c = b.c;
      if (!L.isNum(p, 0, 1.05) || !L.isNum(x, -2.5, 2.5) || !L.isInt(c, 0, 40)) return L.fail(res, 400, 'values');
      cmds.push(['HSET', 'rs:' + C, id, JSON.stringify({ p: Math.round(p * 10000) / 10000, x: Math.round(x * 100) / 100, c, t: now })], ['EXPIRE', 'rs:' + C, TTL]);
      if (b.fin === true && p >= 0.995 && now - room.startAt >= 50000) cmds.push(['HSETNX', 'rf:' + C, id, now], ['EXPIRE', 'rf:' + C, TTL]);
    }
    cmds.push(['HGETALL', 'rs:' + C], ['HGETALL', 'rf:' + C]);
    const out = await L.redis(cmds);
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, P, out[out.length - 2], out[out.length - 1]) });
  }
  if (b.op === 'leave') {
    const [rs] = await L.redis([['GET', 'room:' + C]]);
    const room = parse(rs);
    const cmds = [['HDEL', 'rp:' + C, id], ['HDEL', 'rs:' + C, id]];
    if (room && room.host === id && room.status === 'lobby') { room.status = 'closed'; cmds.push(['SET', 'room:' + C, JSON.stringify(room), 'EX', 600]); }
    await L.redis(cmds);
    return L.send(res, 200, { ok: true });
  }
  L.fail(res, 400, 'op');
});
