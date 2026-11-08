'use strict';
// Poyga natijasini serverda tekshirib, reytingga yozish (aldashga qarshi: server vaqti, bir martalik raceId, chegaralar)
const L = require('./_lib');
const MIN_TIME = 55, MAX_TIME = 900, MONTH = 32 * 86400;
module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST']); if (!b) return;
  const acct = await L.auth(b); if (!acct) return L.fail(res, 401, 'auth');
  const id = b.id, now = Date.now();
  if (b.op === 'start') {
    if (!['daily', 'normal'].includes(b.kind) || !L.TRACKS.includes(b.track)) return L.fail(res, 400, 'params');
    if (!(await L.rateLimit('rs:' + id, 60, 3600))) return L.fail(res, 429, 'limit');
    const rid = L.newId(16);
    await L.redis([['SET', 'race:' + rid, JSON.stringify({ id, kind: b.kind, track: b.track, t0: now, day: L.dayKey(now) }), 'EX', 1200]]);
    return L.send(res, 200, { ok: true, raceId: rid });
  }
  if (b.op === 'finish') {
    if (typeof b.raceId !== 'string' || !/^[a-z2-7]{16}$/.test(b.raceId)) return L.fail(res, 400, 'race');
    const { correct, total, time, place } = b;
    if (!L.isInt(total, 5, 40) || !L.isInt(correct, 0, total) || !L.isNum(time, MIN_TIME, MAX_TIME) || !L.isInt(place, 1, 6)) return L.fail(res, 400, 'values');
    const [raw] = await L.redis([['GETDEL', 'race:' + b.raceId]]);
    if (!raw) return L.fail(res, 409, 'race-used');
    let r; try { r = JSON.parse(raw); } catch (e) { return L.fail(res, 409, 'race'); }
    if (r.id !== id) return L.fail(res, 403, 'owner');
    const elapsed = (now - r.t0) / 1000;
    if (elapsed < MIN_TIME || time > elapsed + 3) return L.fail(res, 422, 'time');
    const player = acct;
    const pts = Math.min(4500, correct * 100 + [150, 100, 70, 40, 20, 10][place - 1] + Math.max(0, Math.round(300 - time)));
    const wk = L.weekKey(now), day = L.dayKey(now), reg = player.region;
    const xp = correct * 10 + (place === 1 ? 40 : 15);
    const cmds = [
      ['HINCRBY', 'ac:' + id, 'xp', xp], ['HINCRBY', 'ac:' + id, 'games', 1], ...(place === 1 ? [['HINCRBY', 'ac:' + id, 'wins', 1]] : []),
      ['ZINCRBY', 'lb:w:' + wk, pts, id], ['EXPIRE', 'lb:w:' + wk, MONTH],
      ['ZINCRBY', 'lb:wr:' + wk, pts, reg], ['EXPIRE', 'lb:wr:' + wk, MONTH],
      ['ZINCRBY', 'lb:wreg:' + wk + ':' + reg, pts, id], ['EXPIRE', 'lb:wreg:' + wk + ':' + reg, MONTH]
    ];
    const daily = r.kind === 'daily' && r.day === day;
    if (daily) cmds.push(['ZADD', 'lb:d:' + day, 'GT', pts, id], ['EXPIRE', 'lb:d:' + day, 4 * 86400]);
    const n = cmds.length;
    cmds.push(['ZREVRANK', 'lb:w:' + wk, id], ['ZCARD', 'lb:w:' + wk], ['ZREVRANK', 'lb:wreg:' + wk + ':' + reg, id], ['ZREVRANK', 'lb:wr:' + wk, reg]);
    if (daily) cmds.push(['ZREVRANK', 'lb:d:' + day, id], ['ZCARD', 'lb:d:' + day]);
    const out = await L.redis(cmds);
    const rank = v => (v === null || v === undefined) ? null : Number(v) + 1;
    return L.send(res, 200, { ok: true, points: pts, xp, region: reg,
      week: { rank: rank(out[n]), total: Number(out[n + 1]) }, inRegion: rank(out[n + 2]), regionPos: rank(out[n + 3]),
      day: daily ? { rank: rank(out[n + 4]), total: Number(out[n + 5]) } : null });
  }
  L.fail(res, 400, 'op');
});
