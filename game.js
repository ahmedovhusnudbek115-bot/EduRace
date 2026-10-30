/* Edu Race — oʻyin mantiqi. Xavfsizlik: innerHTML ishlatilmaydi, CSP + Trusted Types bilan ishlaydi. */
(()=>{
'use strict';

/* =========================================================
   EDU RACE — oʻquv poyga oʻyini (psevdo-3D dvigatel)
   ========================================================= */
const $ = id => document.getElementById(id);
const FONT = "'Segoe UI',Roboto,system-ui,sans-serif";
const canvas = $('game'), ctx = canvas.getContext('2d');
let W = 0, H = 0;

/* ---------- utils ---------- */
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const limit = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,p) => a+(b-a)*p;
const easeIn = (a,b,p) => a+(b-a)*p*p;
const easeInOut = (a,b,p) => a+(b-a)*((-Math.cos(p*Math.PI)/2)+0.5);
const pctRem = (n,total) => (n%total)/total;
const approach = (v,t,s) => v<t ? Math.min(t,v+s) : Math.max(t,v-s);
const gcd = (a,b) => b ? gcd(b,a%b) : a;
const fog = (d,density) => 1/Math.pow(Math.E, d*d*density);
const overlap = (x1,w1,x2,w2) => !((x1+w1/2) < (x2-w2/2) || (x1-w1/2) > (x2+w2/2));
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function h(tag, props, ...kids){ // xavfsiz DOM yaratish (innerHTML ishlatilmaydi)
  const e=document.createElement(tag);
  if(props) for(const k of Object.keys(props)){ const v=props[k];
    if(k==='class') e.className=v; else if(k==='text') e.textContent=v; else if(k==='data') for(const d of Object.keys(v)) e.dataset[d]=String(v[d]); else if(k!=='style') e.setAttribute(k,String(v)); }
  for(const c of kids){ if(c!==null && c!==undefined) e.append(c); }
  return e;
}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}

/* ---------- save ---------- */
const SAVE_KEY='eduRace.v1';
let save; // pastda, CARS aniqlangandan keyin tekshirib yuklanadi
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
// Saqlangan maʼlumotni qatʼiy sxema boʻyicha tekshirish: nomaʼlum kalitlar (masalan __proto__) koʻchirilmaydi,
// har bir maydon turi va chegarasi tekshiriladi, buzilgan maʼlumot standart qiymatga qaytariladi.
function loadSave(){
  const d={coins:0, owned:['ilm1'], car:'ilm1', subject:'math', level:2, muted:false, races:0, wins:0};
  let raw=null;
  try{ const s=localStorage.getItem(SAVE_KEY); if(typeof s==='string' && s.length<=4096) raw=JSON.parse(s); }catch(e){ raw=null; }
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return d;
  const has=k=>Object.prototype.hasOwnProperty.call(raw,k);
  const int=(k,min,max,def)=>{ const v=has(k)?raw[k]:undefined; return (Number.isSafeInteger(v) && v>=min && v<=max) ? v : def; };
  const ids=CARS.map(c=>c.id);
  d.coins=int('coins',0,10000000,0);
  d.races=int('races',0,10000000,0);
  d.wins=Math.min(int('wins',0,10000000,0), d.races);
  d.level=int('level',1,3,2);
  d.subject=(has('subject') && ['math','eng','know','mix'].includes(raw.subject)) ? raw.subject : 'math';
  d.muted=has('muted') && raw.muted===true;
  if(has('owned') && Array.isArray(raw.owned) && raw.owned.length<=CARS.length*2){ d.owned=[...new Set(raw.owned.filter(x=>typeof x==='string' && ids.includes(x)))]; }
  if(!d.owned.includes('ilm1')) d.owned.unshift('ilm1');
  d.car=(has('car') && typeof raw.car==='string' && d.owned.includes(raw.car)) ? raw.car : 'ilm1';
  return d;
}

/* =========================================================
   SAVOLLAR
   ========================================================= */
