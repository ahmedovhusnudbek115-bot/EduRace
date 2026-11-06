/* Edu Race — server umumiy kutubxonasi (Vercel Node funksiyalari).
   Xavfsizlik: HMAC token, qatʼiy validatsiya, soʻrovlar cheklovi, bir xil domen (Origin) tekshiruvi, IP faqat xeshlangan holda. */
'use strict';
const crypto = require('crypto');

const DB_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const SECRET = process.env.EDURACE_SECRET || crypto.createHash('sha256').update('edurace-v3|' + DB_TOKEN).digest('hex');

/* ---------- Redis (Upstash REST pipeline) ---------- */
async function redis(cmds) {
  if (global.__MEMREDIS) return global.__MEMREDIS.pipeline(cmds);
  if (!DB_URL || !DB_TOKEN) { const e = new Error('NO_DB'); e.code = 503; throw e; }
  const r = await fetch(DB_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds.map(c => c.map(String)))
  });
  if (!r.ok) { const e = new Error('DB_HTTP_' + r.status); e.code = 503; throw e; }
  const out = await r.json();
  return out.map(x => { if (x && x.error) { const e = new Error('DB: ' + x.error); e.code = 503; throw e; } return x ? x.result : null; });
}

/* ---------- javob ---------- */
function send(res, code, obj, cache) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(obj));
}
const fail = (res, code, msg) => send(res, code, { ok: false, error: msg });

/* ---------- soʻrov himoyasi ---------- */
function guard(req, res, methods) {
  if (!methods.includes(req.method)) { fail(res, 405, 'method'); return null; }
  const origin = req.headers.origin;
  if (origin) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    let oh = ''; try { oh = new URL(origin).host; } catch (e) { oh = '#'; }
    if (oh !== host) { fail(res, 403, 'origin'); return null; }
  }
  if (req.method === 'POST') {
    const ct = String(req.headers['content-type'] || '');
    if (!ct.includes('application/json')) { fail(res, 415, 'content-type'); return null; }
    let b = req.body;
    if (typeof b === 'string') { if (b.length > 2048) { fail(res, 413, 'size'); return null; } try { b = JSON.parse(b); } catch (e) { fail(res, 400, 'json'); return null; } }
    if (!b || typeof b !== 'object' || Array.isArray(b)) { fail(res, 400, 'body'); return null; }
    if (JSON.stringify(b).length > 2048) { fail(res, 413, 'size'); return null; }
    return b;
  }
  return {};
}
function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || '0';
  return crypto.createHash('sha256').update(SECRET + '|ip|' + ip).digest('hex').slice(0, 16);
}
// Soʻrovlar cheklovi: oynada `limit` tadan oshsa — rad etiladi
async function rateLimit(key, limit, windowSec) {
  const k = 'rl:' + key;
  const r = await redis([['SET', k, '0', 'EX', windowSec, 'NX'], ['INCR', k]]);
  return Number(r[1]) <= limit;
}

/* ---------- identifikatsiya ---------- */
const ID_RE = /^[a-z2-7]{12}$/;
function newId(n) { const al = 'abcdefghijklmnopqrstuvwxyz234567'; const b = crypto.randomBytes(n || 12); let s = ''; for (const x of b) s += al[x & 31]; return s; }
function tokenFor(id) { return crypto.createHmac('sha256', SECRET).update('player|' + id).digest('hex').slice(0, 40); }
function verify(id, token) {
  if (typeof id !== 'string' || !ID_RE.test(id) || typeof token !== 'string' || !/^[0-9a-f]{40}$/.test(token)) return false;
  const a = Buffer.from(tokenFor(id)), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- validatsiya ---------- */
const REGIONS = { tsh: 'Toshkent shahri', tsv: 'Toshkent viloyati', and: 'Andijon', bux: 'Buxoro', fer: 'Fargʻona', jiz: 'Jizzax', xor: 'Xorazm', nam: 'Namangan', nav: 'Navoiy', qash: 'Qashqadaryo', qq: 'Qoraqalpogʻiston', sam: 'Samarqand', sir: 'Sirdaryo', sur: 'Surxondaryo' };
const TRACKS = ['toshkent', 'samarqand', 'chorvoq', 'buxoro'];
const SUBJECTS = ['math', 'eng', 'rus', 'fiz', 'kim', 'tarix', 'geo', 'mix'];
const CARS = ['ilm1', 'chaqmoq', 'burgut', 'zumrad', 'kometa', 'oq'];
const BAD = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
const PROFANITY = ['jalab', 'qotoq', 'dalbayob', 'haromi', 'sikay', 'sikish', 'sikib', 'onangni', 'хуй', 'пизд', 'бля', 'ебат', 'ебан', 'сука', 'мудак', 'пидор', 'гандон', 'fuck', 'shit', 'bitch', 'dick', 'pidor', 'blyat', 'suka', 'nigger', 'porn', 'sex'];
function cleanNick(s) {
  if (typeof s !== 'string') return null;
  let t = s.normalize('NFC').replace(BAD, '').replace(/\s+/g, ' ').trim();
  if (t.length < 3 || t.length > 16) return null;
  if (!/^[\p{L}\p{N} ʻʼ'‘’_.\-]+$/u.test(t)) return null;
  if ((t.match(/\p{N}/gu) || []).length > 4) return null;
  const flat = t.toLowerCase().replace(/[^\p{L}]/gu, '');
  if (PROFANITY.some(w => flat.includes(w))) return null;
  return t;
}
const isInt = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
const isNum = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/* ---------- vaqt (Toshkent, UTC+5) ---------- */
function tz(now) { return new Date((now || Date.now()) + 5 * 3600e3); }
function dayKey(now) { const d = tz(now); return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0'); }
function weekKey(now) {
  const d = tz(now); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  return t.getUTCFullYear() + 'W' + String(wk).padStart(2, '0');
}

function pairs(arr) { const out = []; for (let i = 0; i + 1 < (arr || []).length; i += 2) out.push([arr[i], Number(arr[i + 1])]); return out; }
function hobj(arr) { if (arr && !Array.isArray(arr) && typeof arr === 'object') return arr; const o = {}; for (let i = 0; i + 1 < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1]; return o; }
function parsePlayer(v) { if (typeof v !== 'string') return null; const [nick, region] = v.split('\t'); return { nick: nick || '—', region: REGIONS[region] ? region : 'tsh' }; }

function wrap(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch (e) { if (!res.headersSent) fail(res, e.code === 503 ? 503 : 500, e.code === 503 ? 'db' : 'server'); }
  };
}

module.exports = { redis, send, fail, guard, ipHash, rateLimit, newId, tokenFor, verify, ID_RE, REGIONS, TRACKS, SUBJECTS, CARS, cleanNick, isInt, isNum, dayKey, weekKey, pairs, hobj, parsePlayer, wrap };
