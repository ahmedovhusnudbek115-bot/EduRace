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

  /* ---------- Fanlar: [savol, toʻgʻri javob, [xato1, xato2], daraja] ---------- */
  const FIZ = [
    ['Suv necha gradusda qaynaydi?', '100 °C', ['50 °C', '0 °C'], 1], ['Suv necha gradusda muzlaydi?', '0 °C', ['100 °C', '10 °C'], 1], ['Qaysi biri magnitga tortiladi?', 'Temir mix', ['Yogʻoch', 'Shisha'], 1], ['Tovush qayerda tarqalmaydi?', 'Vakuumda', ['Havoda', 'Suvda'], 1], ['Massa birligi?', 'kilogramm', ['metr', 'sekund'], 1], ['Uzunlik birligi?', 'metr', ['kilogramm', 'litr'], 1], ['Vaqt birligi?', 'sekund', ['metr', 'gramm'], 1],
    ['Kuch birligi?', 'Nyuton', ['Joul', 'Vatt'], 2], ['Ish (energiya) birligi?', 'Joul', ['Nyuton', 'Paskal'], 2], ['Bosim birligi?', 'Paskal', ['Nyuton', 'Amper'], 2], ['Quvvat birligi?', 'Vatt', ['Volt', 'Joul'], 2], ['Tezlik formulasi?', 'v = s / t', ['v = s · t', 'v = t / s'], 2], ['Erkin tushish tezlanishi ≈ ?', '9,8 m/s²', ['3,14 m/s²', '98 m/s²'], 2], ['Zichlik formulasi?', 'ρ = m / V', ['ρ = m · V', 'ρ = V / m'], 2], ['Kuchlanish birligi?', 'Volt', ['Amper', 'Om'], 2], ['Havoda tovush tezligi ≈ ?', '340 m/s', ['34 m/s', '3400 m/s'], 2], ['Tok kuchining birligi?', 'Amper', ['Volt', 'Om'], 2],
    ['Om qonuni?', 'I = U / R', ['I = U · R', 'I = R / U'], 3], ['Kinetik energiya?', 'E = mv²/2', ['E = mgh', 'E = mv'], 3], ['Potensial energiya?', 'E = mgh', ['E = mv²/2', 'E = F/s'], 3], ['Impuls formulasi?', 'p = m·v', ['p = m·a', 'p = F/t'], 3], ['Chastota birligi?', 'Gers', ['Tesla', 'Veber'], 3], ['Magnit induksiya birligi?', 'Tesla', ['Gers', 'Farad'], 3], ['Elektr sigʻim birligi?', 'Farad', ['Genri', 'Tesla'], 3], ['Yorugʻlik yili — bu ...', 'masofa', ['vaqt', 'tezlik'], 3], ['Absolyut nol harorat ≈ ?', '−273 °C', ['−100 °C', '0 °C'], 3], ['Nyutonning II qonuni?', 'F = m·a', ['E = m·c²', 'P = U·I'], 3], ['Yorugʻlik tezligi ≈ ?', '300 000 km/s', ['30 000 km/s', '3 000 km/s'], 3]
  ];
  const KIM = [
    ['Nafas olganda qaysi gaz kerak?', 'Kislorod', ['Azot', 'Geliy'], 1], ['Osh tuzi suvda ...', 'eriydi', ['yonadi', 'muzlaydi'], 1], ['Suvning formulasi?', 'H₂O', ['CO₂', 'O₂'], 1],
    ['Havoning asosiy qismi qaysi gaz?', 'Azot', ['Kislorod', 'Vodorod'], 2], ['Kislorodning belgisi?', 'O', ['K', 'Os'], 2], ['Natriyning belgisi?', 'Na', ['N', 'Ni'], 2], ['Vodorodning belgisi?', 'H', ['V', 'Hg'], 2], ['Uglerodning belgisi?', 'C', ['U', 'Ca'], 2], ['Misning belgisi?', 'Cu', ['Mi', 'Co'], 2], ['Temirning belgisi?', 'Fe', ['Te', 'Ir'], 2], ['Karbonat angidrid formulasi?', 'CO₂', ['CO', 'O₂'], 2], ['Davriy jadval muallifi?', 'Mendeleyev', ['Nyuton', 'Lomonosov'], 2], ['pH = 7 boʻlgan muhit?', 'Neytral', ['Kislotali', 'Ishqoriy'], 2], ['Eng yengil element?', 'Vodorod', ['Geliy', 'Litiy'], 2], ['Osh tuzi formulasi?', 'NaCl', ['KCl', 'H₂O'], 2],
    ['Sulfat kislota formulasi?', 'H₂SO₄', ['HCl', 'HNO₃'], 3], ['Xlorid kislota formulasi?', 'HCl', ['H₂SO₄', 'NaCl'], 3], ['Ammiak formulasi?', 'NH₃', ['CH₄', 'NO₂'], 3], ['Metan formulasi?', 'CH₄', ['C₂H₆', 'NH₃'], 3], ['Kislorodning tartib raqami?', '8', ['6', '16'], 3], ['Uglerodning tartib raqami?', '6', ['12', '8'], 3], ['Avogadro soni ≈ ?', '6,02·10²³', ['3,14·10²³', '9,8·10²³'], 3], ['Soʻndirilgan ohak formulasi?', 'Ca(OH)₂', ['CaO', 'CaCO₃'], 3], ['Boʻr (marmar) formulasi?', 'CaCO₃', ['CaO', 'CaCl₂'], 3], ['Oltinning belgisi?', 'Au', ['Ag', 'Go'], 3], ['Kumushning belgisi?', 'Ag', ['Au', 'Si'], 3]
  ];
  const TARIX = [
    ['Oʻzbekiston poytaxti?', 'Toshkent', ['Samarqand', 'Buxoro'], 1], ['Oʻzbekiston Mustaqillik kuni?', '1-sentabr', ['9-may', '21-mart'], 1], ['Navroʻz qachon nishonlanadi?', '21-mart', ['1-sentabr', '8-dekabr'], 1], ['Oʻzbekiston mustaqil boʻlgan yil?', '1991', ['1989', '1995'], 1], ['Registon maydoni qayerda?', 'Samarqand', ['Xiva', 'Toshkent'], 1], ['Minorai Kalon qaysi shaharda?', 'Buxoro', ['Samarqand', 'Xiva'], 1],
    ['“Algoritm” soʻzi kimning nomidan?', 'Al-Xorazmiy', ['Ibn Sino', 'Beruniy'], 2], ['“Tib qonunlari” muallifi?', 'Ibn Sino', ['Al-Xorazmiy', 'Ulugʻbek'], 2], ['Ulugʻbek rasadxonasi qayerda?', 'Samarqand', ['Buxoro', 'Qoʻqon'], 2], ['Ichan qalʼa qaysi shaharda?', 'Xiva', ['Buxoro', 'Termiz'], 2], ['“Boburnoma” muallifi?', 'Bobur', ['Navoiy', 'Amir Temur'], 2], ['“Xamsa”ni oʻzbek tilida yozgan?', 'Alisher Navoiy', ['Bobur', 'Mashrab'], 2], ['Amir Temur tugʻilgan joy?', 'Kesh (Shahrisabz)', ['Samarqand', 'Xiva'], 2], ['Temuriylar davlati asoschisi?', 'Amir Temur', ['Bobur', 'Ulugʻbek'], 2], ['Boburiylar qayerda hukmronlik qilgan?', 'Hindiston', ['Eron', 'Xitoy'], 2], ['Buyuk Ipak yoʻli qayerdan boshlangan?', 'Xitoy', ['Hindiston', 'Rim'], 2], ['Ikkinchi jahon urushi tugagan yil?', '1945', ['1941', '1939'], 2], ['Kolumb Amerikani kashf etgan yil?', '1492', ['1592', '1392'], 2],
    ['Ilk Konstitutsiya qabul qilingan yil?', '1992', ['1991', '1995'], 3], ['Beruniy qaysi hududda tugʻilgan?', 'Xorazm', ['Buxoro', 'Fargʻona'], 3], ['Ibn Sino tugʻilgan joy?', 'Afshona (Buxoro)', ['Samarqand', 'Xiva'], 3], ['Ulugʻbek rasadxonasi qurilgan asr?', 'XV asr', ['XII asr', 'XVIII asr'], 3], ['Amir Temur hukmronligi boshlangan yil?', '1370', ['1405', '1336'], 3], ['Birinchi jahon urushi boshlangan yil?', '1914', ['1918', '1939'], 3], ['Buyuk fransuz inqilobi yili?', '1789', ['1812', '1917'], 3]
  ];
  const GEO = [
    ['Eng katta okean?', 'Tinch okeani', ['Hind okeani', 'Atlantika'], 1], ['Oʻzbekiston qaysi qitʼada?', 'Osiyo', ['Yevropa', 'Afrika'], 1], ['Eng baland togʻ choʻqqisi?', 'Everest', ['Elbrus', 'Monblan'], 1], ['Eng katta materik?', 'Yevrosiyo', ['Afrika', 'Avstraliya'], 1], ['Yer oʻz oʻqi atrofida necha soatda aylanadi?', '24 soat', ['12 soat', '365 soat'], 1], ['Asosiy dunyo tomonlari nechta?', '4', ['2', '8'], 1], ['Yerning tabiiy yoʻldoshi?', 'Oy', ['Mars', 'Quyosh'], 1],
    ['Oʻzbekistonda nechta viloyat bor?', '12', ['14', '10'], 2], ['Oʻzbekiston bilan chegaradosh emas:', 'Rossiya', ['Qozogʻiston', 'Tojikiston'], 2], ['Oʻzbekistonning eng katta daryosi?', 'Amudaryo', ['Sirdaryo', 'Zarafshon'], 2], ['Afrikadagi eng uzun daryo?', 'Nil', ['Kongo', 'Niger'], 2], ['Samarqand qaysi daryo boʻyida?', 'Zarafshon', ['Chirchiq', 'Sirdaryo'], 2], ['Qoraqalpogʻiston poytaxti?', 'Nukus', ['Urganch', 'Termiz'], 2], ['Fargʻona vodiysida joylashmagan viloyat:', 'Navoiy', ['Andijon', 'Namangan'], 2], ['Eng katta sayyora?', 'Yupiter', ['Saturn', 'Yer'], 2],
    ['Dengizga ikki marta chiqa olmaydigan davlat?', 'Oʻzbekiston', ['Qozogʻiston', 'Moʻgʻuliston'], 3], ['Dunyodagi eng chuqur koʻl?', 'Baykal', ['Kaspiy', 'Viktoriya'], 3], ['Maydoni eng katta koʻl?', 'Kaspiy', ['Baykal', 'Orol'], 3], ['Ekvator uzunligi ≈ ?', '40 000 km', ['10 000 km', '100 000 km'], 3], ['Maydoni eng katta davlat?', 'Rossiya', ['Kanada', 'Xitoy'], 3], ['Okeandagi eng chuqur joy?', 'Mariana botigʻi', ['Puerto-Riko', 'Yava botigʻi'], 3]
  ];

  const SUBJECTS = [
    { id: 'math', ic: '🔢', name: 'Matematika', hint: 'Hisob, tenglama' },
    { id: 'eng', ic: '🇬🇧', name: 'Ingliz tili', hint: 'Soʻz, grammatika' },
    { id: 'rus', ic: '🇷🇺', name: 'Rus tili', hint: 'Soʻz, grammatika' },
    { id: 'fiz', ic: '⚡', name: 'Fizika', hint: 'Birlik, formula' },
    { id: 'kim', ic: '🧪', name: 'Kimyo', hint: 'Element, formula' },
    { id: 'tarix', ic: '🏛️', name: 'Tarix', hint: 'Allomalar, sanalar' },
    { id: 'geo', ic: '🌍', name: 'Geografiya', hint: 'Daryo, materik' },
    { id: 'mix', ic: '🎲', name: 'Aralash', hint: 'Hamma fanlar' }
  ];
  const SUBJECT_IDS = SUBJECTS.map(s => s.id);
  const nameOf = id => (SUBJECTS.find(s => s.id === id) || SUBJECTS[0]).name;

  let bags = {};
  function resetBags() { bags = {}; }
  function fromBag(key, items) { if (!bags[key] || !bags[key].length) bags[key] = shuffle(items.slice()); return bags[key].pop(); }
  function poolFor(list, level) {
    let p = list.filter(x => x[3] <= level && (level < 3 || x[3] >= 2));
    if (p.length < 8) p = list.filter(x => x[3] <= Math.min(3, level + 1));
    return p;
  }
  function bankQ(key, list, level, sub) { const k = fromBag(key + level, poolFor(list, level)); return mk(k[0], k[1], k[2], sub); }
  function wordQ(key, words, gram, level, sub, langName) {
    if (level >= 2 && R() < 0.3) { const g = fromBag(key + 'g' + level, gram.filter(x => x[3] <= level)); return mk(g[0], g[1], g[2], sub + ' · grammatika'); }
    const pool = words.filter(w => w[2] <= level && (level === 1 || w[2] >= level - 1));
    const w = fromBag(key + 'w' + level, pool);
    const others = shuffle(pool.filter(x => x !== w));
    if (R() < 0.6) return mk(`“${w[0]}” — ${langName}?`, w[1], others.map(o => o[1]), sub);
    return mk(`“${w[1]}” — oʻzbekchasi?`, w[0], others.map(o => o[0]), sub);
  }
  function generate(subject, level) {
    level = [1, 2, 3].includes(level) ? level : 2;
    let s = SUBJECT_IDS.includes(subject) ? subject : 'math';
    if (s === 'mix') s = pick(['math', 'eng', 'rus', 'fiz', 'kim', 'tarix', 'geo']);
    switch (s) {
      case 'math': return mathQ(level);
      case 'eng': return wordQ('en', EN, EN_GR, level, 'Ingliz tili', 'inglizchasi');
      case 'rus': return wordQ('ru', RU, RU_GR, level, 'Rus tili', 'ruschasi');
      case 'fiz': return bankQ('fiz', FIZ, level, 'Fizika');
      case 'kim': return bankQ('kim', KIM, level, 'Kimyo');
      case 'tarix': return bankQ('tar', TARIX, level, 'Tarix');
      default: return bankQ('geo', GEO, level, 'Geografiya');
    }
  }

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

  return Object.freeze({ seed, unseed, hashStr, generate, resetBags, fromList, SUBJECTS, SUBJECT_IDS, nameOf, LIMITS, validateQuiz, encodeQuiz, decodeQuiz, clean });
})();