const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup = n => String(n).split('').map(c=>SUP[c]||c).join('');
const xpow = n => n===1 ? 'x' : 'x'+sup(n);
const neg = n => n<0 ? '−'+Math.abs(n) : String(n);
function mk(q, correct, wrongs, sub){
  correct = String(correct);
  const w = []; for(const x of wrongs){ const s=String(x); if(s!==correct && !w.includes(s)) w.push(s); if(w.length===2) break; }
  const opts = shuffle([correct, ...w]);
  return {q, opts, ans: opts.indexOf(correct), correct, sub};
}
function nw(ans, cands){ // raqamli chalgʻituvchi javoblar
  const out=[]; for(const c of shuffle(cands.slice())){ if(c!==ans && !out.includes(c) && Number.isFinite(c) && (c>=0 || ans<0)) out.push(c); if(out.length===2) break; }
  let k=1; while(out.length<2){ const c=ans+k; if(!out.includes(c) && c!==ans) out.push(c); k = k>0 ? -k : -k+1; }
  return out.map(neg);
}
function mathQ(level){
  const S='Matematika';
  if(level===1){
    const t=rnd(0,3);
    if(t===0){const a=rnd(5,60),b=rnd(3,39),r=a+b;return mk(`${a} + ${b} = ?`,r,nw(r,[r+1,r-1,r+10,r-10,r+2]),S);}
    if(t===1){const a=rnd(20,99),b=rnd(3,a-2),r=a-b;return mk(`${a} − ${b} = ?`,r,nw(r,[r+1,r-1,r+10,r-10,r+2]),S);}
    if(t===2){const a=rnd(2,10),b=rnd(2,10),r=a*b;return mk(`${a} × ${b} = ?`,r,nw(r,[r+a,r-a,r+b,r-b,r+1]),S);}
    const b=rnd(2,10),q=rnd(2,10);return mk(`${b*q} : ${b} = ?`,q,nw(q,[q+1,q-1,q+2,q-2]),S);
  }
  if(level===2){
    const t=rnd(0,7);
    if(t===0){const a=rnd(12,29),b=rnd(3,9),r=a*b;return mk(`${a} × ${b} = ?`,r,nw(r,[r+b,r-b,r+10,r-10,r+a]),S);}
    if(t===1){const p=pick([10,20,25,50]);const n=p===25?rnd(2,30)*4:p===50?rnd(5,60)*2:rnd(2,30)*10;const r=n*p/100;return mk(`${n} ning ${p}% i = ?`,r,nw(r,[r*2,Math.round(r/2),r+10,r+5,r-5]),S);}
    if(t===2){const a=-rnd(2,20),b=rnd(1,30),r=a+b;return mk(`${neg(a)} + ${b} = ?`,neg(r),nw(r,[-r,r+2,r-2,r+1]),S);}
    if(t===3){const x=rnd(3,40),a=rnd(2,30);return mk(`x + ${a} = ${x+a},  x = ?`,x,nw(x,[x+1,x-1,x+a,x+2]),S);}
    if(t===4){const a=rnd(2,9),x=rnd(2,12);return mk(`${a}x = ${a*x},  x = ?`,x,nw(x,[x+1,x-1,a*x-a,x+2]),S);}
    if(t===5){const n=rnd(11,20),r=n*n;return mk(`${n}² = ?`,r,nw(r,[r+n,r-n,r+10,2*n,r+1]),S);}
    if(t===6){const b=pick([4,6,8,10,12]),a=rnd(1,b-2),c=rnd(1,b-a-1),s=a+c,g=gcd(s,b);return mk(`${a}/${b} + ${c}/${b} = ?`,`${s/g}/${b/g}`,[`${s}/${2*b}`,`${s+1}/${b}`,`${s-1}/${b}`],S);}
    const b=rnd(11,19),q=rnd(3,9);return mk(`${b*q} : ${b} = ?`,q,nw(q,[q+1,q-1,q+2]),S);
  }
  const t=rnd(0,8);
  if(t===0){const n=rnd(5,10),r=2**n;return mk(`2${sup(n)} = ?`,r,nw(r,[r*2,r/2,2*n,r+2]),S);}
  if(t===1){const n=rnd(11,25);return mk(`√${n*n} = ?`,n,nw(n,[n+1,n-1,n+2,n*2]),S);}
  if(t===2){const a=rnd(2,9),x=rnd(-9,12),b=rnd(1,20)*(Math.random()<.5?-1:1),c=a*x+b;return mk(`${a}x ${b>=0?'+':'−'} ${Math.abs(b)} = ${neg(c)},  x = ?`,neg(x),nw(x,[x+1,x-1,-x,x+2]),S);}
  if(t===3){const T=pick([['sin 30°','1/2',['√3/2','1']],['cos 60°','1/2',['√2/2','0']],['sin 90°','1',['0','1/2']],['cos 0°','1',['0','−1']],['tg 45°','1',['0','√3']],['sin 60°','√3/2',['1/2','√2/2']],['cos 90°','0',['1','1/2']],['cos 45°','√2/2',['1/2','√3/2']]]);return mk(`${T[0]} = ?`,T[1],T[2],S);}
  if(t===4){const base=pick([2,3]),n=base===2?rnd(2,8):rnd(2,5),v=base**n;return mk(`log${base===2?'₂':'₃'} ${v} = ?`,n,nw(n,[n+1,n-1,n*base,n+2]),S);}
  if(t===5){const n=rnd(2,6);return mk(`(${xpow(n)})′ = ?`,`${n}${xpow(n-1)}`,[`${xpow(n-1)}`,`${n}${xpow(n+1)}`,`${n-1}${xpow(n)}`],S);}
  if(t===6){const a=rnd(1,20),d=rnd(2,9);return mk(`${a}, ${a+d}, ${a+2*d}, ${a+3*d}, ?`,a+4*d,nw(a+4*d,[a+5*d,a+4*d+1,a+4*d-1,a+3*d+1]),S);}
  if(t===7){const a=rnd(1,5),q=pick([2,3]),r=a*q**3;return mk(`${a}, ${a*q}, ${a*q*q}, ?`,r,nw(r,[r+a,r-a,a*q*q+a*q,r+q]),S);}
  const T=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[12,16,20]]);
  return mk(`Katetlar ${T[0]} va ${T[1]}. Gipotenuza = ?`,T[2],nw(T[2],[T[0]+T[1],T[2]+1,T[2]-1,T[2]+2]),S);
}
// [oʻzbekcha, inglizcha, daraja]
const WORDS = [
 ['olma','apple',1],['kitob','book',1],['it','dog',1],['mushuk','cat',1],['uy','house',1],['suv','water',1],['quyosh','sun',1],['qizil','red',1],['koʻk','blue',1],['yashil','green',1],['ona','mother',1],['ota','father',1],['maktab','school',1],['ruchka','pen',1],['non','bread',1],['sut','milk',1],['qush','bird',1],['baliq','fish',1],['katta','big',1],['kichik','small',1],['oy','moon',1],['gul','flower',1],['qor','snow',1],['koʻz','eye',1],
 ['doʻst','friend',2],['shahar','city',2],['daraxt','tree',2],['deraza','window',2],['eshik','door',2],['oshxona','kitchen',2],['ob-havo','weather',2],['kuchli','strong',2],['tez','fast',2],['sekin','slow',2],['bahor','spring',2],['qish','winter',2],['yoz','summer',2],['kuz','autumn',2],['savol','question',2],['javob','answer',2],['sayohat','travel',2],['sogʻliq','health',2],['chiroyli','beautiful',2],['och','hungry',2],['kecha','yesterday',2],['ertaga','tomorrow',2],['bozor','market',2],['tog‘','mountain',2],
 ['muhim','important',3],['imkoniyat','opportunity',3],['rivojlanish','development',3],['atrof-muhit','environment',3],['tajriba','experience',3],['qaror','decision',3],['muvaffaqiyat','success',3],['bilim','knowledge',3],['hamkorlik','cooperation',3],['masʼuliyat','responsibility',3],['jamiyat','society',3],['iqtisodiyot','economy',3],['hukumat','government',3],['tadqiqot','research',3],['kashfiyot','discovery',3],['mustaqillik','independence',3],['tenglama','equation',3],['taraqqiyot','progress',3]
];
const GRAMMAR = [
 ['I ___ a student.','am',['is','are'],2],['They ___ football.','play',['plays','playing'],2],['She ___ a cat.','has',['have','having'],2],['We ___ at school yesterday.','were',['was','are'],2],['He ___ English every day.','studies',['study','studying'],2],['There ___ two cats.','are',['is','am'],2],['___ you like tea?','Do',['Does','Is'],2],
 ['I have lived here ___ 2015.','since',['for','from'],3],['This book is ___ than that one.','better',['good','best'],3],['Listen! The baby ___.','is crying',['cries','cried'],3],['She is the ___ in class.','tallest',['taller','tall'],3],['The letter ___ yesterday.','was sent',['sent','is send'],3],['She has ___ finished it.','already',['yet','ago'],3]
];
const KNOW = [
 ['Oʻzbekiston poytaxti?','Toshkent',['Samarqand','Buxoro'],1],['Oʻzbekiston Mustaqillik kuni?','1-sentabr',['9-may','21-mart'],1],['Navroʻz qachon nishonlanadi?','21-mart',['1-sentabr','8-dekabr'],1],['Oʻzbekiston mustaqil boʻlgan yil?','1991',['1989','1995'],1],['Registon maydoni qayerda?','Samarqand',['Xiva','Toshkent'],1],['Yerning tabiiy yoʻldoshi?','Oy',['Mars','Quyosh'],1],['Eng katta okean?','Tinch okeani',['Hind okeani','Atlantika'],1],['Qizil sayyora?','Mars',['Venera','Yupiter'],1],['Eng katta sayyora?','Yupiter',['Saturn','Yer'],1],['Suvning formulasi?','H₂O',['CO₂','O₂'],1],['Oʻzbekiston qaysi qitʼada?','Osiyo',['Yevropa','Afrika'],1],['Yil necha kundan iborat?','365',['360','300'],1],['Eng baland togʻ cho‘qqisi?','Everest',['Elbrus','Monblan'],1],
 ['“Algoritm” soʻzi kimning nomidan?','Al-Xorazmiy',['Ibn Sino','Beruniy'],2],['“Tib qonunlari” muallifi?','Ibn Sino',['Al-Xorazmiy','Ulugʻbek'],2],['Ulugʻbek rasadxonasi qayerda?','Samarqand',['Buxoro','Qoʻqon'],2],['Ichan qalʼa qaysi shaharda?','Xiva',['Buxoro','Termiz'],2],['Minorai Kalon qayerda?','Buxoro',['Samarqand','Xiva'],2],['“Boburnoma” muallifi?','Bobur',['Navoiy','Amir Temur'],2],['“Xamsa”ni oʻzbek tilida yozgan?','Alisher Navoiy',['Bobur','Mashrab'],2],['Oʻzbekistonda nechta viloyat bor?','12',['14','10'],2],['Oʻzbekiston bilan chegaradosh emas:','Rossiya',['Qozogʻiston','Tojikiston'],2],['Amir Temur tugʻilgan joy?','Kesh (Shahrisabz)',['Samarqand','Xiva'],2],['Ikkinchi jahon urushi tugagan yil?','1945',['1941','1939'],2],['Kolumb Amerikani qachon kashf etgan?','1492',['1592','1392'],2],['Odam tanasidagi eng katta organ?','Teri',['Jigar','Yurak'],2],['Osh tuzi formulasi?','NaCl',['KCl','H₂O'],2],['Temirning kimyoviy belgisi?','Fe',['Te','Ir'],2],['Fotosintezda oʻsimlik yutadigan gaz?','CO₂',['O₂','N₂'],2],['Uchburchak burchaklari yigʻindisi?','180°',['360°','90°'],2],
 ['Yorugʻlik tezligi taxminan?','300 000 km/s',['30 000 km/s','3 000 km/s'],3],['Nyutonning II qonuni?','F = m·a',['E = m·c²','P = U·I'],3],['Oltinning kimyoviy belgisi?','Au',['Ag','Go'],3],['Pifagor teoremasi?','a² + b² = c²',['a + b = c','a² − b² = c'],3],['Ilk Konstitutsiya qabul qilingan yil?','1992',['1991','1995'],3],['DNK asosan qayerda joylashgan?','Hujayra yadrosi',['Mitoxondriya','Ribosoma'],3],['Tok kuchining birligi?','Amper',['Volt','Om'],3],['Dengizga ikki marta chiqa olmaydigan davlat?','Oʻzbekiston',['Qozogʻiston','Moʻgʻuliston'],3],['Elektr qarshilik birligi?','Om',['Vatt','Amper'],3]
];
const bags = {};
function fromBag(key, items){ // takrorlanmasin
  if(!bags[key] || !bags[key].length) bags[key] = shuffle(items.slice());
  return bags[key].pop();
}
function engQ(level){
  const S='Ingliz tili';
  if(level>=2 && Math.random()<0.3){
    const g = fromBag('gr'+level, GRAMMAR.filter(x=>x[3]<=level));
    return mk(g[0], g[1], g[2], S+' · grammatika');
  }
  const pool = WORDS.filter(w=>w[2]<=level && (level===1 || w[2]>=level-1));
  const w = fromBag('w'+level, pool);
  const others = shuffle(pool.filter(x=>x!==w));
  if(Math.random()<0.6) return mk(`“${w[0]}” — inglizchasi?`, w[1], others.map(o=>o[1]), S);
  return mk(`“${w[1]}” — oʻzbekchasi?`, w[0], others.map(o=>o[0]), S);
}
function knowQ(level){
  const pool = KNOW.filter(k=>k[3]<=level && (level<3 || k[3]>=2));
  const k = fromBag('k'+level, pool);
  return mk(k[0], k[1], k[2], 'Bilimdon');
}
function nextQuestion(){
  let s = save.subject; if(s==='mix') s = pick(['math','eng','know']);
  const L = save.level;
  if(s==='math') return mathQ(L);
  if(s==='eng') return engQ(L);
  return knowQ(L);
}

