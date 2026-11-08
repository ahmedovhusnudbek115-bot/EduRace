'use strict';
// Onlayn "set"lar: doʻstlar xonasi (4 belgili kod) va TEZKOR OʻYIN (server raqib topadi, reytingli).
// Bir xil seed → hammada bir xil savollar; marra tartibi server vaqti boʻyicha; Elo reyting faqat tezkor oʻyinda oʻzgaradi.
const L = require('./_lib');
const crypto = require('crypto');
const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', TTL = 7200, MAXP = 6;
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
const Q_FILL = 12000, Q_SOLO = 20000, K = 32; // tezkor oʻyin: 12 s ichida raqiblar yigʻiladi; 20 s da yolgʻiz boʻlsa — botlar bilan (reytingsiz)
const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const band = g => g <= 4 ? 'a' : g <= 6 ? 'b' : g <= 9 ? 'c' : 'd';
function code() { let s = ''; for (const x of crypto.randomBytes(4)) s += ALPH[x % ALPH.length]; return s; }
function pinfo(a, car, j) { return JSON.stringify({ nick: a.nick, region: a.region, car, j, r: a.rating, lv: L.levelOf(a.xp) }); }
function view(room, players, states, fins, deltas) {
  const P = L.hobj(players), S = L.hobj(states), F = L.hobj(fins), D = L.hobj(deltas || []);
  const list = Object.keys(P).map(pid => { const p = parse(P[pid]) || {}; const s = parse(S[pid]) || null; const f = F[pid] ? Number(F[pid]) - room.startAt : null;
    return { id: pid, nick: p.nick || '—', region: p.region || 'tsh', car: L.CARS.includes(p.car) ? p.car : 'ilm1', j: p.j || 0, r: p.r || 1000, lv: p.lv || 1,
      s: s ? { p: s.p, x: s.x, c: s.c, t: s.t } : null, ft: f, rd: D[pid] !== undefined ? Number(D[pid]) : null }; })
    .sort((a, b) => a.j - b.j);
  return { status: room.status, startAt: room.startAt, host: room.host, seed: room.seed, track: room.track, subject: room.subject, level: room.level,
    quick: !!room.quick, ranked: !!room.ranked, created: room.created, fillAt: room.quick ? room.created + Q_FILL : 0, soloAt: room.quick ? room.created + Q_SOLO : 0, players: list };
}
async function newRoom(a, cfg, now, car, quick) {
  const room = { host: a.id, seed: crypto.randomBytes(4).readUInt32BE(0), status: 'lobby', track: cfg.track, subject: cfg.subject, level: cfg.level, created: now, startAt: 0, quick: !!quick };
  for (let i = 0; i < 8; i++) {
    const t = code(); const [ok] = await L.redis([['SET', 'room:' + t, JSON.stringify(room), 'EX', TTL, 'NX']]);
    if (ok === 'OK') { await L.redis([['HSET', 'rp:' + t, a.id, pinfo(a, car, now)], ['EXPIRE', 'rp:' + t, TTL]]); return { code: t, room }; }
  }
  return null;
}
// Poygani boshlash (bir marta: qulf bilan). Reytingli boʻlsa — boshlang'ich reytinglar suratga olinadi.
async function startRoom(C, room, P, now, delay) {
  const [lock] = await L.redis([['SET', 'rlock:' + C, '1', 'EX', 60, 'NX']]);
  if (lock !== 'OK') return false;
  const ids = Object.keys(P);
  room.status = 'race'; room.startAt = now + delay;
  room.ranked = !!room.quick && ids.length >= 2;
  room.r = {}; for (const pid of ids) room.r[pid] = (parse(P[pid]) || {}).r || 1000;
  const cmds = [['SET', 'room:' + C, JSON.stringify(room), 'EX', TTL], ['EXPIRE', 'rp:' + C, TTL]];
  if (room.quick) cmds.push(['DEL', 'mq:' + room.qk]);
  await L.redis(cmds);
  return true;
}
// Elo: marraga yetgan oʻyinchi hali yetmaganlarning hammasidan yutgan hisoblanadi (har juftlik bir marta).
function eloPairs(room, winner, finishedSet) {
  const ids = Object.keys(room.r || {}); const n = ids.length; if (n < 2) return {};
  const k = K / (n - 1) * 1.5, d = {};
  const rw = room.r[winner] || 1000;
  for (const q of ids) {
    if (q === winner || finishedSet.has(q)) continue;
    const rq = room.r[q] || 1000; const e = 1 / (1 + Math.pow(10, (rq - rw) / 400));
    const ch = Math.max(1, Math.round(k * (1 - e)));
    d[winner] = (d[winner] || 0) + ch; d[q] = (d[q] || 0) - ch;
  }
  return d;
}

