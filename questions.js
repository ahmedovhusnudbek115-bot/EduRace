/* Edu Race — savollar moduli.
   Xavfsizlik: tashqi maʼlumot (oʻqituvchi testi) qatʼiy tekshiriladi; matnlar faqat textContent / canvas orqali chiqariladi. */
'use strict';
const EduQ = (() => {
  /* ---------- tasodifiy sonlar (kunlik musobaqa uchun seed bilan) ---------- */
  let R = Math.random;
  function seed(n) { let a = n >>> 0; R = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function unseed() { R = Math.random; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const rnd = (a, b) => Math.floor(R() * (b - a + 1)) + a;
  const pick = a => a[Math.floor(R() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;

  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = n => String(n).split('').map(c => SUP[c] || c).join('');
  const xpow = n => n === 1 ? 'x' : 'x' + sup(n);
  const neg = n => n < 0 ? '−' + Math.abs(n) : String(n);
  function mk(q, correct, wrongs, sub) {
    correct = String(correct);
    const w = []; for (const x of wrongs) { const s = String(x); if (s !== correct && !w.includes(s)) w.push(s); if (w.length === 2) break; }
    const opts = shuffle([correct, ...w]);
    return { q, opts, ans: opts.indexOf(correct), correct, sub };
  }
  function nw(ans, cands) {
    const out = []; for (const c of shuffle(cands.slice())) { if (c !== ans && !out.includes(c) && Number.isFinite(c) && (c >= 0 || ans < 0)) out.push(c); if (out.length === 2) break; }
    let k = 1; while (out.length < 2) { const c = ans + k; if (!out.includes(c) && c !== ans) out.push(c); k = k > 0 ? -k : -k + 1; }
    return out.map(neg);
  }

  /* ---------- Matematika (avtomatik) ---------- */
  function mathQ(level) {
    const S = 'Matematika';
    if (level === 1) {
      const t = rnd(0, 3);
      if (t === 0) { const a = rnd(5, 60), b = rnd(3, 39), r = a + b; return mk(`${a} + ${b} = ?`, r, nw(r, [r + 1, r - 1, r + 10, r - 10, r + 2]), S); }
      if (t === 1) { const a = rnd(20, 99), b = rnd(3, a - 2), r = a - b; return mk(`${a} − ${b} = ?`, r, nw(r, [r + 1, r - 1, r + 10, r - 10, r + 2]), S); }
      if (t === 2) { const a = rnd(2, 10), b = rnd(2, 10), r = a * b; return mk(`${a} × ${b} = ?`, r, nw(r, [r + a, r - a, r + b, r - b, r + 1]), S); }
      const b = rnd(2, 10), q = rnd(2, 10); return mk(`${b * q} : ${b} = ?`, q, nw(q, [q + 1, q - 1, q + 2, q - 2]), S);
    }
    if (level === 2) {
      const t = rnd(0, 7);
      if (t === 0) { const a = rnd(12, 29), b = rnd(3, 9), r = a * b; return mk(`${a} × ${b} = ?`, r, nw(r, [r + b, r - b, r + 10, r - 10, r + a]), S); }
      if (t === 1) { const p = pick([10, 20, 25, 50]); const n = p === 25 ? rnd(2, 30) * 4 : p === 50 ? rnd(5, 60) * 2 : rnd(2, 30) * 10; const r = n * p / 100; return mk(`${n} ning ${p}% i = ?`, r, nw(r, [r * 2, Math.round(r / 2), r + 10, r + 5, r - 5]), S); }
      if (t === 2) { const a = -rnd(2, 20), b = rnd(1, 30), r = a + b; return mk(`${neg(a)} + ${b} = ?`, neg(r), nw(r, [-r, r + 2, r - 2, r + 1]), S); }
      if (t === 3) { const x = rnd(3, 40), a = rnd(2, 30); return mk(`x + ${a} = ${x + a},  x = ?`, x, nw(x, [x + 1, x - 1, x + a, x + 2]), S); }
      if (t === 4) { const a = rnd(2, 9), x = rnd(2, 12); return mk(`${a}x = ${a * x},  x = ?`, x, nw(x, [x + 1, x - 1, a * x - a, x + 2]), S); }
      if (t === 5) { const n = rnd(11, 20), r = n * n; return mk(`${n}² = ?`, r, nw(r, [r + n, r - n, r + 10, 2 * n, r + 1]), S); }
      if (t === 6) { const b = pick([4, 6, 8, 10, 12]), a = rnd(1, b - 2), c = rnd(1, b - a - 1), s = a + c, g = gcd(s, b); return mk(`${a}/${b} + ${c}/${b} = ?`, `${s / g}/${b / g}`, [`${s}/${2 * b}`, `${s + 1}/${b}`, `${s - 1}/${b}`], S); }
      const b = rnd(11, 19), q = rnd(3, 9); return mk(`${b * q} : ${b} = ?`, q, nw(q, [q + 1, q - 1, q + 2]), S);
    }
    const t = rnd(0, 8);
    if (t === 0) { const n = rnd(5, 10), r = 2 ** n; return mk(`2${sup(n)} = ?`, r, nw(r, [r * 2, r / 2, 2 * n, r + 2]), S); }
    if (t === 1) { const n = rnd(11, 25); return mk(`√${n * n} = ?`, n, nw(n, [n + 1, n - 1, n + 2, n * 2]), S); }
    if (t === 2) { const a = rnd(2, 9), x = rnd(-9, 12), b = rnd(1, 20) * (R() < .5 ? -1 : 1), c = a * x + b; return mk(`${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${neg(c)},  x = ?`, neg(x), nw(x, [x + 1, x - 1, -x, x + 2]), S); }
    if (t === 3) { const T = pick([['sin 30°', '1/2', ['√3/2', '1']], ['cos 60°', '1/2', ['√2/2', '0']], ['sin 90°', '1', ['0', '1/2']], ['cos 0°', '1', ['0', '−1']], ['tg 45°', '1', ['0', '√3']], ['sin 60°', '√3/2', ['1/2', '√2/2']], ['cos 90°', '0', ['1', '1/2']], ['cos 45°', '√2/2', ['1/2', '√3/2']]]); return mk(`${T[0]} = ?`, T[1], T[2], S); }
    if (t === 4) { const base = pick([2, 3]), n = base === 2 ? rnd(2, 8) : rnd(2, 5), v = base ** n; return mk(`log${base === 2 ? '₂' : '₃'} ${v} = ?`, n, nw(n, [n + 1, n - 1, n * base, n + 2]), S); }
    if (t === 5) { const n = rnd(2, 6); return mk(`(${xpow(n)})′ = ?`, `${n}${xpow(n - 1)}`, [`${xpow(n - 1)}`, `${n}${xpow(n + 1)}`, `${n - 1}${xpow(n)}`], S); }
    if (t === 6) { const a = rnd(1, 20), d = rnd(2, 9); return mk(`${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, ?`, a + 4 * d, nw(a + 4 * d, [a + 5 * d, a + 4 * d + 1, a + 4 * d - 1, a + 3 * d + 1]), S); }
    if (t === 7) { const a = rnd(1, 5), q = pick([2, 3]), r = a * q ** 3; return mk(`${a}, ${a * q}, ${a * q * q}, ?`, r, nw(r, [r + a, r - a, a * q * q + a * q, r + q]), S); }
    const T = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]]);
    return mk(`Katetlar ${T[0]} va ${T[1]}. Gipotenuza = ?`, T[2], nw(T[2], [T[0] + T[1], T[2] + 1, T[2] - 1, T[2] + 2]), S);
  }

  /* ---------- Til soʻzlari: [oʻzbekcha, tarjima, daraja] ---------- */
  const EN = [
    ['olma', 'apple', 1], ['kitob', 'book', 1], ['it', 'dog', 1], ['mushuk', 'cat', 1], ['uy', 'house', 1], ['suv', 'water', 1], ['quyosh', 'sun', 1], ['qizil', 'red', 1], ['koʻk', 'blue', 1], ['yashil', 'green', 1], ['ona', 'mother', 1], ['ota', 'father', 1], ['maktab', 'school', 1], ['ruchka', 'pen', 1], ['non', 'bread', 1], ['sut', 'milk', 1], ['qush', 'bird', 1], ['baliq', 'fish', 1], ['katta', 'big', 1], ['kichik', 'small', 1], ['oy', 'moon', 1], ['gul', 'flower', 1], ['qor', 'snow', 1], ['koʻz', 'eye', 1],
    ['doʻst', 'friend', 2], ['shahar', 'city', 2], ['daraxt', 'tree', 2], ['deraza', 'window', 2], ['eshik', 'door', 2], ['oshxona', 'kitchen', 2], ['ob-havo', 'weather', 2], ['kuchli', 'strong', 2], ['tez', 'fast', 2], ['sekin', 'slow', 2], ['bahor', 'spring', 2], ['qish', 'winter', 2], ['yoz', 'summer', 2], ['kuz', 'autumn', 2], ['savol', 'question', 2], ['javob', 'answer', 2], ['sayohat', 'travel', 2], ['sogʻliq', 'health', 2], ['chiroyli', 'beautiful', 2], ['och', 'hungry', 2], ['kecha', 'yesterday', 2], ['ertaga', 'tomorrow', 2], ['bozor', 'market', 2], ['togʻ', 'mountain', 2],
    ['muhim', 'important', 3], ['imkoniyat', 'opportunity', 3], ['rivojlanish', 'development', 3], ['atrof-muhit', 'environment', 3], ['tajriba', 'experience', 3], ['qaror', 'decision', 3], ['muvaffaqiyat', 'success', 3], ['bilim', 'knowledge', 3], ['hamkorlik', 'cooperation', 3], ['masʼuliyat', 'responsibility', 3], ['jamiyat', 'society', 3], ['iqtisodiyot', 'economy', 3], ['hukumat', 'government', 3], ['tadqiqot', 'research', 3], ['kashfiyot', 'discovery', 3], ['mustaqillik', 'independence', 3], ['tenglama', 'equation', 3], ['taraqqiyot', 'progress', 3]
  ];
  const EN_GR = [
    ['I ___ a student.', 'am', ['is', 'are'], 2], ['They ___ football.', 'play', ['plays', 'playing'], 2], ['She ___ a cat.', 'has', ['have', 'having'], 2], ['We ___ at school yesterday.', 'were', ['was', 'are'], 2], ['He ___ English every day.', 'studies', ['study', 'studying'], 2], ['There ___ two cats.', 'are', ['is', 'am'], 2], ['___ you like tea?', 'Do', ['Does', 'Is'], 2],
    ['I have lived here ___ 2015.', 'since', ['for', 'from'], 3], ['This book is ___ than that one.', 'better', ['good', 'best'], 3], ['Listen! The baby ___.', 'is crying', ['cries', 'cried'], 3], ['She is the ___ in class.', 'tallest', ['taller', 'tall'], 3], ['The letter ___ yesterday.', 'was sent', ['sent', 'is send'], 3], ['She has ___ finished it.', 'already', ['yet', 'ago'], 3]
  ];
  const RU = [
    ['olma', 'яблоко', 1], ['kitob', 'книга', 1], ['it', 'собака', 1], ['mushuk', 'кошка', 1], ['uy', 'дом', 1], ['suv', 'вода', 1], ['non', 'хлеб', 1], ['maktab', 'школа', 1], ['ona', 'мама', 1], ['ota', 'папа', 1], ['qizil', 'красный', 1], ['katta', 'большой', 1], ['kichik', 'маленький', 1], ['quyosh', 'солнце', 1], ['gul', 'цветок', 1], ['sut', 'молоко', 1],
    ['doʻst', 'друг', 2], ['shahar', 'город', 2], ['daraxt', 'дерево', 2], ['deraza', 'окно', 2], ['eshik', 'дверь', 2], ['oʻqituvchi', 'учитель', 2], ['savol', 'вопрос', 2], ['javob', 'ответ', 2], ['tez', 'быстро', 2], ['sekin', 'медленно', 2], ['bugun', 'сегодня', 2], ['ertaga', 'завтра', 2], ['kecha', 'вчера', 2], ['qish', 'зима', 2], ['yoz', 'лето', 2], ['bahor', 'весна', 2], ['kuz', 'осень', 2],
    ['muhim', 'важный', 3], ['bilim', 'знание', 3], ['tajriba', 'опыт', 3], ['qaror', 'решение', 3], ['muvaffaqiyat', 'успех', 3], ['jamiyat', 'общество', 3], ['mustaqillik', 'независимость', 3], ['imkoniyat', 'возможность', 3], ['masʼuliyat', 'ответственность', 3], ['rivojlanish', 'развитие', 3]
  ];
  const RU_GR = [
    ['Я ___ в школу.', 'иду', ['идёт', 'идут'], 2], ['Он ___ книгу.', 'читает', ['читаю', 'читают'], 2], ['Мы ___ футбол.', 'любим', ['люблю', 'любит'], 2], ['Это ___ книга.', 'моя', ['мой', 'моё'], 2], ['Это ___ дом.', 'мой', ['моя', 'мои'], 2],
    ['Я живу в ___ (Ташкент).', 'Ташкенте', ['Ташкент', 'Ташкента'], 3], ['У меня нет ___ (время).', 'времени', ['время', 'временем'], 3], ['Вчера я ___ в кино.', 'ходил', ['хожу', 'пойду'], 3]
  ];

  /* ---------- Matematika: sinf boʻyicha mavzular (darslik tartibida) ---------- */
  function mathG(g) {
    const S = 'Matematika';
    if (g <= 4) return mathQ(1);
    const t = rnd(0, 5);
    if (g === 5) {
      if (t === 0) { const a = rnd(12, 99), b = rnd(3, 9), r = a * b; return mk(`${a} × ${b} = ?`, r, nw(r, [r + b, r - b, r + 10, r - 10]), S); }
      if (t === 1) { const a = rnd(11, 89), b = rnd(11, 89); return mk(`${(a / 10).toFixed(1).replace('.', ',')} + ${(b / 10).toFixed(1).replace('.', ',')} = ?`, ((a + b) / 10).toFixed(1).replace('.', ','), [((a + b + 1) / 10).toFixed(1).replace('.', ','), ((a + b - 10) / 10).toFixed(1).replace('.', ','), String(a + b)], S); }
      if (t === 2) { const a = rnd(3, 15), b = rnd(2, 12); return mk(`Toʻgʻri toʻrtburchak: ${a} va ${b} sm. Perimetri?`, `${2 * (a + b)} sm`, [`${a * b} sm`, `${a + b} sm`, `${2 * (a + b) + 2} sm`], S); }
      if (t === 3) { const a = rnd(3, 15), b = rnd(2, 12); return mk(`Toʻgʻri toʻrtburchak: ${a} va ${b} sm. Yuzi?`, `${a * b} sm²`, [`${2 * (a + b)} sm²`, `${a + b} sm²`, `${a * b + a} sm²`], S); }
      if (t === 4) { const d = pick([3, 9]); const n = rnd(10, 99) * d + (R() < .5 ? 0 : 1); const ok = n % d === 0; return mk(`${n} soni ${d} ga qoldiqsiz boʻlinadimi?`, ok ? 'Ha' : 'Yoʻq', [ok ? 'Yoʻq' : 'Ha', 'Faqat 2 ga'], S); }
      const b = pick([5, 7, 8, 9]), a = rnd(1, b - 2), c = rnd(1, b - a - 1); return mk(`${a}/${b} + ${c}/${b} = ?`, `${a + c}/${b}`, [`${a + c}/${2 * b}`, `${a + c + 1}/${b}`, `${a * c}/${b}`], S);
    }
    if (g === 6) {
      if (t === 0) { const k = rnd(2, 9), a = k * rnd(2, 7), b = k * rnd(2, 7); const r = gcd(a, b); return mk(`EKUB(${a}; ${b}) = ?`, r, nw(r, [r * 2, Math.max(1, r / 2 | 0), a, b]), S); }
      if (t === 1) { const a = pick([4, 6, 8, 9, 10, 12]), b = pick([3, 5, 6, 8, 15]); if (a === b) return mathG(6); const r = a * b / gcd(a, b); return mk(`EKUK(${a}; ${b}) = ?`, r, nw(r, [a * b, r / 2 | 0, r + a]), S); }
      if (t === 2) { const k = rnd(2, 6), a = rnd(1, 6), b = rnd(a + 1, 9); const g2 = gcd(a, b); return mk(`${a * k}/${b * k} ni qisqartiring`, `${a / g2}/${b / g2}`, [`${a * k}/${b}`, `${a}/${b * k}`, `${a + 1}/${b}`], S); }
      if (t === 3) { const p = pick([10, 20, 25, 50]); const n = p === 25 ? rnd(2, 30) * 4 : p === 50 ? rnd(5, 60) * 2 : rnd(2, 30) * 10; const r = n * p / 100; return mk(`${n} ning ${p}% i = ?`, r, nw(r, [r * 2, Math.round(r / 2), r + 10, r + 5]), S); }
      if (t === 4) { const a = -rnd(2, 20), b = rnd(1, 30), r = a + b; return mk(`${neg(a)} + ${b} = ?`, neg(r), nw(r, [-r, r + 2, r - 2, r + 1]), S); }
      const a = rnd(2, 6), b = rnd(2, 9), k = rnd(2, 5); return mk(`x : ${a} = ${b * k} : ${b},  x = ?`, a * k, nw(a * k, [a * k + 1, b * k, a + k]), S);
    }
    if (g === 7) {
      if (t === 0) { const n = rnd(3, 10), r = 2 ** n; return mk(`2${sup(n)} = ?`, r, nw(r, [r * 2, r / 2, 2 * n]), S); }
      if (t === 1) { const m = rnd(2, 6), n = rnd(2, 6); return mk(`a${sup(m)} · a${sup(n)} = ?`, `a${sup(m + n)}`, [`a${sup(m * n)}`, `a${sup(Math.abs(m - n) || 1)}`, `2a${sup(m + n)}`], S); }
      if (t === 2) { const a = rnd(2, 9), x = rnd(-9, 12), b = rnd(1, 20) * (R() < .5 ? -1 : 1), c = a * x + b; return mk(`${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${neg(c)},  x = ?`, neg(x), nw(x, [x + 1, x - 1, -x]), S); }
      if (t === 3) { const a = rnd(2, 9), b = rnd(2, 9); return mk(`${a}x + ${b}x = ?`, `${a + b}x`, [`${a * b}x`, `${a + b}x²`, `${a + b}`], S); }
      if (t === 4) { const a = rnd(20, 160); return mk(`Qoʻshni burchaklardan biri ${a}°. Ikkinchisi?`, `${180 - a}°`, [`${90 - a > 0 ? 90 - a : 360 - a}°`, `${a}°`, `${180 - a + 10}°`], S); }
      const a = rnd(30, 80), b = rnd(30, 80); return mk(`Uchburchakda ikki burchak ${a}° va ${b}°. Uchinchisi?`, `${180 - a - b}°`, [`${360 - a - b}°`, `${180 - a - b + 10}°`, `${Math.abs(a - b) || 5}°`], S);
    }
    if (g === 8) {
      if (t === 0) { const n = rnd(4, 25); return mk(`√${n * n} = ?`, n, nw(n, [n + 1, n - 1, n * 2]), S); }
      if (t === 1) { const T = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]); return mk(`Katetlar ${T[0]} va ${T[1]}. Gipotenuza = ?`, T[2], nw(T[2], [T[0] + T[1], T[2] + 1, T[2] - 1]), S); }
      if (t === 2) { const x1 = rnd(1, 9), x2 = rnd(1, 9); const b = -(x1 + x2), c = x1 * x2; return mk(`x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x + ${c} = 0. Ildizlar yigʻindisi?`, x1 + x2, nw(x1 + x2, [c, -(x1 + x2), x1 + x2 + 1]), S); }
      if (t === 3) { const n = rnd(2, 12); return mk(`x² = ${n * n},  x = ?`, `±${n}`, [`${n}`, `${n * 2}`, `±${n * n}`], S); }
      if (t === 4) { const a = rnd(2, 6), k = rnd(1, 9); return mk(`${a}x > ${a * k}`, `x > ${k}`, [`x < ${k}`, `x > ${a * k}`, `x > ${k + a}`], S); }
      const a = rnd(3, 12), b = rnd(2, 9); return mk(`Parallelogramm: asos ${a}, balandlik ${b}. Yuzi?`, a * b, nw(a * b, [2 * (a + b), a * b / 2 | 0, a + b]), S);
    }
    if (g === 9) {
      if (t === 0) { const a = rnd(1, 20), d = rnd(2, 9); return mk(`${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, ?`, a + 4 * d, nw(a + 4 * d, [a + 5 * d, a + 4 * d + 1, a + 3 * d + 1]), S); }
      if (t === 1) { const a = rnd(1, 5), q = pick([2, 3]), r = a * q ** 3; return mk(`${a}, ${a * q}, ${a * q * q}, ?`, r, nw(r, [r + a, r - a, a * q * q + a * q]), S); }
      if (t === 2) { const T = pick([['sin 30°', '1/2', ['√3/2', '1']], ['cos 60°', '1/2', ['√2/2', '0']], ['sin 90°', '1', ['0', '1/2']], ['cos 0°', '1', ['0', '−1']], ['tg 45°', '1', ['0', '√3']], ['sin 60°', '√3/2', ['1/2', '√2/2']]]); return mk(`${T[0]} = ?`, T[1], T[2], S); }
      if (t === 3) { const a = pick([1, 2, -1]), x0 = rnd(-5, 5), b = -2 * a * x0; return mk(`y = ${a === 1 ? '' : a === -1 ? '−' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x  uchining abssissasi?`, neg(x0), nw(x0, [-x0, x0 + 1, x0 - 1, b]), S); }
      if (t === 4) { const r = rnd(2, 9); return mk(`Radiusi ${r} boʻlgan aylana uzunligi?`, `${2 * r}π`, [`${r * r}π`, `${r}π`, `${4 * r}π`], S); }
      const n = rnd(5, 12), a = rnd(1, 6), d = rnd(1, 5); return mk(`a₁ = ${a}, d = ${d}. a${String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('')} = ?`, a + (n - 1) * d, nw(a + (n - 1) * d, [a + n * d, a * n, a + (n - 2) * d]), S);
    }
    if (g === 10) {
      if (t === 0) { const base = pick([2, 3]), n = base === 2 ? rnd(2, 8) : rnd(2, 5), v = base ** n; return mk(`log${base === 2 ? '₂' : '₃'} ${v} = ?`, n, nw(n, [n + 1, n - 1, n * base]), S); }
      if (t === 1) { const n = rnd(2, 7), v = 2 ** n; return mk(`2ˣ = ${v},  x = ?`, n, nw(n, [n + 1, n - 1, v / 2]), S); }
      if (t === 2) { return mk(`lg 1000 = ?`, 3, nw(3, [2, 4, 10]), S); }
      if (t === 3) { const T = pick([['sin 180°', '0', ['1', '−1']], ['cos 180°', '−1', ['0', '1']], ['sin 270°', '−1', ['1', '0']], ['tg 0°', '0', ['1', '∞']], ['cos 90°', '0', ['1', '−1']]]); return mk(`${T[0]} = ?`, T[1], T[2], S); }
      if (t === 4) { const d = pick([30, 45, 60, 90, 180]); const m = { 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 180: 'π' }; return mk(`${d}° radianda?`, m[d], Object.values(m).filter(x => x !== m[d]), S); }
      const a = rnd(2, 5), m = rnd(2, 4), n = rnd(2, 4); return mk(`(${a}${sup(m)})${sup(n)} = ${a}^?`, m * n, nw(m * n, [m + n, m * n + 1, m]), S);
    }
    if (t === 0) { const n = rnd(2, 6); return mk(`(${xpow(n)})′ = ?`, `${n}${xpow(n - 1)}`, [`${xpow(n - 1)}`, `${n}${xpow(n + 1)}`, `${n - 1}${xpow(n)}`], S); }
    if (t === 1) { const a = rnd(2, 9), b = rnd(1, 9); return mk(`(${a}x + ${b})′ = ?`, a, nw(a, [b, a + b, a * b]), S); }
    if (t === 2) { const n = rnd(1, 4); return mk(`∫ ${n + 1 === 1 ? '' : n + 1}${xpow(n)} dx = ?`, `${xpow(n + 1)} + C`, [`${n + 1}${xpow(n + 1)} + C`, `${xpow(n)} + C`, `${n}${xpow(n - 1) === 'x⁰' ? '' : xpow(n - 1)} + C`], S); }
    if (t === 3) { const k = rnd(1, 3); return mk(`Oʻyin soqqasi tashlandi. ${k === 1 ? '6' : k === 2 ? 'juft son' : '5 dan katta son'} tushish ehtimoli?`, k === 1 ? '1/6' : k === 2 ? '1/2' : '1/6', k === 2 ? ['1/6', '1/3'] : ['1/2', '1/3'], S); }
    if (t === 4) { const n = rnd(3, 6); const f = [1, 1, 2, 6, 24, 120, 720][n]; return mk(`${n}! = ?`, f, nw(f, [f / n, f + n, n * n]), S); }
    const a = rnd(2, 5); return mk(`(${a}eˣ)′ = ?`, `${a}eˣ`, [`eˣ`, `${a}xeˣ⁻¹`, `${a}`], S);
  }

  const SUBJECTS = [
    { id: 'math', ic: '🔢', name: 'Matematika', hint: 'Algebra, geometriya', min: 4 },
    { id: 'ona', ic: '📖', name: 'Ona tili', hint: 'Ona tili va adabiyot', min: 4 },
    { id: 'eng', ic: '🇬🇧', name: 'Ingliz tili', hint: 'Soʻz, grammatika', min: 4 },
    { id: 'rus', ic: '🇷🇺', name: 'Rus tili', hint: 'Soʻz, grammatika', min: 4 },
    { id: 'bio', ic: '🧬', name: 'Biologiya', hint: 'Botanika, odam', min: 4 },
    { id: 'fiz', ic: '⚡', name: 'Fizika', hint: '6-sinfdan', min: 6 },
    { id: 'kim', ic: '🧪', name: 'Kimyo', hint: '7-sinfdan', min: 7 },
    { id: 'tarix', ic: '🏛️', name: 'Tarix', hint: 'Oʻzbekiston va jahon', min: 4 },
    { id: 'geo', ic: '🌍', name: 'Geografiya', hint: 'Materik, Oʻzbekiston', min: 4 },
    { id: 'inf', ic: '💻', name: 'Informatika', hint: '5-sinfdan', min: 5 },
    { id: 'mix', ic: '🎲', name: 'Aralash', hint: 'Hamma fanlar', min: 4 }
  ];
  const SUBJECT_IDS = SUBJECTS.map(s => s.id);
  const GRADES = [4, 5, 6, 7, 8, 9, 10, 11];
  const gradeName = g => g <= 4 ? '1–4-sinf' : g + '-sinf';
  const nameOf = id => (SUBJECTS.find(s => s.id === id) || SUBJECTS[0]).name;
  const available = (id, g) => { const s = SUBJECTS.find(x => x.id === id); return !!s && g >= s.min; };

  let bags = {};
  function resetBags() { bags = {}; }
  function fromBag(key, items) { if (!bags[key] || !bags[key].length) bags[key] = shuffle(items.slice()); return bags[key].pop(); }
  // Sinf uchun savollar: shu va oldingi sinf mavzulari; kam boʻlsa — oldingi barcha sinflar
  function poolG(list, g) {
    const min = Math.min(...list.map(x => x[0])); const gg = Math.max(g, min);
    let p = list.filter(x => x[0] === gg || x[0] === gg - 1);
    if (p.length < 8) p = list.filter(x => x[0] <= gg);
    if (p.length < 8) p = list.filter(x => x[0] <= gg + 1);
    return p.length ? p : list;
  }
  const B = () => (typeof EduBank !== 'undefined' ? EduBank : {});
  function bankG(id, g, sub) { const list = B()[id] || []; if (!list.length) return mathQ(2); const it = fromBag(id + g, poolG(list, g)); return mk(it[1], it[2], [it[3], it[4]], sub); }
  function wordQ(key, words, gram, level, sub, langName) {
    if (level >= 2 && R() < 0.3) { const g = fromBag(key + 'g' + level, gram.filter(x => x[3] <= level)); return mk(g[0], g[1], g[2], sub + ' · grammatika'); }
    const pool = words.filter(w => w[2] <= level && (level === 1 || w[2] >= level - 1));
    const w = fromBag(key + 'w' + level, pool);
    const others = shuffle(pool.filter(x => x !== w));
    if (R() < 0.6) return mk(`“${w[0]}” — ${langName}?`, w[1], others.map(o => o[1]), sub);
    return mk(`“${w[1]}” — oʻzbekchasi?`, w[0], others.map(o => o[0]), sub);
  }
  function generate(subject, grade) {
    const g = GRADES.includes(grade) ? grade : 7;
    let s = SUBJECT_IDS.includes(subject) ? subject : 'math';
    if (s === 'mix') s = pick(SUBJECT_IDS.filter(x => x !== 'mix' && available(x, g)));
    const lv = g <= 4 ? 1 : g <= 8 ? 2 : 3, gl = ' · ' + gradeName(g);
    switch (s) {
      case 'math': return R() < 0.75 ? mathG(g) : bankG('math', g, 'Matematika' + gl);
      case 'eng': return R() < 0.5 ? bankG('eng', g, 'Ingliz tili' + gl) : wordQ('en', EN, EN_GR, lv, 'Ingliz tili', 'inglizchasi');
      case 'rus': return R() < 0.4 ? bankG('rus', g, 'Rus tili' + gl) : wordQ('ru', RU, RU_GR, lv, 'Rus tili', 'ruschasi');
      default: return bankG(s, g, nameOf(s) + gl);
    }
  }
  // Mini oʻyinlar uchun: sinf boʻyicha tasodifiy bank yozuvi (savol, toʻgʻri, xatolar)
  function rawItem(subject, grade) {
    const g = GRADES.includes(grade) ? grade : 7;
    let s = SUBJECT_IDS.includes(subject) && subject !== 'math' ? subject : null;
    if (!s || s === 'mix' || !available(s, g)) s = pick(['ona', 'bio', 'tarix', 'geo', 'eng'].concat(g >= 6 ? ['fiz'] : [], g >= 7 ? ['kim'] : [], g >= 5 ? ['inf'] : []));
    const it = fromBag('raw' + s + g, poolG(B()[s] || [], g)); return { q: it[1], a: it[2], w: [it[3], it[4]], sub: nameOf(s) };
  }
  function mathQuick(grade) { const g = GRADES.includes(grade) ? grade : 7; return g <= 5 ? mathQ(1) : g <= 8 ? mathQ(2) : mathG(g); }
  const LEGACY_LEVEL = { 1: 4, 2: 7, 3: 10 };

  /* ---------- Roʻyxatdan savol (oʻqituvchi testi / xatolar ustida ishlash) ---------- */
  function fromList(key, list, sub) { const it = fromBag(key, list); return mk(it[0], it[1], [it[2], it[3]], sub); }

  /* ---------- Oʻqituvchi testi: kodlash, dekodlash, qatʼiy tekshiruv ---------- */
  const LIMITS = Object.freeze({ title: 40, q: 90, a: 22, min: 3, max: 30, encoded: 9000 });
  const BAD_CHARS = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
  function clean(s, max) { if (typeof s !== 'string') return null; const t = s.replace(BAD_CHARS, '').replace(/\s+/g, ' ').trim(); if (!t || t.length > max) return null; return t; }
  function validateQuiz(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (o.v !== 1) return null;
    const title = clean(o.t, LIMITS.title); if (!title) return null;
    if (!Array.isArray(o.q) || o.q.length < LIMITS.min || o.q.length > LIMITS.max) return null;
    const items = [];
    for (const row of o.q) {
      if (!Array.isArray(row) || row.length !== 4) return null;
      const q = clean(row[0], LIMITS.q), c = clean(row[1], LIMITS.a), w1 = clean(row[2], LIMITS.a), w2 = clean(row[3], LIMITS.a);
      if (!q || !c || !w1 || !w2) return null;
      if (new Set([c, w1, w2]).size !== 3) return null;
      items.push([q, c, w1, w2]);
    }
    return { v: 1, t: title, q: items };
  }
  function b64urlEncode(str) { const bytes = new TextEncoder().encode(str); let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64urlDecode(s) { if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s) || s.length > LIMITS.encoded) return null; try { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { return null; } }
  function encodeQuiz(quiz) { const v = validateQuiz(quiz); if (!v) return null; const enc = b64urlEncode(JSON.stringify(v)); return enc.length <= LIMITS.encoded ? enc : null; }
  function decodeQuiz(s) { const json = b64urlDecode(s); if (!json) return null; try { return validateQuiz(JSON.parse(json)); } catch (e) { return null; } }

  return Object.freeze({ seed, unseed, hashStr, generate, rawItem, mathQuick, resetBags, fromList, SUBJECTS, SUBJECT_IDS, GRADES, gradeName, available, LEGACY_LEVEL, nameOf, LIMITS, validateQuiz, encodeQuiz, decodeQuiz, clean });
})();
