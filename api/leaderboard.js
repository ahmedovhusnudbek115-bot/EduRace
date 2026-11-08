'use strict';
// Reytinglar: Elo (umumiy), kunlik, haftalik, viloyat ichida, viloyatlar bellashuvi. Ochiq roʻyxatda ID koʻrsatilmaydi.
const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  if (!L.guard(req, res, ['GET'])) return;
  const q = new URL(req.url, 'http://x').searchParams;
  const type = q.get('type') || 'weekly', r = q.get('r') || '', me = q.get('me') || '';
  const now = Date.now(), wk = L.weekKey(now), day = L.dayKey(now);
  let key;
  if (type === 'weekly') key = 'lb:w:' + wk;
  else if (type === 'daily') key = 'lb:d:' + day;
  else if (type === 'region') { if (!L.REGIONS[r]) return L.fail(res, 400, 'region'); key = 'lb:wreg:' + wk + ':' + r; }
  else if (type === 'regions') key = 'lb:wr:' + wk;
  else if (type === 'rating') key = 'lb:elo';
  else return L.fail(res, 400, 'type');
  const withMe = me && L.ID_RE.test(me) && type !== 'regions';
  const cmds = [['ZREVRANGE', key, 0, type === 'regions' ? 13 : 49, 'WITHSCORES'], ['ZCARD', key]];
  if (withMe) cmds.push(['ZREVRANK', key, me], ['ZSCORE', key, me]);
  const out = await L.redis(cmds);
  const top = L.pairs(out[0]);
  let rows;
  if (type === 'regions') rows = top.filter(([reg]) => L.REGIONS[reg]).map(([reg, pts]) => ({ region: reg, name: L.REGIONS[reg], pts }));
  else {
    const info = top.length ? (await L.redis([['HMGET', 'pl', ...top.map(t => t[0])]]))[0] : [];
    rows = top.map(([, pts], i) => { const p = L.parsePlayer(info[i]) || { nick: '—', region: 'tsh' }; const row = { nick: p.nick, region: p.region, pts: Math.round(pts) }; if (type === 'rating') row.league = L.league(pts); return row; });
  }
  const body = { ok: true, type, period: type === 'daily' ? day : type === 'rating' ? 'all' : wk, total: Number(out[1]), rows };
  if (withMe) body.me = out[2] === null || out[2] === undefined ? null : { rank: Number(out[2]) + 1, pts: Number(out[3]) };
  L.send(res, 200, body, withMe ? 'no-store' : 'public, max-age=0, s-maxage=15, stale-while-revalidate=30');
});
