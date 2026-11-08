'use strict';
// Bulutda saqlash: progress (tangalar, mashinalar, yulduzlar, yutuqlar) akkauntga bogʻlanadi — istalgan qurilmadan davom etish.
// Mijoz yuklangan maʼlumotni qatʼiy sxema boʻyicha qayta tekshiradi; server faqat hajm va turini cheklaydi.
const L = require('./_lib');
const MAX = 6000;
module.exports = L.wrap(async (req, res) => {
  const b = L.guard(req, res, ['POST'], 8192); if (!b) return;
  const a = await L.auth(b, [['GET', 'sv:' + b.id]]);
  if (!a) return L.fail(res, 401, 'auth');
  if (b.op === 'get') {
    let data = null, ts = 0; try { const o = JSON.parse(a.extra[0] || 'null'); if (o && typeof o === 'object') { data = o.d; ts = o.ts; } } catch (e) {}
    return L.send(res, 200, { ok: true, data, ts });
  }
  if (b.op === 'put') {
    const d = b.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) return L.fail(res, 400, 'data');
    const json = JSON.stringify(d); if (json.length > MAX) return L.fail(res, 413, 'size');
    if (!(await L.rateLimit('sv:' + a.id, 120, 3600))) return L.fail(res, 429, 'limit');
    const ts = Date.now();
    await L.redis([['SET', 'sv:' + a.id, JSON.stringify({ d, ts })]]);
    return L.send(res, 200, { ok: true, ts });
  }
  L.fail(res, 400, 'op');
});
