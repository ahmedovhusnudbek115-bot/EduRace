'use strict';
// Akkauntlar: roʻyxatdan oʻtish, kirish, profil, parolni almashtirish, oʻchirish.
// Parollar scrypt bilan (tasodifiy tuz) xeshlanadi; kirish urinishlari IP va login boʻyicha cheklanadi. Email/telefon soʻralmaydi.
const L = require('./_lib');
const BOARDS = id => { const wk = L.weekKey(), day = L.dayKey(); return [['ZREM', 'lb:w:' + wk, id], ['ZREM', 'lb:d:' + day, id], ['ZREM', 'lb:elo', id]]; };

async function rankOf(id) { const [r] = await L.redis([['ZREVRANK', 'lb:elo', id]]); return r === null || r === undefined ? null : Number(r) + 1; }

module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST']); if (!b) return;
  const ip = L.ipHash(req), now = Date.now();

  if (b.op === 'register') {
    const u = L.cleanUser(b.username); if (!u) return L.fail(res, 400, 'username');
    const pw = L.cleanPw(b.password, u); if (!pw) return L.fail(res, 400, 'password');
    const nick = L.cleanNick(b.nick); if (!nick) return L.fail(res, 400, 'nick');
    if (typeof b.region !== 'string' || !L.REGIONS[b.region]) return L.fail(res, 400, 'region');
    if (!L.GRADES.includes(b.grade)) return L.fail(res, 400, 'grade');
    if (!(await L.rateLimit('reg:' + ip, 10, 3600))) return L.fail(res, 429, 'limit');
    const id = L.newId(12);
    const [ok] = await L.redis([['SET', 'un:' + u, id, 'NX']]);
    if (ok !== 'OK') return L.fail(res, 409, 'taken');
    const { salt, hash } = await L.hashPw(pw);
    await L.redis([
      ['HSET', 'ac:' + id, 'u', u, 'ph', hash, 'ps', salt, 'v', 0, 'nick', nick, 'region', b.region, 'grade', b.grade, 'rating', 1000, 'games', 0, 'wins', 0, 'xp', 0, 'created', now],
      ['HSET', 'pl', id, nick + '\t' + b.region], ['ZADD', 'lb:elo', 1000, id]
    ]);
    const a = { id, username: u, v: 0, nick, region: b.region, grade: b.grade, rating: 1000, games: 0, wins: 0, xp: 0 };
    return L.send(res, 200, { ok: true, id, token: L.tokenFor(id, 0), profile: L.profile(a, await rankOf(id)) });
  }

  if (b.op === 'login') {
    const u = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
    if (!/^[a-z0-9_]{3,20}$/.test(u) || typeof b.password !== 'string' || b.password.length > 64) return L.fail(res, 401, 'login');
    if (!(await L.rateLimit('li:' + ip, 30, 900)) || !(await L.rateLimit('lu:' + u, 10, 900))) return L.fail(res, 429, 'limit');
    const [id] = await L.redis([['GET', 'un:' + u]]);
    let rec = null;
    if (typeof id === 'string' && L.ID_RE.test(id)) rec = (await L.redis([['HMGET', 'ac:' + id, 'ph', 'ps', ...L.ACCT_F]]))[0];
    const good = await L.checkPw(b.password, rec && rec[1], rec && rec[0]);
    if (!good) return L.fail(res, 401, 'login');
    const a = L.acctObj(id, rec.slice(2)); if (!a) return L.fail(res, 401, 'login');
    return L.send(res, 200, { ok: true, id, token: L.tokenFor(id, a.v), profile: L.profile(a, await rankOf(id)) });
  }

  // quyidagi amallar uchun kirgan boʻlish shart
  const a = await L.auth(b, [['ZREVRANK', 'lb:elo', b.id]]);
  if (!a) return L.fail(res, 401, 'auth');
  const rank = a.extra[0] === null || a.extra[0] === undefined ? null : Number(a.extra[0]) + 1;

  if (b.op === 'me') return L.send(res, 200, { ok: true, profile: L.profile(a, rank) });

  if (b.op === 'update') {
    const nick = b.nick === undefined ? a.nick : L.cleanNick(b.nick); if (!nick) return L.fail(res, 400, 'nick');
    const region = b.region === undefined ? a.region : b.region; if (!L.REGIONS[region]) return L.fail(res, 400, 'region');
    const grade = b.grade === undefined ? a.grade : b.grade; if (!L.GRADES.includes(grade)) return L.fail(res, 400, 'grade');
    if (!(await L.rateLimit('up:' + a.id, 30, 3600))) return L.fail(res, 429, 'limit');
    await L.redis([['HSET', 'ac:' + a.id, 'nick', nick, 'region', region, 'grade', grade], ['HSET', 'pl', a.id, nick + '\t' + region]]);
    Object.assign(a, { nick, region, grade });
    return L.send(res, 200, { ok: true, profile: L.profile(a, rank) });
  }

  if (b.op === 'password' || b.op === 'delete') {
    if (!(await L.rateLimit('pw:' + a.id, 10, 900))) return L.fail(res, 429, 'limit');
    const [rec] = await L.redis([['HMGET', 'ac:' + a.id, 'ph', 'ps']]);
    if (typeof b.password !== 'string' || b.password.length > 64 || !(await L.checkPw(b.password, rec[1], rec[0]))) return L.fail(res, 403, 'password');
    if (b.op === 'password') {
      const pw = L.cleanPw(b.newPassword, a.username); if (!pw) return L.fail(res, 400, 'newpassword');
      const { salt, hash } = await L.hashPw(pw); const v = a.v + 1;
      await L.redis([['HSET', 'ac:' + a.id, 'ph', hash, 'ps', salt, 'v', v]]);
      return L.send(res, 200, { ok: true, token: L.tokenFor(a.id, v) });
    }
    const cmds = [['DEL', 'ac:' + a.id], ['DEL', 'un:' + a.username], ['DEL', 'sv:' + a.id], ['HDEL', 'pl', a.id], ['ZREM', 'lb:wreg:' + L.weekKey() + ':' + a.region, a.id], ...BOARDS(a.id)];
    await L.redis(cmds);
    return L.send(res, 200, { ok: true, deleted: true });
  }
  L.fail(res, 400, 'op');
});
