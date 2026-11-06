'use strict';
const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  if (!L.guard(req, res, ['GET'])) return;
  L.send(res, 200, { ok: true, now: Date.now(), regions: L.REGIONS }, 'public, max-age=0, s-maxage=60');
});
