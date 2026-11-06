'use strict';
// Onlayn profil: laqab + viloyat. Haqiqiy ism, telefon, email soʻralmaydi.
const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST']); if (!b) return;
  if (b.op === 'delete') { // foydalanuvchi oʻz onlayn maʼlumotlarini oʻchiradi
    if (!L.verify(b.id, b.token)) return L.fail(res, 401, 'auth');
    const [pl] = await L.redis([['HGET', 'pl', b.id]]); const p = L.parsePlayer(pl);
    const wk = L.weekKey(), day = L.dayKey();
    const cmds = [['HDEL', 'pl', b.id], ['ZREM', 'lb:w:' + wk, b.id], ['ZREM', 'lb:d:' + day, b.id]];
    if (p) cmds.push(['ZREM', 'lb:wreg:' + wk + ':' + p.region, b.id]);
    await L.redis(cmds);
    return L.send(res, 200, { ok: true, deleted: true });
  }
  if (!(await L.rateLimit('reg:' + L.ipHash(req), 20, 3600))) return L.fail(res, 429, 'limit');
  const nick = L.cleanNick(b.nick);
  if (!nick) return L.fail(res, 400, 'nick');
  if (typeof b.region !== 'string' || !L.REGIONS[b.region]) return L.fail(res, 400, 'region');
  let id;
  if (b.id !== undefined || b.token !== undefined) { if (!L.verify(b.id, b.token)) return L.fail(res, 401, 'auth'); id = b.id; }
  else id = L.newId(12);
  await L.redis([['HSET', 'pl', id, nick + '\t' + b.region]]);
  L.send(res, 200, { ok: true, id, token: L.tokenFor(id), nick, region: b.region });
});