module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST']); if (!b) return;
  const now = Date.now();
  const car = L.CARS.includes(b.car) ? b.car : 'ilm1';

  // sync — tez-tez chaqiriladi: token tekshiruvi holatsiz (HMAC), akkaunt oʻqilmaydi
  if (b.op === 'sync') {
    if (!L.verify(b.id, b.token)) return L.fail(res, 401, 'auth');
    const id = b.id;
    if (typeof b.code !== 'string' || !CODE_RE.test(b.code)) return L.fail(res, 400, 'code');
    const C = b.code;
    if (!(await L.rateLimit('sy:' + id, 240, 60))) return L.fail(res, 429, 'limit');
    const [rs, plist] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    const P = L.hobj(plist); if (!P[id]) return L.fail(res, 403, 'member');
    // tezkor oʻyin: avtomatik boshlash
    if (room.quick && room.status === 'lobby') {
      const n = Object.keys(P).length, age = now - room.created;
      if ((n >= 2 && age >= Q_FILL) || n >= MAXP || (n === 1 && age >= Q_SOLO)) await startRoom(C, room, P, now, 4000);
    }
    const cmds = [];
    if (room.status === 'race' && now >= room.startAt) {
      const p = b.p, x = b.x, c = b.c;
      if (!L.isNum(p, 0, 1.05) || !L.isNum(x, -2.5, 2.5) || !L.isInt(c, 0, 40)) return L.fail(res, 400, 'values');
      cmds.push(['HSET', 'rs:' + C, id, JSON.stringify({ p: Math.round(p * 10000) / 10000, x: Math.round(x * 100) / 100, c, t: now })], ['EXPIRE', 'rs:' + C, TTL]);
      if (b.fin === true && p >= 0.995 && now - room.startAt >= 50000) cmds.push(['HSETNX', 'rf:' + C, id, now], ['EXPIRE', 'rf:' + C, TTL]);
    }
    const finIdx = cmds.findIndex(c => c[0] === 'HSETNX');
    cmds.push(['HGETALL', 'rs:' + C], ['HGETALL', 'rf:' + C], ['HGETALL', 'rd:' + C]);
    const out = await L.redis(cmds);
    let F = out[out.length - 2], D = out[out.length - 1];
    if (finIdx >= 0 && Number(out[finIdx]) === 1) {
      // yangi marra: reyting, tajriba (XP), haftalik ochko
      const fins = L.hobj(F); const order = Object.keys(fins).sort((x, y) => Number(fins[x]) - Number(fins[y]));
      const place = order.indexOf(id) + 1, total = Object.keys(room.r || P).length;
      const st = parse(L.hobj(out[out.length - 3])[id]) || { c: 0 };
      const xp = 40 + (st.c || 0) * 10 + (place === 1 ? 60 : place === 2 ? 30 : 10);
      const up = [['HINCRBY', 'ac:' + id, 'xp', xp], ['HINCRBY', 'ac:' + id, 'games', 1]];
      if (place === 1 && total >= 2) up.push(['HINCRBY', 'ac:' + id, 'wins', 1]);
      if (room.ranked) {
        const done = new Set(order.filter(q => q !== id));
        const d = eloPairs(room, id, done);
        for (const [pid, ch] of Object.entries(d)) up.push(['HINCRBY', 'ac:' + pid, 'rating', ch], ['ZINCRBY', 'lb:elo', ch, pid], ['HINCRBY', 'rd:' + C, pid, ch]);
        if (!d[id]) up.push(['HINCRBY', 'rd:' + C, id, 0]);
        up.push(['EXPIRE', 'rd:' + C, TTL]);
        const wk = L.weekKey(now), pts = Math.min(1500, (st.c || 0) * 100 + [300, 200, 120, 80, 50, 30][place - 1]);
        up.push(['ZINCRBY', 'lb:w:' + wk, pts, id], ['EXPIRE', 'lb:w:' + wk, 32 * 86400]);
      }
      up.push(['HGETALL', 'rd:' + C]);
      const o2 = await L.redis(up); D = o2[o2.length - 1];
    }
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, P, out[out.length - 3], F, D) });
  }

  // qolgan amallar: akkaunt toʻliq tekshiriladi
  const a = await L.auth(b); if (!a) return L.fail(res, 401, 'auth');
  const id = a.id;

  if (b.op === 'create' || b.op === 'quick') {
    if (!L.TRACKS.includes(b.track) || !L.SUBJECTS.includes(b.subject) || !L.GRADES.includes(b.level)) return L.fail(res, 400, 'params');
    if (!(await L.rateLimit('rc:' + id, 40, 3600))) return L.fail(res, 429, 'limit');
    if (b.op === 'quick') {
      const qk = b.subject + ':' + band(b.level);
      const [qc] = await L.redis([['GET', 'mq:' + qk]]);
      if (typeof qc === 'string' && CODE_RE.test(qc)) {
        const [rs, plist] = await L.redis([['GET', 'room:' + qc], ['HGETALL', 'rp:' + qc]]);
        const room = parse(rs), P = L.hobj(plist);
        if (room && room.quick && room.status === 'lobby' && now - room.created < Q_SOLO - 1500 && (P[id] || Object.keys(P).length < MAXP)) {
          P[id] = P[id] || pinfo(a, car, now);
          await L.redis([['HSET', 'rp:' + qc, id, P[id]], ['EXPIRE', 'rp:' + qc, TTL]]);
          return L.send(res, 200, { ok: true, code: qc, now, room: view(room, P, {}, {}) });
        }
      }
      const made = await newRoom(a, b, now, car, true); if (!made) return L.fail(res, 503, 'busy');
      made.room.qk = qk; await L.redis([['SET', 'room:' + made.code, JSON.stringify(made.room), 'EX', TTL], ['SET', 'mq:' + qk, made.code, 'EX', 30]]);
      return L.send(res, 200, { ok: true, code: made.code, now, room: view(made.room, { [id]: pinfo(a, car, now) }, {}, {}) });
    }
    const made = await newRoom(a, b, now, car, false); if (!made) return L.fail(res, 503, 'busy');
    return L.send(res, 200, { ok: true, code: made.code, now, room: view(made.room, { [id]: pinfo(a, car, now) }, {}, {}) });
  }

  if (typeof b.code !== 'string' || !CODE_RE.test(b.code)) return L.fail(res, 400, 'code');
  const C = b.code;
  if (b.op === 'join') {
    if (!(await L.rateLimit('rj:' + id, 60, 3600))) return L.fail(res, 429, 'limit');
    const [rs, plist] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    if (room.quick) return L.fail(res, 403, 'quick');
    const P = L.hobj(plist);
    if (!P[id]) { if (room.status !== 'lobby') return L.fail(res, 409, 'started'); if (Object.keys(P).length >= MAXP) return L.fail(res, 409, 'full'); }
    P[id] = pinfo(a, car, P[id] ? (parse(P[id]) || {}).j || now : now);
    await L.redis([['HSET', 'rp:' + C, id, P[id]], ['EXPIRE', 'rp:' + C, TTL]]);
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, P, {}, {}) });
  }
  if (b.op === 'start') {
    const [rs, plist] = await L.redis([['GET', 'room:' + C], ['HGETALL', 'rp:' + C]]);
    const room = parse(rs); if (!room) return L.fail(res, 404, 'room');
    if (room.quick) return L.fail(res, 403, 'quick');
    if (room.host !== id) return L.fail(res, 403, 'host');
    if (room.status !== 'lobby') return L.fail(res, 409, 'started');
    const P = L.hobj(plist);
    if (Object.keys(P).length < 2) return L.fail(res, 409, 'players');
    if (!(await startRoom(C, room, P, now, 5000))) return L.fail(res, 409, 'started');
    return L.send(res, 200, { ok: true, code: C, now, room: view(room, P, {}, {}) });
  }
  if (b.op === 'leave') {
    const [rs] = await L.redis([['GET', 'room:' + C]]);
    const room = parse(rs);
    const cmds = [['HDEL', 'rp:' + C, id], ['HDEL', 'rs:' + C, id]]; // poyga paytida chiqqan oʻyinchi Elo boʻyicha marraga yetmagan hisoblanadi (room.r)
    if (room && room.host === id && room.status === 'lobby' && !room.quick) { room.status = 'closed'; cmds.push(['SET', 'room:' + C, JSON.stringify(room), 'EX', 600]); }
    await L.redis(cmds);
    return L.send(res, 200, { ok: true });
  }
  L.fail(res, 400, 'op');
});