/* =========================================================
   GRAFIKA (spraytlar kodda chiziladi — rasm fayllari kerak emas)
   ========================================================= */
function shade(hex, f){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; r=limit(Math.round(r*f),0,255); g=limit(Math.round(g*f),0,255); b=limit(Math.round(b*f),0,255); return `rgb(${r},${g},${b})`; }
function makeCar(color, plate){
  const [c,g]=mkCanvas(220,124);
  g.fillStyle='rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(110,114,108,10,0,0,Math.PI*2); g.fill();
  g.fillStyle='#0c0c12'; rr(g,12,76,42,42,9); g.fill(); rr(g,166,76,42,42,9); g.fill();
  let gr=g.createLinearGradient(0,40,0,108); gr.addColorStop(0,shade(color,1.15)); gr.addColorStop(.5,color); gr.addColorStop(1,shade(color,.45));
  g.fillStyle=gr; g.beginPath(); g.moveTo(8,96); g.lineTo(9,64); g.quadraticCurveTo(12,46,40,44); g.lineTo(180,44); g.quadraticCurveTo(208,46,211,64); g.lineTo(212,96); g.quadraticCurveTo(212,106,200,106); g.lineTo(20,106); g.quadraticCurveTo(8,106,8,96); g.fill();
  gr=g.createLinearGradient(0,8,0,46); gr.addColorStop(0,shade(color,.9)); gr.addColorStop(1,shade(color,.6));
  g.fillStyle=gr; g.beginPath(); g.moveTo(46,46); g.lineTo(64,14); g.quadraticCurveTo(68,7,80,7); g.lineTo(140,7); g.quadraticCurveTo(152,7,156,14); g.lineTo(174,46); g.closePath(); g.fill();
  gr=g.createLinearGradient(0,14,0,44); gr.addColorStop(0,'#3a4a7a'); gr.addColorStop(1,'#0a0d1c');
  g.fillStyle=gr; g.beginPath(); g.moveTo(60,43); g.lineTo(74,16); g.lineTo(146,16); g.lineTo(160,43); g.closePath(); g.fill();
  g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=2; g.beginPath(); g.moveTo(80,20); g.lineTo(72,38); g.stroke();
  g.fillStyle='#10101a'; g.fillRect(14,34,192,8); g.fillRect(30,42,8,8); g.fillRect(182,42,8,8);
  g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(100,46,20,58);
  g.shadowColor='#ff1e46'; g.shadowBlur=16; g.fillStyle='#ff2a4f'; rr(g,15,58,54,13,5); g.fill(); rr(g,151,58,54,13,5); g.fill(); g.shadowBlur=0;
  g.fillStyle='#ffd0d8'; g.fillRect(22,62,40,3); g.fillRect(158,62,40,3);
  g.fillStyle='#f2f2f2'; rr(g,84,74,52,17,3); g.fill(); g.fillStyle='#111'; g.font=`900 13px ${FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(plate||'EDU',110,83);
  g.fillStyle='#2a2a33'; rr(g,40,96,18,8,3); g.fill(); rr(g,162,96,18,8,3); g.fill();
  return c;
}
function makeLamp(color, flip){
  const [c,g]=mkCanvas(120,360);
  g.fillStyle='#2b2b3a'; g.fillRect(56,40,8,320); g.fillRect(flip?16:56,34,48,7);
  const hx = flip?16:96;
  g.shadowColor=color; g.shadowBlur=30; g.fillStyle=color; rr(g,hx-14,30,28,12,5); g.fill();
  g.shadowBlur=0; const gr=g.createRadialGradient(hx,42,2,hx,42,40); gr.addColorStop(0,color+'cc'); gr.addColorStop(1,color+'00'); g.fillStyle=gr; g.fillRect(hx-44,10,88,80);
  return c;
}
function makeBuilding(){
  const w=rnd(240,320), h=rnd(420,780);
  const [c,g]=mkCanvas(w,h);
  const base=pick(['#141030','#101a32','#1c1236','#0e1428','#191a2e']);
  g.fillStyle=base; g.fillRect(0,12,w,h-12);
  g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(0,12,w*0.18,h);
  const neon=pick(['#ff2d75','#2fe6ff','#9b5cff','#ffd23c','#3cff9a']);
  g.shadowColor=neon; g.shadowBlur=14; g.fillStyle=neon; g.fillRect(0,10,w,5); g.shadowBlur=0;
  const cw=22, ch=26;
  for(let y=34;y<h-30;y+=ch){ for(let x=14;x<w-20;x+=cw){ const r=Math.random(); g.fillStyle = r<0.32 ? pick(['#ffe39a','#fff3c4','#9ff3ff','#ffb36b']) : r<0.4 ? '#2a3060' : '#0b0d1e'; g.fillRect(x,y,12,15); } }
  if(Math.random()<.5){ g.shadowColor=neon; g.shadowBlur=18; g.strokeStyle=neon; g.lineWidth=5; const sw=w*0.7; rr(g,(w-sw)/2,40,sw,52,10); g.stroke(); g.fillStyle=neon; g.font=`900 30px ${FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(pick(['ILM','BILIM','KITOB','MAKTAB','OʻQI','EDU','FAN','KOD']),w/2,67); g.shadowBlur=0; }
  return c;
}
function makeBillboard(text, color){
  const [c,g]=mkCanvas(400,260);
  g.fillStyle='#22222e'; g.fillRect(70,150,14,110); g.fillRect(316,150,14,110);
  g.fillStyle='#0b0820'; rr(g,6,6,388,160,18); g.fill();
  g.shadowColor=color; g.shadowBlur=24; g.lineWidth=8; g.strokeStyle=color; rr(g,6,6,388,160,18); g.stroke();
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  const lines=text.split('\n'); let size=lines.length>1?44:56; g.font=`900 ${size}px ${FONT}`;
  while(Math.max(...lines.map(l=>g.measureText(l).width))>350 && size>20){ size-=2; g.font=`900 ${size}px ${FONT}`; }
  lines.forEach((l,i)=>g.fillText(l,200,86+(i-(lines.length-1)/2)*(size*1.1)));
  g.shadowBlur=0; return c;
}
function makeTree(){
  const [c,g]=mkCanvas(200,300);
  g.fillStyle='#2a1a14'; g.fillRect(92,180,16,120);
  const gr=g.createRadialGradient(90,100,10,100,120,100); gr.addColorStop(0,'#1f6b5a'); gr.addColorStop(1,'#0a2a26');
  g.fillStyle=gr; g.beginPath(); g.arc(100,120,90,0,Math.PI*2); g.fill();
  g.fillStyle='rgba(60,255,154,.12)'; g.beginPath(); g.arc(70,90,40,0,Math.PI*2); g.fill();
  return c;
}
function makeArch(){
  const [c,g]=mkCanvas(1000,320);
  g.fillStyle='#1d1d2b'; g.fillRect(10,60,40,260); g.fillRect(950,60,40,260);
  g.shadowColor='#ff2d75'; g.shadowBlur=20; g.fillStyle='#ff2d75'; g.fillRect(24,60,12,260); g.fillRect(964,60,12,260); g.shadowBlur=0;
  for(let i=0;i<40;i++){ for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?'#fff':'#111'; g.fillRect(i*25,j*20,25,20);} }
  g.fillStyle='#0b0820'; g.fillRect(0,40,1000,90);
  g.shadowColor='#2fe6ff'; g.shadowBlur=22; g.strokeStyle='#2fe6ff'; g.lineWidth=6; g.strokeRect(3,43,994,84);
  g.fillStyle='#fff'; g.font=`italic 900 60px ${FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('EDU RACE  ·  START / FINISH',500,87); g.shadowBlur=0;
  return c;
}
const LANE_COLORS=['#2fe6ff','#ffd23c','#ff2d75'];
function makeGatePanel(text, col){
  const [c,g]=mkCanvas(300,250);
  g.fillStyle='#1b1b2b'; g.fillRect(12,100,18,150); g.fillRect(270,100,18,150);
  g.shadowColor=col; g.shadowBlur=20; g.fillStyle=col; g.fillRect(17,100,8,150); g.fillRect(275,100,8,150);
  g.fillStyle='rgba(8,6,26,.94)'; rr(g,4,4,292,116,18); g.fill();
  g.lineWidth=8; g.strokeStyle=col; rr(g,4,4,292,116,18); g.stroke(); g.shadowBlur=0;
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  let size=68; g.font=`900 ${size}px ${FONT}`; while(g.measureText(text).width>262 && size>20){ size-=2; g.font=`900 ${size}px ${FONT}`; }
  g.fillText(text,150,64);
  return c;
}
function makeSkyline(w,h,colA,lit){
  const [c,g]=mkCanvas(w,h);
  let x=0; while(x<w){ const bw=rnd(36,110), bh=rnd(h*0.25,h*0.95); g.fillStyle=colA; g.fillRect(x,h-bh,bw-3,bh);
    if(lit){ for(let wy=h-bh+8; wy<h-6; wy+=10){ for(let wx=x+5; wx<x+bw-8; wx+=8){ if(Math.random()<0.18){ g.fillStyle=pick(['rgba(255,220,140,.8)','rgba(150,240,255,.7)','rgba(255,120,200,.6)']); g.fillRect(wx,wy,3,4);} } } }
    if(Math.random()<0.15){ g.fillStyle='#ff2d75'; g.fillRect(x+bw/2-1,h-bh-14,2,14); }
    x+=bw; }
  return c;
}

const CARS = [
  {id:'ilm1', name:'Ilm-1', color:'#21c8f0', price:0, mult:1.00},
  {id:'chaqmoq', name:'Qizil Chaqmoq', color:'#ff2f5a', price:150, mult:1.03},
  {id:'burgut', name:'Oltin Burgut', color:'#ffbf1f', price:400, mult:1.06},
  {id:'zumrad', name:'Zumrad', color:'#2fe88a', price:800, mult:1.08},
  {id:'kometa', name:'Binafsha Kometa', color:'#a259ff', price:1500, mult:1.10},
  {id:'oq', name:'Oq Lochin', color:'#e8eaf2', price:2500, mult:1.12},
];
save = loadSave();
const AI_COLORS=['#ff6b2f','#8a8f9e','#d02bd6','#2f6bff','#e8e04a','#20d0a0'];
const AI_NAMES=['Temur','Malika','Jasur','Dilnoza','Bekzod','Sevara'];

const SPR = {};
function buildSprites(){
  SPR.lampL = {img:makeLamp('#ffd27a',false), w:300};
  SPR.lampR = {img:makeLamp('#ffd27a',true), w:300};
  SPR.lampPL = {img:makeLamp('#ff5fb0',false), w:300};
  SPR.lampPR = {img:makeLamp('#ff5fb0',true), w:300};
  SPR.buildings = Array.from({length:10},()=>{const img=makeBuilding(); return {img, w:img.width*8};});
  SPR.boards = ['OʻQI\nOʻYNA · YUT','BILIM —\nKUCH!','EDU RACE','2 × 2 = 4','HELLO = SALOM','AL-XORAZMIY\nALGORITM','KITOB OʻQI!','H₂O = SUV'].map((t,i)=>({img:makeBillboard(t,LANE_COLORS[i%3]), w:1500}));
  SPR.tree = {img:makeTree(), w:900};
  SPR.arch = {img:makeArch(), w:4700};
  SPR.skyFar = makeSkyline(1600,260,'#1c0f3e',false);
  SPR.skyNear = makeSkyline(1600,220,'#0c0822',true);
  SPR.stars = Array.from({length:120},()=>[Math.random(),Math.random()*0.5,Math.random()*1.5+0.3,Math.random()]);
}

/* =========================================================
   TRASSA
   ========================================================= */
const segmentLength=200, rumbleLength=3, roadWidth=2000, lanes=3, drawDistance=300, fogDensity=4.2, cameraHeight=1000, fieldOfView=100;
const cameraDepth=1/Math.tan((fieldOfView/2)*Math.PI/180);
const playerZ=cameraHeight*cameraDepth;
const maxSpeed=9000, nitroSpeed=13800, accel=maxSpeed/4.2, breaking=-maxSpeed*1.2, decel=-maxSpeed/5, offRoadDecel=-maxSpeed/1.8, offRoadLimit=maxSpeed/3.2, centrifugal=0.3;
const LANE_X=[-2/3,0,2/3];
const CAR_W=640, GATE_W=1180;
const LAPS=2, START_SEG=14, GATE_FIRST=170, GATE_GAP=360, SHOW_SEGS=345;
const COLORS={
  LIGHT:{road:'#3a3a52',grass:'#101a2a',rumble:'#ff2d75',lane:'#d9d2ff'},
  DARK:{road:'#34344b',grass:'#0c1524',rumble:'#f0eeff'},
  START:{road:'#fff',grass:'#101a2a',rumble:'#fff',checker:true}
};
const FOG_COLOR='#1d0f40';
let segments=[], trackLength=0, gates=[];

function lastY(){ return segments.length ? segments[segments.length-1].p2.world.y : 0; }
function addSegment(curve,y){
  const n=segments.length;
  segments.push({index:n, p1:{world:{y:lastY(),z:n*segmentLength},camera:{},screen:{}}, p2:{world:{y,z:(n+1)*segmentLength},camera:{},screen:{}}, curve, sprites:[], cars:[], color: Math.floor(n/rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT});
}
function addRoad(enter,hold,leave,curve,y){
  const sy=lastY(), ey=sy+Math.round(y)*segmentLength, total=enter+hold+leave;
  for(let n=0;n<enter;n++) addSegment(easeIn(0,curve,n/enter), easeInOut(sy,ey,n/total));
  for(let n=0;n<hold;n++) addSegment(curve, easeInOut(sy,ey,(enter+n)/total));
  for(let n=0;n<leave;n++) addSegment(easeInOut(curve,0,n/leave), easeInOut(sy,ey,(enter+hold+n)/total));
}
const addStraight=n=>addRoad(n,n,n,0,0), addHill=(n,h)=>addRoad(n,n,n,0,h), addCurve=(n,c,h)=>addRoad(n,n,n,c,h||0);
function addSCurves(){ addRoad(50,50,50,-2,0); addRoad(50,50,50,4,20); addRoad(50,50,50,2,-20); addRoad(50,50,50,-2,20); addRoad(50,50,50,-4,0); }
function addRolling(n,h){ addRoad(n,n,n,0,h/2); addRoad(n,n,n,0,-h); addRoad(n,n,n,1,h); addRoad(n,n,n,0,0); addRoad(n,n,n,-1,h/2); addRoad(n,n,n,0,0); }
function addSprite(n,source,offset){ if(n>=0 && n<segments.length) segments[n].sprites.push({source,offset}); }
function findSegment(z){ return segments[Math.floor(z/segmentLength)%segments.length]; }

function buildTrack(){
  segments=[];
  addStraight(25); addRolling(20,20); addCurve(50,4,10); addStraight(25); addSCurves();
  addCurve(50,-4,-20); addHill(50,40); addCurve(50,3,-40); addStraight(50); addCurve(50,-6,0);
  addRolling(15,30); addCurve(50,5,20); addRoad(70,70,70,-2,-lastY()/segmentLength);
  trackLength=segments.length*segmentLength;
  for(let n=START_SEG;n<START_SEG+rumbleLength;n++) segments[n].color=COLORS.START;
  segments[START_SEG].arch=true;
  // yoʻl boʻyi bezaklari
  for(let n=8;n<segments.length;n+=12){ const p=(Math.floor(n/96)%2===0); addSprite(n,p?SPR.lampL:SPR.lampPL,-1.18); addSprite(n,p?SPR.lampR:SPR.lampPR,1.18); }
  for(let n=4;n<segments.length;n+=5){ addSprite(n,pick(SPR.buildings),-(1.75+Math.random()*1.4)); addSprite(n+2,pick(SPR.buildings),1.75+Math.random()*1.4); }
  for(let n=60;n<segments.length-20;n+=110){ addSprite(n,pick(SPR.boards),(Math.floor(n/110)%2?1.32:-1.32)); }
  for(let n=30;n<segments.length;n+=9){ if(Math.random()<.5) addSprite(n,SPR.tree,(Math.random()<.5?-1:1)*(1.45+Math.random()*0.15)); }
  // savol darvozalari
  gates=[];
  for(let s=GATE_FIRST; s<segments.length-160; s+=GATE_GAP){ const g={seg:s}; segments[s].gate=g; gates.push(g); }
}
function setGateQuestion(g){
  g.q=nextQuestion();
  g.tex=g.q.opts.map((t,i)=>makeGatePanel(t,LANE_COLORS[i]));
}

/* =========================================================
   OVOZ (WebAudio — fayl kerak emas)
   ========================================================= */
const Sound={ctx:null, osc:null, gain:null, filt:null,
  init(){ if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    try{ const A=window.AudioContext||window.webkitAudioContext; this.ctx=new A();
      this.osc=this.ctx.createOscillator(); this.osc.type='sawtooth';
      const o2=this.ctx.createOscillator(); o2.type='square'; this.o2=o2;
      this.filt=this.ctx.createBiquadFilter(); this.filt.type='lowpass'; this.filt.frequency.value=700;
      this.gain=this.ctx.createGain(); this.gain.gain.value=0;
      const g2=this.ctx.createGain(); g2.gain.value=0.35;
      this.osc.connect(this.filt); o2.connect(g2); g2.connect(this.filt); this.filt.connect(this.gain); this.gain.connect(this.ctx.destination);
      this.osc.start(); o2.start();
    }catch(e){ this.ctx=null; } },
  engine(p,on){ if(!this.ctx) return; const t=this.ctx.currentTime; const f=48+p*150;
    this.osc.frequency.setTargetAtTime(f,t,0.06); this.o2.frequency.setTargetAtTime(f*0.5,t,0.06);
    this.filt.frequency.setTargetAtTime(500+p*1400,t,0.1);
    this.gain.gain.setTargetAtTime(on&&!save.muted?0.045:0,t,0.12); },
  tone(freq,dur,type,vol,delay,slide){ if(!this.ctx||save.muted) return; const t=this.ctx.currentTime+(delay||0);
    const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(freq,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(vol||0.15,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+dur+0.02); },
  good(){ this.tone(660,.12,'triangle',.18,0); this.tone(880,.12,'triangle',.18,.09); this.tone(1320,.25,'triangle',.18,.18); this.tone(300,.6,'sawtooth',.05,0,1200); },
  bad(){ this.tone(220,.35,'square',.12,0,90); this.tone(150,.4,'sawtooth',.1,.05,60); },
  bump(){ this.tone(120,.15,'square',.12,0,50); },
  beep(hi){ this.tone(hi?1046:523,hi?.5:.18,'square',.12); },
  coin(){ this.tone(1568,.08,'square',.08,0); this.tone(2093,.15,'square',.08,.07); }
};

/* =========================================================
   OʻYIN HOLATI
   ========================================================= */
let state='menu';            // menu | countdown | race | finish | paused | results
let prevState='race';
let position=0, posAbs=0, playerX=0, speed=0, steerVis=0, nitro=0, shake=0, skyX=0;
let cars=[], startAbs=0, gp=0, lapBase=0, raceTime=0, countdown=0, lastCount=0, finishTimer=0;
let stats={}, finishedOrder=[], playerPlace=6, myCar=null, toastTimer=0, attractT=0;
const keys={left:false,right:false,brake:false};

function carDef(){ return CARS.find(c=>c.id===save.car)||CARS[0]; }

function placeCar(car){
  car.z=((car.dist%trackLength)+trackLength)%trackLength;
  const ns=findSegment(car.z);
  if(ns!==car.seg){ if(car.seg){ const i=car.seg.cars.indexOf(car); if(i>=0) car.seg.cars.splice(i,1); } ns.cars.push(car); car.seg=ns; }
}
function spawnCars(baseAbs){
  for(const s of segments) s.cars=[];
  cars=[];
  const bases=shuffle([0.9,0.94,0.97,1.0,1.03]);
  for(let i=0;i<5;i++){
    const row=Math.floor(i/2)+1, lane = i%2===0 ? 0 : 2;
    const car={dist: baseAbs + row*7*segmentLength + (i===4?0:0), lane: i===4?1:lane, base:bases[i], speed:0, img:makeCar(AI_COLORS[i], AI_NAMES[i].slice(0,5).toUpperCase()), name:AI_NAMES[i], seg:null, finished:false};
    if(i===4){ car.dist = baseAbs + 4*7*segmentLength; }
    car.offset=LANE_X[car.lane];
    placeCar(car); cars.push(car);
  }
}

function resetRace(){
  myCar = carDef(); myCar.img = myCar.img || makeCar(myCar.color,'EDU');
  for(const k in bags) delete bags[k];
  startAbs = START_SEG*segmentLength - 2*segmentLength;
  posAbs = startAbs - playerZ; position=((posAbs%trackLength)+trackLength)%trackLength;
  playerX=0; speed=0; nitro=0; shake=0; steerVis=0;
  for(const g of gates) setGateQuestion(g);
  gp=0; lapBase=0;
  while(gp<gates.length && gates[gp].seg*segmentLength <= startAbs+playerZ) gp++;
  spawnCars(startAbs+playerZ);
  stats={total:0, correct:0, streak:0, bestStreak:0, coins:0, mistakes:[]};
  finishedOrder=[]; raceTime=0; finishTimer=0;
  countdown=3.99; lastCount=4;
  state='countdown';
  showScreen(null); $('hud').classList.remove('hidden');
  $('count').textContent=''; $('qtext').textContent='Tayyorlaning!'; lastQ=null;
}

function nearestLane(x){ return x < -1/3 ? 0 : x > 1/3 ? 2 : 1; }

function resolveGate(g){
  const lane=nearestLane(playerX), ok = lane===g.q.ans;
  stats.total++;
  const val = [0,10,15,20][save.level] || 10;
  if(ok){
    stats.correct++; stats.streak++; stats.bestStreak=Math.max(stats.bestStreak,stats.streak);
    const combo = stats.streak>=3;
    nitro = combo ? 4.2 : 3.2;
    const c = val*(combo?2:1); stats.coins+=c;
    toast(combo?`COMBO ×${stats.streak}! 🔥`:'TOʻGʻRI! 🔥', 'good', `+NITRO   +${c} 🪙`);
    flash('good'); Sound.good(); setTimeout(()=>Sound.coin(),250);
  } else {
    stats.streak=0; speed*=0.3; shake=0.9; nitro=0;
    stats.mistakes.push({q:g.q.q, a:g.q.correct});
    toast('XATO!', 'bad', `Toʻgʻri javob: ${g.q.correct}`);
    flash('bad'); Sound.bad();
    if(navigator.vibrate) try{navigator.vibrate(180);}catch(e){}
  }
  setGateQuestion(g);
}

function updateCars(dt, racing){
  const pAbs=posAbs+playerZ, pLane=nearestLane(playerX);
  for(const car of cars){
    let f=car.base;
    if(racing){ const gap=(car.dist-pAbs)/segmentLength; if(gap>220) f*=0.97; else if(gap<-140) f*=1.08; }
    let target = state==='countdown' ? 0 : (state==='menu' ? 0.55*maxSpeed*f : maxSpeed*f);
    // oldindagi toʻsiq
    let blocked=null;
    for(const o of cars){ if(o===car) continue; const d=o.dist-car.dist; if(d>0 && d<1600 && o.lane===car.lane){ blocked=o; break; } }
    if(!blocked && racing){ const d=pAbs-car.dist; if(d>0 && d<1500 && pLane===car.lane && speed<car.speed) blocked={speed, lane:pLane}; }
    if(blocked){
      const opts=[car.lane-1,car.lane+1].filter(l=>l>=0&&l<=2&&cars.every(o=>o===car||o.lane!==l||Math.abs(o.dist-car.dist)>1400)&&!(racing&&l===pLane&&Math.abs(pAbs-car.dist)<1400));
      if(opts.length) car.lane=pick(opts); else target=Math.min(target,blocked.speed);
    }
    car.speed = approach(car.speed, target, (target>car.speed?accel*0.85:maxSpeed*0.8)*dt);
    car.offset = approach(car.offset, LANE_X[car.lane], dt*0.9);
    car.dist += car.speed*dt;
    placeCar(car);
    if(racing && !car.finished && car.dist-startAbs >= LAPS*trackLength){ car.finished=true; finishedOrder.push(car); }
  }
}

function update(dt){
  if(shake>0) shake=Math.max(0,shake-dt*2);
  if(toastTimer>0){ toastTimer-=dt; if(toastTimer<=0) $('toast').classList.remove('show'); }
  if(state==='paused'||state==='results'){ Sound.engine(0,false); return; }
  if(state==='menu'){
    attractT+=dt; speed=approach(speed,5200,accel*dt); posAbs+=speed*dt; position=((posAbs%trackLength)+trackLength)%trackLength;
    playerX=Math.sin(attractT*0.35)*0.45; const ps=findSegment(position+playerZ); skyX+=ps.curve*0.0006*speed*dt/100;
    updateCars(dt,false); Sound.engine(0,false); return;
  }
  if(state==='countdown'){
    countdown-=dt; const c=Math.ceil(countdown);
    if(c!==lastCount){ lastCount=c; if(c>0){ $('count').textContent=c; Sound.beep(false);} else { $('count').textContent='START!'; Sound.beep(true); } }
    if(countdown<=0){ state='race'; setTimeout(()=>{ if($('count').textContent==='START!') $('count').textContent=''; },700); }
    Sound.engine(0.1,true); updateCars(dt,false); return;
  }
  // race | finish
  raceTime += state==='race' ? dt : 0;
  const pseg=findSegment(position+playerZ);
  const sp=speed/maxSpeed;
  const dx=dt*2*Math.min(1,sp+0.2);
  let steer=0;
  if(state==='race'){ if(keys.left){playerX-=dx;steer=-1;} if(keys.right){playerX+=dx;steer=1;} }
  else playerX=lerp(playerX,LANE_X[nearestLane(playerX)],dt*2);
  playerX -= dx*sp*pseg.curve*centrifugal;
  steerVis=lerp(steerVis,steer,Math.min(1,dt*8));
  const mult=myCar.mult;
  let target=maxSpeed*mult;
  if(nitro>0){ target=nitroSpeed*mult; nitro-=dt; }
  if(state==='finish') target=maxSpeed*0.35;
  if(keys.brake && state==='race') speed+=breaking*dt;
  else if(speed<target) speed+=accel*dt*(nitro>0?2.2:1);
  else speed=Math.max(target, speed+decel*dt);
  if((playerX<-1||playerX>1) && speed>offRoadLimit) speed+=offRoadDecel*dt;
  const pAbs=posAbs+playerZ;
  for(const car of cars){ const d=car.dist-pAbs; if(d>-40 && d<260 && speed>car.speed && overlap(playerX,0.3,car.offset,0.3)){ speed=car.speed*0.82; playerX+= playerX<car.offset?-0.05:0.05; shake=Math.max(shake,0.35); Sound.bump(); break; } }
  playerX=limit(playerX,-2.2,2.2); speed=limit(speed,0,nitroSpeed*mult);
  posAbs+=speed*dt; position=((posAbs%trackLength)+trackLength)%trackLength;
  skyX+=pseg.curve*sp*dt*0.012;
  updateCars(dt,true);
  if(state==='race'){
    const g=gates[gp], gAbs=lapBase+g.seg*segmentLength;
    if(posAbs+playerZ>=gAbs){ resolveGate(g); gp++; if(gp>=gates.length){gp=0; lapBase+=trackLength;} }
    if(posAbs+playerZ-startAbs >= LAPS*trackLength){ state='finish'; playerPlace=1+finishedOrder.length; stats.time=raceTime; finishTimer=2.2; nitro=0; toast(playerPlace===1?'GʻALABA! 🏆':'MARRA!','good',`${playerPlace}-oʻrin`); Sound.good(); }
  } else if(state==='finish'){ finishTimer-=dt; if(finishTimer<=0) showResults(); }
  Sound.engine(Math.min(1.4,speed/maxSpeed),true);
}

/* =========================================================
   RENDER
   ========================================================= */
function project(p,camX,camY,camZ){
  p.camera.x=(p.world.x||0)-camX; p.camera.y=p.world.y-camY; p.camera.z=p.world.z-camZ;
  p.screen.scale=cameraDepth/p.camera.z;
  p.screen.x=Math.round(W/2+p.screen.scale*p.camera.x*W/2);
  p.screen.y=Math.round(H/2-p.screen.scale*p.camera.y*H/2);
  p.screen.w=Math.round(p.screen.scale*roadWidth*W/2);
}
function poly(x1,y1,x2,y2,x3,y3,x4,y4,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.lineTo(x4,y4); ctx.closePath(); ctx.fill(); }
function renderSegment(x1,y1,w1,x2,y2,w2,f,color,idx){
  const r1=w1/6, r2=w2/6, l1=w1/32, l2=w2/32;
  ctx.fillStyle=color.grass; ctx.fillRect(0,y2,W,y1-y2);
  poly(x1-w1-r1,y1,x1-w1,y1,x2-w2,y2,x2-w2-r2,y2,color.rumble);
  poly(x1+w1+r1,y1,x1+w1,y1,x2+w2,y2,x2+w2+r2,y2,color.rumble);
  if(color.checker){
    const n=10; for(let k=0;k<n;k++){ const a1=x1-w1+2*w1*k/n, b1=x1-w1+2*w1*(k+1)/n, a2=x2-w2+2*w2*k/n, b2=x2-w2+2*w2*(k+1)/n; poly(a1,y1,b1,y1,b2,y2,a2,y2,(k+idx)%2?'#f4f4f4':'#16161e'); }
  } else {
    poly(x1-w1,y1,x1+w1,y1,x2+w2,y2,x2-w2,y2,color.road);
    if(color.lane){ const lw1=w1*2/lanes, lw2=w2*2/lanes; let lx1=x1-w1+lw1, lx2=x2-w2+lw2;
      for(let l=1;l<lanes;l++,lx1+=lw1,lx2+=lw2) poly(lx1-l1/2,y1,lx1+l1/2,y1,lx2+l2/2,y2,lx2-l2/2,y2,color.lane); }
  }
  if(f<1){ ctx.globalAlpha=1-f; ctx.fillStyle=FOG_COLOR; ctx.fillRect(0,y2,W,y1-y2); ctx.globalAlpha=1; }
}
function renderSprite(img,worldW,scale,x,y,offX,offY,clipY,alpha){
  if(!(scale>0)) return;
  const dw=worldW*scale*W/2, dh=dw*img.height/img.width;
  x+=dw*offX; y+=dh*offY;
  if(x>W || x+dw<0 || dw<1) return;
  const clipH=clipY?Math.max(0,y+dh-clipY):0;
  if(clipH<dh){ if(alpha<1) ctx.globalAlpha=Math.max(0,alpha); ctx.drawImage(img,0,0,img.width,img.height-(img.height*clipH/dh),x,y,dw,dh-clipH); ctx.globalAlpha=1; }
}
function drawSky(){
  const hz=H/2;
  const gr=ctx.createLinearGradient(0,0,0,hz+10); gr.addColorStop(0,'#04031a'); gr.addColorStop(0.6,'#170a3a'); gr.addColorStop(1,'#3a1460');
  ctx.fillStyle=gr; ctx.fillRect(0,0,W,hz+12);
  ctx.fillStyle='#fff';
  for(const s of SPR.stars){ const x=((s[0]-skyX*0.2)%1+1)%1*W; ctx.globalAlpha=0.35+0.6*Math.abs(Math.sin(performance.now()/900+s[3]*9)); ctx.fillRect(x,s[1]*H,s[2],s[2]); }
  ctx.globalAlpha=1;
  const mx=((0.78-skyX*0.25)%1+1)%1*W, my=H*0.16, mr=Math.max(14,H*0.05);
  const mg=ctx.createRadialGradient(mx,my,mr*0.4,mx,my,mr*3); mg.addColorStop(0,'rgba(255,240,220,.35)'); mg.addColorStop(1,'rgba(255,240,220,0)'); ctx.fillStyle=mg; ctx.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
  ctx.fillStyle='#fff3dc'; ctx.beginPath(); ctx.arc(mx,my,mr,0,Math.PI*2); ctx.fill();
  const layer=(img,par,hgt)=>{ const h=hgt, w=img.width*(h/img.height); let ox=-((skyX*par*W)%w+w)%w; for(let x=ox;x<W;x+=w) ctx.drawImage(img,x,hz+2-h,w+1,h); };
  layer(SPR.skyFar,0.5,H*0.26); layer(SPR.skyNear,1,H*0.19);
  const hg=ctx.createLinearGradient(0,hz-H*0.08,0,hz+4); hg.addColorStop(0,'rgba(29,15,64,0)'); hg.addColorStop(1,FOG_COLOR); ctx.fillStyle=hg; ctx.fillRect(0,hz-H*0.08,W,H*0.08+6);
}
function renderPlayer(seg,pct){
  const sc=cameraDepth/playerZ;
  const camY=lerp(seg.p1.camera.y,seg.p2.camera.y,pct);
  const destY=H/2-(sc*camY*H/2);
  const sp=speed/maxSpeed;
  const bounce=(1.4*Math.random()*sp*H/480)*(Math.random()<.5?-1:1);
  const img=myCar.img, dw=CAR_W*sc*W/2, dh=dw*img.height/img.width;
  ctx.save(); ctx.translate(W/2,destY+bounce); ctx.rotate(steerVis*0.045);
  if(nitro>0){
    const fl=dh*(0.35+Math.random()*0.25);
    for(const ex of [-0.32,0.32]){ const x=ex*dw*0.82; const gr=ctx.createLinearGradient(0,-dh*0.12,0,-dh*0.12+fl); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.3,'rgba(80,220,255,.85)'); gr.addColorStop(1,'rgba(120,60,255,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x-dw*0.05,-dh*0.12); ctx.lineTo(x+dw*0.05,-dh*0.12); ctx.lineTo(x+dw*0.012,-dh*0.12+fl); ctx.lineTo(x-dw*0.012,-dh*0.12+fl); ctx.closePath(); ctx.fill(); }
  }
  ctx.drawImage(img,-dw/2,-dh,dw,dh);
  ctx.restore();
}
function drawSpeedLines(){
  const n=26; ctx.save(); ctx.strokeStyle='rgba(180,240,255,.5)'; ctx.lineWidth=Math.max(1,W/500);
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, r1=Math.max(W,H)*(0.35+Math.random()*0.2), r2=r1+Math.max(W,H)*(0.15+Math.random()*0.25);
    ctx.beginPath(); ctx.moveTo(W/2+Math.cos(a)*r1, H*0.45+Math.sin(a)*r1*0.6); ctx.lineTo(W/2+Math.cos(a)*r2, H*0.45+Math.sin(a)*r2*0.6); ctx.stroke(); }
  ctx.restore();
}
function render(){
  if(!segments.length) return;
  const base=findSegment(position), basePct=pctRem(position,segmentLength);
  const pseg=findSegment(position+playerZ), pPct=pctRem(position+playerZ,segmentLength);
  const playerY=lerp(pseg.p1.world.y,pseg.p2.world.y,pPct);
  let maxy=H, x=0, dx=-(base.curve*basePct);
  ctx.save();
  if(shake>0) ctx.translate((Math.random()-.5)*shake*W*0.015,(Math.random()-.5)*shake*H*0.02);
  drawSky();
  for(let n=0;n<drawDistance;n++){
    const s=segments[(base.index+n)%segments.length];
    s.looped=s.index<base.index; s.fog=fog(n/drawDistance,fogDensity); s.clip=maxy;
    const cz=position-(s.looped?trackLength:0);
    project(s.p1,playerX*roadWidth-x,playerY+cameraHeight,cz);
    project(s.p2,playerX*roadWidth-x-dx,playerY+cameraHeight,cz);
    x+=dx; dx+=s.curve;
    if(s.p1.camera.z<=cameraDepth || s.p2.screen.y>=s.p1.screen.y || s.p2.screen.y>=maxy) continue;
    renderSegment(s.p1.screen.x,s.p1.screen.y,s.p1.screen.w,s.p2.screen.x,s.p2.screen.y,s.p2.screen.w,s.fog,s.color,s.index);
    maxy=s.p1.screen.y;
  }
  const showPlayer = state!=='menu';
  for(let n=drawDistance-1;n>0;n--){
    const s=segments[(base.index+n)%segments.length];
    if(s.p1.camera.z<=cameraDepth) { if(s===pseg && showPlayer) renderPlayer(pseg,pPct); continue; }
    const sc=s.p1.screen.scale, a=Math.min(1,s.fog*1.6);
    for(const sp of s.sprites){ const src=sp.source; const sx=s.p1.screen.x+sc*sp.offset*roadWidth*W/2;
      const ox = (src===SPR.tree||src.w<=300||SPR.boards.includes(src)) ? -0.5 : (sp.offset<0?-1:0);
      renderSprite(src.img,src.w,sc,sx,s.p1.screen.y,ox,-1,s.clip,a); }
    if(s.arch) renderSprite(SPR.arch.img,SPR.arch.w,sc,s.p1.screen.x,s.p1.screen.y,-0.5,-1,s.clip,a);
    if(s.gate && s.gate.tex && state!=='menu') for(let i=0;i<3;i++){ renderSprite(s.gate.tex[i],GATE_W,sc,s.p1.screen.x+sc*LANE_X[i]*roadWidth*W/2,s.p1.screen.y,-0.5,-1,s.clip,a); }
    for(const car of s.cars){ const p=pctRem(car.z,segmentLength); const c2=lerp(s.p1.screen.scale,s.p2.screen.scale,p);
      const cx=lerp(s.p1.screen.x,s.p2.screen.x,p)+c2*car.offset*roadWidth*W/2, cy=lerp(s.p1.screen.y,s.p2.screen.y,p);
      renderSprite(car.img,CAR_W,c2,cx,cy,-0.5,-1,s.clip,a); }
    if(s===pseg && showPlayer) renderPlayer(pseg,pPct);
  }
  if(nitro>0 && state==='race') drawSpeedLines();
  ctx.restore();
}

/* =========================================================
   HUD / UI
   ========================================================= */
let lastQ=null, hudT=0;
const statCache={};
function setStat(id,big,small){ const key=big+'/'+small; if(statCache[id]===key) return; statCache[id]=key; $(id).replaceChildren(String(big), h('span',{text:'/'+small})); }
function toast(text,cls,sub){ const t=$('toast'); t.className='show '+cls; t.replaceChildren(text); if(sub) t.append(h('small',{text:sub})); toastTimer=1.6; }
function flash(cls){ const f=$('flash'); f.className=cls; requestAnimationFrame(()=>requestAnimationFrame(()=>{ f.className=''; })); }
function updateHUD(){
  if(state!=='race'&&state!=='finish'&&state!=='countdown') return;
  const pAbs=posAbs+playerZ;
  const ahead=cars.filter(c=>c.finished||c.dist>pAbs).length;
  const place = state==='finish' ? playerPlace : 1+ahead;
  setStat('hPos',place,6);
  const lap=Math.min(LAPS,Math.max(1,Math.floor((pAbs-startAbs)/trackLength)+1));
  setStat('hLap',lap,LAPS);
  $('hCoins').textContent=stats.coins;
  $('hSpeed').textContent=Math.round(speed/maxSpeed*180);
  $('nitro').style.width=(Math.min(1,nitro/4.2)*100)+'%';
  $('streak').textContent=stats.streak>=2?`Ketma-ket: ${stats.streak} ✓`:'';
  const g=gates[gp];
  if(g && state!=='finish'){
    const gAbs=lapBase+g.seg*segmentLength, dSeg=(gAbs-pAbs)/segmentLength;
    const visible = dSeg<SHOW_SEGS && (gAbs-startAbs) < LAPS*trackLength;
    if(visible){
      if(lastQ!==g.q){ lastQ=g.q; $('qsub').textContent=g.q.sub; $('qtext').textContent=g.q.q; const o=document.querySelectorAll('.opt'); g.q.opts.forEach((t,i)=>o[i].textContent=t); $('qbox').classList.remove('dim'); }
      $('qbar').style.transform=`scaleX(${limit(dSeg/SHOW_SEGS,0,1)})`;
    } else if(lastQ!=='wait'){ lastQ='wait'; $('qsub').textContent='Keyingi savol'; $('qtext').textContent= (gAbs-startAbs) >= LAPS*trackLength ? 'Marraga!' : '…'; document.querySelectorAll('.opt').forEach(o=>o.textContent='—'); $('qbox').classList.add('dim'); $('qbar').style.transform='scaleX(0)'; }
  } else if(state==='finish' && lastQ!=='fin'){ lastQ='fin'; $('qsub').textContent='Poyga tugadi'; $('qtext').textContent='Marra! 🏁'; $('qbox').classList.add('dim'); }
  const lane=nearestLane(playerX); document.querySelectorAll('.opt').forEach((o,i)=>o.classList.toggle('sel',i===lane));
}
function showScreen(id){ ['menu','garage','pause','results'].forEach(s=>$(s).classList.toggle('hidden',s!==id)); }
function fmtTime(t){ const m=Math.floor(t/60), s=t-m*60; return `${m}:${s<10?'0':''}${s.toFixed(1)}`; }
function showResults(){
  state='results';
  const place=playerPlace, bonus=[100,60,40,20,10,5][place-1]||0;
  const earned=stats.coins+bonus; save.coins=Math.min(10000000, save.coins+earned); save.races=Math.min(10000000, save.races+1); if(place===1) save.wins=Math.min(save.races, save.wins+1); persist();
  const acc=stats.total?Math.round(stats.correct/stats.total*100):0;
  const medal=['🥇','🥈','🥉'][place-1]||'🏁';
  $('rPlace').textContent=`${medal} ${place}-oʻrin`;
  $('rStars').textContent= acc>=90?'★★★':acc>=60?'★★☆':'★☆☆';
  $('rSub').textContent = place===1 ? 'Ajoyib! Siz chempionsiz!' : acc>=80 ? 'Bilimingiz zoʻr — endi tezroq haydang!' : 'Yana mashq qiling — har toʻgʻri javob nitro beradi!';
  $('rCorrect').textContent=`${stats.correct}/${stats.total}`; $('rAcc').textContent=acc+'%'; $('rTime').textContent=fmtTime(stats.time||raceTime);
  $('rCoins').textContent=`+${earned}`;
  const m=$('rMist');
  if(stats.mistakes.length){ m.classList.remove('hidden'); m.replaceChildren(h('div',{class:'mhead',text:'📚 Xatolar ustida ishlaymiz:'}), ...stats.mistakes.slice(0,6).map(x=>h('div',null,x.q+' → ',h('b',{text:x.a})))); }
  else m.classList.add('hidden');
  $('hud').classList.add('hidden'); showScreen('results');
}

const SUBJECTS=[['math','🔢','Matematika','Hisob, tenglama'],['eng','🔤','Ingliz tili','Soʻzlar, grammatika'],['know','🧠','Bilimdon','Tarix, fan, geografiya'],['mix','🎲','Aralash','Hamma fanlar']];
const LEVELS=[[1,'1–4-sinf','Boshlangʻich'],[2,'5–9-sinf','Oʻrta'],[3,'10–11-sinf','Yuqori']];
function buildMenu(){
  $('subjects').replaceChildren(...SUBJECTS.map(s=>h('button',{class:'choice'+(save.subject===s[0]?' on':''),data:{s:s[0]}},h('span',{class:'ic',text:s[1]}),s[2],h('small',{text:s[3]}))));
  $('levels').replaceChildren(...LEVELS.map(l=>h('button',{class:'choice'+(save.level===l[0]?' on':''),data:{l:l[0]}},l[1],h('small',{text:l[2]}))));
  $('mCoins').textContent=save.coins;
}
function buildGarage(){
  $('gCoins').textContent=save.coins;
  const list=$('carlist'); list.replaceChildren();
  for(const c of CARS){
    const owned=save.owned.includes(c.id), sel=save.car===c.id;
    const d=document.createElement('div'); d.className='caritem'+(sel?' on':'');
    const cv=makeCar(c.color,'EDU'); d.appendChild(cv);
    const bar=h('i'); bar.style.width=((c.mult-0.9)/0.22*100)+'%';
    d.append(h('b',{text:c.name}), h('small',{text:'Tezlik +'+Math.round((c.mult-1)*100)+'%'}), h('div',{class:'bar'},bar));
    const b=document.createElement('button');
    if(sel){ b.textContent='✓ Tanlangan'; b.disabled=true; }
    else if(owned){ b.textContent='Tanlash'; b.onclick=()=>{ save.car=c.id; persist(); buildGarage(); }; }
    else { b.textContent=`Sotib olish · 🪙${c.price}`; b.className='buy'; b.disabled=save.coins<c.price; b.onclick=()=>{ if(save.coins>=c.price){ save.coins-=c.price; save.owned.push(c.id); save.car=c.id; persist(); Sound.init(); Sound.coin(); buildGarage(); } }; }
    d.appendChild(b); list.appendChild(d);
  }
}
function goMenu(){ state='menu'; $('hud').classList.add('hidden'); buildMenu(); showScreen('menu'); spawnCars(posAbs+playerZ+segmentLength*20); nitro=0; }
function pauseGame(){ if(state==='race'||state==='countdown'||state==='finish'){ prevState=state; state='paused'; showScreen('pause'); } }
function resumeGame(){ if(state==='paused'){ state=prevState; showScreen(null); } }
function soundLabel(){ $('btnSound').textContent = save.muted?'🔇 Ovoz: oʻchirilgan':'🔊 Ovoz: yoqilgan'; }

function bindUI(){
  $('subjects').onclick=e=>{ const b=e.target.closest('[data-s]'); if(!b) return; save.subject=b.dataset.s; persist(); buildMenu(); };
  $('levels').onclick=e=>{ const b=e.target.closest('[data-l]'); if(!b) return; save.level=+b.dataset.l; persist(); buildMenu(); };
  $('btnStart').onclick=()=>{ Sound.init(); resetRace(); };
  $('btnGarage').onclick=()=>{ Sound.init(); buildGarage(); showScreen('garage'); };
  $('btnGBack').onclick=()=>{ buildMenu(); showScreen('menu'); };
  $('btnPause').onclick=pauseGame;
  $('btnResume').onclick=resumeGame;
  $('btnRestart').onclick=()=>resetRace();
  $('btnQuit').onclick=goMenu;
  $('btnSound').onclick=()=>{ save.muted=!save.muted; persist(); soundLabel(); };
  $('btnRAgain').onclick=()=>resetRace();
  $('btnRMenu').onclick=goMenu;
  const hold=(id,key)=>{ const el=$(id);
    const on=e=>{ e.preventDefault(); keys[key]=true; el.classList.add('on'); Sound.init(); };
    const off=e=>{ e.preventDefault(); keys[key]=false; el.classList.remove('on'); };
    el.addEventListener('pointerdown',on); el.addEventListener('pointerup',off); el.addEventListener('pointercancel',off); el.addEventListener('pointerleave',off);
    el.addEventListener('contextmenu',e=>e.preventDefault()); };
  hold('btnL','left'); hold('btnR','right'); hold('btnBrake','brake');
  const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'brake',KeyS:'brake',Space:'brake'};
  addEventListener('keydown',e=>{ if(map[e.code]){ keys[map[e.code]]=true; e.preventDefault(); } if(e.code==='KeyP'||e.code==='Escape'){ state==='paused'?resumeGame():pauseGame(); } });
  addEventListener('keyup',e=>{ if(map[e.code]){ keys[map[e.code]]=false; e.preventDefault(); } });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) pauseGame(); });
  addEventListener('blur',()=>{ keys.left=keys.right=keys.brake=false; });
  if(!('ontouchstart' in window)) { /* klaviatura bor */ } else { document.body.classList.add('nokbd-hint'); }
}
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  let w=innerWidth*dpr, h=innerHeight*dpr; const maxW=1280;
  if(w>maxW){ h=h*maxW/w; w=maxW; }
  W=canvas.width=Math.round(w); H=canvas.height=Math.round(h);
  const portrait=innerHeight>innerWidth && ('ontouchstart' in window);
  $('rotate').classList.toggle('hidden',!portrait);
}

/* ---------- start ---------- */
let last=performance.now(), acc=0; const STEP=1/60;
function frame(now){
  let dt=Math.min(0.1,(now-last)/1000); last=now; acc+=dt;
  while(acc>=STEP){ update(STEP); acc-=STEP; }
  render(); updateHUD();
  requestAnimationFrame(frame);
}
buildSprites(); buildTrack(); for(const g of gates) setGateQuestion(g);
myCar=carDef(); myCar.img=makeCar(myCar.color,'EDU');
posAbs=START_SEG*segmentLength; spawnCars(posAbs+playerZ+segmentLength*20);
bindUI(); soundLabel(); resize(); addEventListener('resize',resize);
buildMenu(); showScreen('menu');
requestAnimationFrame(frame);
// Service worker: Trusted Types siyosati faqat bitta aniq manzilga (sw.js) ruxsat beradi
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  let swUrl='sw.js';
  try{ if(window.trustedTypes && trustedTypes.createPolicy){ const pol=trustedTypes.createPolicy('edurace',{createScriptURL:u=>{ if(u==='sw.js') return u; throw new TypeError('Ruxsat etilmagan skript manzili'); }}); swUrl=pol.createScriptURL('sw.js'); } }catch(e){}
  navigator.serviceWorker.register(swUrl,{scope:'./'}).catch(()=>{});
}

// Test ilgaklari FAQAT lokal ishlab chiqish muhitida (file://, localhost). Saytda (github.io) mavjud emas.
const LOCAL_DEV = location.protocol==='file:' || location.hostname==='localhost' || location.hostname==='127.0.0.1';
if(LOCAL_DEV){ window.EduRace={get state(){return state;}, get place(){return playerPlace;}, get stats(){return stats;}, jumpToEnd(){ posAbs=startAbs+LAPS*trackLength-playerZ-segmentLength*30; }, nextGate(d){ const g=gates[gp]; posAbs=lapBase+g.seg*segmentLength-playerZ-segmentLength*(d||120); return g.q; }, setX(x){playerX=x;}, curQ(){ return gates[gp]&&gates[gp].q; }, steerTo(t){ keys.left = playerX>t+0.08; keys.right = playerX<t-0.08; }}; }
})();
