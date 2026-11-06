/* Edu Race v2 — oʻyin mantiqi.
   Xavfsizlik: innerHTML ishlatilmaydi (Trusted Types majburiy), barcha tashqi/saqlangan maʼlumot qatʼiy tekshiriladi. */
(()=>{
'use strict';
const $ = id => document.getElementById(id);
const FONT = "'Segoe UI',Roboto,system-ui,sans-serif";
const canvas = $('game'), ctx = canvas.getContext('2d');
let W = 0, H = 0;

/* ================= utils ================= */
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const limit = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,p) => a+(b-a)*p;
const easeIn = (a,b,p) => a+(b-a)*p*p;
const easeInOut = (a,b,p) => a+(b-a)*((-Math.cos(p*Math.PI)/2)+0.5);
const pctRem = (n,total) => (n%total)/total;
const approach = (v,t,s) => v<t ? Math.min(t,v+s) : Math.max(t,v-s);
const fog = (d,density) => 1/Math.pow(Math.E, d*d*density);
const overlap = (x1,w1,x2,w2) => !((x1+w1/2) < (x2-w2/2) || (x1-w1/2) > (x2+w2/2));
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function h(tag, props, ...kids){ // xavfsiz DOM yaratish (innerHTML ishlatilmaydi)
  const e=document.createElement(tag);
  if(props) for(const k of Object.keys(props)){ const v=props[k];
    if(k==='class') e.className=v; else if(k==='text') e.textContent=v; else if(k==='data') for(const d of Object.keys(v)) e.dataset[d]=String(v[d]); else if(k!=='style' && !/^on/i.test(k)) e.setAttribute(k,String(v)); }
  for(const c of kids){ if(c!==null && c!==undefined && c!==false) e.append(c); }
  return e;
}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
const pad2 = n => (n<10?'0':'')+n;
function dayStr(d){ d=d||new Date(); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function yesterdayStr(){ const d=new Date(); d.setDate(d.getDate()-1); return dayStr(d); }
function fmtTime(t){ const m=Math.floor(t/60), s=t-m*60; return `${m}:${s<10?'0':''}${s.toFixed(1)}`; }
const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };

/* ================= maʼlumotlar ================= */
const CARS = [
  {id:'ilm1', name:'Ilm-1', color:'#21c8f0', price:0, mult:1.00},
  {id:'chaqmoq', name:'Qizil Chaqmoq', color:'#ff2f5a', price:150, mult:1.03},
  {id:'burgut', name:'Oltin Burgut', color:'#ffbf1f', price:400, mult:1.06},
  {id:'zumrad', name:'Zumrad', color:'#2fe88a', price:800, mult:1.08},
  {id:'kometa', name:'Binafsha Kometa', color:'#a259ff', price:1500, mult:1.10},
  {id:'oq', name:'Oq Lochin', color:'#e8eaf2', price:2500, mult:1.12},
];
const AI_COLORS=['#ff6b2f','#8a8f9e','#d02bd6','#2f6bff','#e8e04a','#20d0a0'];
const AI_NAMES=['Temur','Malika','Jasur','Dilnoza','Bekzod','Sevara'];
const THEMES = [
  { id:'toshkent', name:'Toshkent tuni', ic:'🌃', need:0, sub:'Neon shahar',
    sky:['#04031a','#170a3a','#3a1460'], fog:'#1d0f40', stars:true, orb:{c:'#fff3dc', glow:'rgba(255,240,220,.35)', x:0.78, y:0.16, r:0.05},
    far:{t:'city', c:'#1c0f3e'}, near:{t:'city', c:'#0c0822', lit:true},
    road:{L:{road:'#3a3a52',grass:'#101a2a',rumble:'#ff2d75',lane:'#d9d2ff'}, D:{road:'#34344b',grass:'#0c1524',rumble:'#f0eeff'}},
    wall:['#221d3d','#2b2550','#ff2d75','#2fe6ff'], lamps:['#ffd27a','#ff5fb0'], side:'city' },
  { id:'samarqand', name:'Samarqand shomi', ic:'🕌', need:2, sub:'Madrasalar yoʻli',
    sky:['#2a1747','#a8426a','#ffb070'], fog:'#e58a6c', stars:false, orb:{c:'#ffe0a8', glow:'rgba(255,170,90,.55)', x:0.32, y:0.37, r:0.1},
    far:{t:'domes', c:'#8a4870'}, near:{t:'domes', c:'#4c2347', lit:true},
    road:{L:{road:'#4a3a46',grass:'#5a3b3a',rumble:'#2f9fd8',lane:'#ffe6c4'}, D:{road:'#433440',grass:'#523534',rumble:'#ffe6c4'}},
    wall:['#5c3a3f','#684349','#2f9fd8','#ffcf6b'], lamps:['#ffcf8a','#ffcf8a'], side:'madrasa' },
  { id:'chorvoq', name:'Chorvoq togʻ yoʻli', ic:'⛰️', need:5, sub:'Kunduzi, togʻlar',
    sky:['#3a8ad3','#88c2ee','#d6edfb'], fog:'#bfdcf1', stars:false, orb:{c:'#fffbe8', glow:'rgba(255,255,220,.6)', x:0.72, y:0.13, r:0.05},
    far:{t:'mount', c:'#8fa8c8', snow:true}, near:{t:'mount', c:'#3d7656'},
    road:{L:{road:'#5b5e67',grass:'#4f8f4a',rumble:'#f2f2f2',lane:'#ffffff'}, D:{road:'#555862',grass:'#47853f',rumble:'#d03a3a'}},
    wall:['#9aa3ad','#8a929c','#d03a3a','#f4f4f4'], lamps:null, side:'mountain' },
  { id:'buxoro', name:'Buxoro kunduzi', ic:'🏜️', need:8, sub:'Qadimiy shahar',
    sky:['#5aa6e0','#a9d3f2','#f6e3b8'], fog:'#efdcb2', stars:false, orb:{c:'#fffbe8', glow:'rgba(255,240,200,.6)', x:0.24, y:0.12, r:0.05},
    far:{t:'domes', c:'#cfae7a'}, near:{t:'domes', c:'#a8834f'},
    road:{L:{road:'#6b6258',grass:'#d8b77c',rumble:'#2f86c4',lane:'#fff6dc'}, D:{road:'#655c52',grass:'#d2b075',rumble:'#fff6dc'}},
    wall:['#b8935a','#a98650','#2f86c4','#f2d48a'], lamps:null, side:'oldcity' }
];
const THEME_IDS = THEMES.map(t=>t.id);
const ACH = [
  {id:'first', ic:'🏁', n:'Birinchi start', d:'Birinchi poygani tugating'},
  {id:'win', ic:'🥇', n:'Chempion', d:'Poygada 1-oʻrinni egallang'},
  {id:'perfect', ic:'💯', n:'Mukammal', d:'Hamma savolga toʻgʻri javob bering'},
  {id:'combo5', ic:'🔥', n:'Olovli seriya', d:'Ketma-ket 5 ta toʻgʻri javob'},
  {id:'combo10', ic:'⚡', n:'Toʻxtatib boʻlmas', d:'Ketma-ket 10 ta toʻgʻri javob'},
  {id:'c100', ic:'🧠', n:'Bilimdon', d:'Jami 100 ta toʻgʻri javob'},
  {id:'c500', ic:'🎓', n:'Professor', d:'Jami 500 ta toʻgʻri javob'},
  {id:'s3', ic:'📅', n:'3 kunlik seriya', d:'3 kun ketma-ket oʻynang'},
  {id:'s7', ic:'🗓️', n:'Haftalik qahramon', d:'7 kun ketma-ket oʻynang'},
  {id:'car', ic:'🚗', n:'Yangi mashina', d:'Garajdan mashina sotib oling'},
  {id:'tracks', ic:'🗺️', n:'Sayyoh', d:'Barcha trassalarni oching'},
  {id:'teacher', ic:'👩‍🏫', n:'Oʻqituvchi testi', d:'Oʻqituvchi testini yakunlang'},
  {id:'daily', ic:'☀️', n:'Kunlik gʻolib', d:'Kunlik musobaqani yakunlang'}
];
const ACH_IDS = ACH.map(a=>a.id);
const LEVELS=[[1,'1–4-sinf','Boshlangʻich'],[2,'5–9-sinf','Oʻrta'],[3,'10–11-sinf','Yuqori']];

/* ================= saqlash (qatʼiy sxema) ================= */
const SAVE_KEY='eduRace.v1', DRAFT_KEY='eduRace.quiz', MIST_KEY='eduRace.mist';
function defaults(){ return {coins:0, owned:['ilm1'], car:'ilm1', subject:'math', level:2, muted:false, music:true, quality:'auto', steer:'buttons', track:'toshkent', tutorial:false,
  races:0, wins:0, correct:0, answered:0, subj:{}, stars:{}, best:{}, ach:[], day:'', streak:0, dailyDone:''}; }
// Nomaʼlum kalitlar (masalan __proto__) koʻchirilmaydi; har bir maydon turi va chegarasi tekshiriladi.
function loadSave(){
  const d=defaults();
  let raw=null;
  const s=store.get(SAVE_KEY);
  if(typeof s==='string' && s.length<=16384){ try{ raw=JSON.parse(s); }catch(e){ raw=null; } }
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return d;
  const has=k=>Object.prototype.hasOwnProperty.call(raw,k);
  const int=(v,min,max,def)=>(Number.isSafeInteger(v) && v>=min && v<=max) ? v : def;
  const I=(k,min,max,def)=>int(has(k)?raw[k]:undefined,min,max,def);
  const oneOf=(k,list,def)=>(has(k) && list.includes(raw[k])) ? raw[k] : def;
  const isObj=v=>v && typeof v==='object' && !Array.isArray(v);
  const ids=CARS.map(c=>c.id);
  d.coins=I('coins',0,1e7,0); d.races=I('races',0,1e7,0); d.wins=Math.min(I('wins',0,1e7,0),d.races);
  d.correct=I('correct',0,1e8,0); d.answered=Math.max(I('answered',0,1e8,0),d.correct);
  d.level=I('level',1,3,2);
  d.subject=has('subject')&&raw.subject==='know' ? 'tarix' : oneOf('subject',EduQ.SUBJECT_IDS,'math');
  d.muted=has('muted') && raw.muted===true;
  d.music=!(has('music') && raw.music===false);
  d.tutorial=has('tutorial') && raw.tutorial===true;
  d.quality=oneOf('quality',['auto','high','low'],'auto');
  d.steer=oneOf('steer',['buttons','tilt'],'buttons');
  if(has('owned') && Array.isArray(raw.owned) && raw.owned.length<=CARS.length*2) d.owned=[...new Set(raw.owned.filter(x=>typeof x==='string' && ids.includes(x)))];
  if(!d.owned.includes('ilm1')) d.owned.unshift('ilm1');
  d.car=(has('car') && typeof raw.car==='string' && d.owned.includes(raw.car)) ? raw.car : 'ilm1';
  if(has('subj') && isObj(raw.subj)) for(const id of EduQ.SUBJECT_IDS){ const v=Object.prototype.hasOwnProperty.call(raw.subj,id)?raw.subj[id]:null; if(isObj(v)){ const a=int(v.a,0,1e7,0), c=int(v.c,0,1e7,0); if(a>0) d.subj[id]={a, c:Math.min(c,a)}; } }
  if(has('stars') && isObj(raw.stars)) for(const id of THEME_IDS){ const v=Object.prototype.hasOwnProperty.call(raw.stars,id)?raw.stars[id]:null; const n=int(v,0,3,0); if(n) d.stars[id]=n; }
  if(has('best') && isObj(raw.best)) for(const id of THEME_IDS){ const v=Object.prototype.hasOwnProperty.call(raw.best,id)?raw.best[id]:null; if(typeof v==='number' && Number.isFinite(v) && v>=10 && v<=3600) d.best[id]=Math.round(v*10)/10; }
  if(has('ach') && Array.isArray(raw.ach) && raw.ach.length<=ACH.length*2) d.ach=[...new Set(raw.ach.filter(x=>typeof x==='string' && ACH_IDS.includes(x)))];
  const dateOk=v=>typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  d.day=has('day')&&dateOk(raw.day)?raw.day:''; d.dailyDone=has('dailyDone')&&dateOk(raw.dailyDone)?raw.dailyDone:'';
  d.streak=I('streak',0,100000,0);
  d.track=oneOf('track',THEME_IDS,'toshkent');
  return d;
}
let save = loadSave();
function persist(){ store.set(SAVE_KEY, JSON.stringify(save)); }
function totalStars(){ return THEME_IDS.reduce((s,id)=>s+(save.stars[id]||0),0); }
function isUnlocked(t){ return totalStars()>=t.need; }
if(!isUnlocked(THEMES.find(t=>t.id===save.track))) save.track='toshkent';

// Xatolar banki: [savol, toʻgʻri, xato1, xato2] — qatʼiy tekshiriladi
function loadMistakes(){
  const s=store.get(MIST_KEY); if(typeof s!=='string' || s.length>20000) return [];
  let a; try{ a=JSON.parse(s); }catch(e){ return []; }
  if(!Array.isArray(a)) return [];
  const out=[];
  for(const r of a.slice(0,30)){ if(!Array.isArray(r)||r.length!==4) continue; const q=EduQ.clean(r[0],120), c=EduQ.clean(r[1],40), w1=EduQ.clean(r[2],40), w2=EduQ.clean(r[3],40); if(q&&c&&w1&&w2&&new Set([c,w1,w2]).size===3) out.push([q,c,w1,w2]); }
  return out;
}
let mistakes = loadMistakes();
function saveMistakes(){ store.set(MIST_KEY, JSON.stringify(mistakes.slice(-30))); }

// Oʻqituvchi qoralamasi (faqat qurilmada)
function loadDraft(){
  const blank={t:'', q:[['','','',''],['','','',''],['','','','']]};
  const s=store.get(DRAFT_KEY); if(typeof s!=='string' || s.length>20000) return blank;
  let o; try{ o=JSON.parse(s); }catch(e){ return blank; }
  if(!o || typeof o!=='object' || Array.isArray(o) || !Array.isArray(o.q)) return blank;
  const L=EduQ.LIMITS, str=(v,m)=>typeof v==='string'?v.slice(0,m):'';
  const q=o.q.slice(0,L.max).filter(r=>Array.isArray(r)&&r.length===4).map(r=>[str(r[0],L.q),str(r[1],L.a),str(r[2],L.a),str(r[3],L.a)]);
  return {t:str(o.t,L.title), q:q.length?q:blank.q};
}
let draft = loadDraft();
function saveDraft(){ store.set(DRAFT_KEY, JSON.stringify(draft)); }

/* ================= grafika (spraytlar kodda chiziladi) ================= */
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
  const w=rnd(240,320), hh=rnd(420,780);
  const [c,g]=mkCanvas(w,hh);
  g.fillStyle=pick(['#141030','#101a32','#1c1236','#0e1428','#191a2e']); g.fillRect(0,12,w,hh-12);
  g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(0,12,w*0.18,hh);
  const neon=pick(['#ff2d75','#2fe6ff','#9b5cff','#ffd23c','#3cff9a']);
  g.shadowColor=neon; g.shadowBlur=14; g.fillStyle=neon; g.fillRect(0,10,w,5); g.shadowBlur=0;
  for(let y=34;y<hh-30;y+=26){ for(let x=14;x<w-20;x+=22){ const r=Math.random(); g.fillStyle = r<0.32 ? pick(['#ffe39a','#fff3c4','#9ff3ff','#ffb36b']) : r<0.4 ? '#2a3060' : '#0b0d1e'; g.fillRect(x,y,12,15); } }
  if(Math.random()<.5){ g.shadowColor=neon; g.shadowBlur=18; g.strokeStyle=neon; g.lineWidth=5; const sw=w*0.7; rr(g,(w-sw)/2,40,sw,52,10); g.stroke(); g.fillStyle=neon; g.font=`900 30px ${FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(pick(['ILM','BILIM','KITOB','MAKTAB','OʻQI','EDU','FAN','KOD']),w/2,67); g.shadowBlur=0; }
  return c;
}
function archPath(g,x,y,w,hh){ g.beginPath(); g.moveTo(x,y+hh); g.lineTo(x,y+w*0.55); g.quadraticCurveTo(x,y,x+w/2,y); g.quadraticCurveTo(x+w,y,x+w,y+w*0.55); g.lineTo(x+w,y+hh); g.closePath(); }
function makeMadrasa(accent){
  const [c,g]=mkCanvas(380,440);
  // gumbaz
  const dg=g.createLinearGradient(120,0,260,0); dg.addColorStop(0,shade(accent,.75)); dg.addColorStop(.5,accent); dg.addColorStop(1,shade(accent,.6));
  g.fillStyle=dg; g.beginPath(); g.ellipse(190,78,72,74,0,Math.PI,0); g.fill();
  g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=3; for(let i=-3;i<=3;i++){ g.beginPath(); g.moveTo(190+i*20,78); g.quadraticCurveTo(190+i*12,20,190,4); g.stroke(); }
  g.fillStyle='#e8c070'; g.fillRect(187,-2,6,10);
  g.fillStyle='#2f7fb8'; g.fillRect(118,74,144,26);
  // asosiy bino
  g.fillStyle='#d4ab74'; g.fillRect(0,170,380,270);
  g.fillStyle='#2f7fb8'; g.fillRect(0,170,380,14);
  for(let x=14;x<370;x+=46){ if(x>96&&x<284) continue; g.fillStyle='#3a2a20'; archPath(g,x,232,28,48); g.fill(); g.fillStyle='rgba(255,200,120,.55)'; archPath(g,x+5,240,18,36); g.fill(); g.fillStyle='#3a2a20'; archPath(g,x,320,28,48); g.fill(); }
  // minoralar
  for(const mx of [10,334]){ g.fillStyle='#d4ab74'; g.fillRect(mx,92,36,348); for(let y=110;y<430;y+=46){ g.fillStyle='#2f7fb8'; g.fillRect(mx,y,36,8); } g.fillStyle=accent; g.beginPath(); g.ellipse(mx+18,92,20,14,0,Math.PI,0); g.fill(); }
  // peshtoq
  g.fillStyle='#e2bd87'; g.fillRect(104,56,172,384);
  g.strokeStyle='#2f9fd8'; g.lineWidth=10; g.strokeRect(109,61,162,379);
  g.fillStyle='#1d5a93'; archPath(g,138,150,104,290); g.fill();
  g.fillStyle='rgba(120,210,255,.35)'; for(let y=170;y<430;y+=22){ for(let x=146;x<236;x+=22){ g.save(); g.translate(x+((y/22)%2?11:0),y); g.rotate(Math.PI/4); g.fillRect(-4,-4,8,8); g.restore(); } }
  g.fillStyle='#e8c070'; g.font=`900 18px ${FONT}`; g.textAlign='center'; g.fillText('✦ ✦ ✦',190,120);
  return c;
}
function makeMinaret(base,band){
  const [c,g]=mkCanvas(140,640);
  g.fillStyle=base; g.beginPath(); g.moveTo(15,640); g.lineTo(38,110); g.lineTo(102,110); g.lineTo(125,640); g.closePath(); g.fill();
  for(let y=150,i=0;y<620;y+=58,i++){ g.fillStyle=i%2?band:shade(base,.8); const t=(y-110)/530, hw=32+t*23; g.fillRect(70-hw,y,hw*2,16); }
  g.fillStyle=shade(base,.85); g.fillRect(28,70,84,44);
  g.fillStyle='#3a2a20'; for(let x=34;x<108;x+=19){ archPath(g,x,78,12,30); g.fill(); }
  g.fillStyle=band; g.fillRect(24,62,92,10); g.fillStyle=base; g.beginPath(); g.ellipse(70,62,34,26,0,Math.PI,0); g.fill();
  return c;
}
function makeOldHouse(){
  const w=rnd(280,340), hh=rnd(200,260);
  const [c,g]=mkCanvas(w,hh+60);
  const base=pick(['#cfa86e','#c79c62','#d6b27b']);
  if(Math.random()<.35){ g.fillStyle='#4fa3c9'; g.beginPath(); g.ellipse(w*0.5,62,46,46,0,Math.PI,0); g.fill(); }
  g.fillStyle=base; g.fillRect(0,60,w,hh);
  g.fillStyle=shade(base,.85); g.fillRect(0,60+hh-30,w,30); g.fillRect(0,56,w,10);
  g.strokeStyle='rgba(0,0,0,.08)'; g.lineWidth=2; for(let y=80;y<hh+60;y+=18){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }
  g.fillStyle='#4a3524'; for(let x=24;x<w-30;x+=62){ archPath(g,x,100,30,44); g.fill(); }
  g.fillStyle='#5a3a22'; archPath(g,w/2-22,hh+60-86,44,86); g.fill();
  return c;
}
function makePine(){
  const [c,g]=mkCanvas(200,380);
  g.fillStyle='#4a3020'; g.fillRect(92,300,16,80);
  const cols=['#1d4a31','#245a3b','#2c6b45','#347a4f'];
  for(let i=0;i<4;i++){ const y=40+i*66, hw=40+i*24; g.fillStyle=cols[i]; g.beginPath(); g.moveTo(100,y-30); g.lineTo(100+hw,y+70); g.lineTo(100-hw,y+70); g.closePath(); g.fill(); }
  g.fillStyle='rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(100,10); g.lineTo(60,120); g.lineTo(100,110); g.fill();
  return c;
}
function makeRock(){
  const [c,g]=mkCanvas(260,160);
  const gr=g.createLinearGradient(0,0,0,160); gr.addColorStop(0,'#a3a7ad'); gr.addColorStop(1,'#5d6268');
  g.fillStyle=gr; g.beginPath(); g.moveTo(10,160); g.lineTo(30,70); g.lineTo(90,20); g.lineTo(160,30); g.lineTo(220,80); g.lineTo(250,160); g.closePath(); g.fill();
  g.fillStyle='rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(90,20); g.lineTo(110,90); g.lineTo(60,120); g.lineTo(30,70); g.fill();
  return c;
}
function makeCypress(){
  const [c,g]=mkCanvas(120,380);
  g.fillStyle='#3a2416'; g.fillRect(55,330,10,50);
  const gr=g.createLinearGradient(0,0,120,0); gr.addColorStop(0,'#183524'); gr.addColorStop(.5,'#2c5a3c'); gr.addColorStop(1,'#163020');
  g.fillStyle=gr; g.beginPath(); g.ellipse(60,180,46,170,0,0,Math.PI*2); g.fill();
  return c;
}
function makeRoundTree(a,b){
  const [c,g]=mkCanvas(200,300);
  g.fillStyle='#2a1a14'; g.fillRect(92,180,16,120);
  const gr=g.createRadialGradient(90,100,10,100,120,100); gr.addColorStop(0,a); gr.addColorStop(1,b);
  g.fillStyle=gr; g.beginPath(); g.arc(100,120,90,0,Math.PI*2); g.fill();
  g.fillStyle='rgba(255,255,255,.08)'; g.beginPath(); g.arc(70,90,40,0,Math.PI*2); g.fill();
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
const LANE_COLORS=['#2fe6ff','#ffd23c','#ff2d75'], LETTERS=['A','B','C'];
function makeGatePanel(text, i){
  const col=LANE_COLORS[i];
  const [c,g]=mkCanvas(300,250);
  g.fillStyle='#1b1b2b'; g.fillRect(12,100,18,150); g.fillRect(270,100,18,150);
  g.shadowColor=col; g.shadowBlur=20; g.fillStyle=col; g.fillRect(17,100,8,150); g.fillRect(275,100,8,150);
  g.fillStyle='rgba(8,6,26,.94)'; rr(g,4,4,292,116,18); g.fill();
  g.lineWidth=8; g.strokeStyle=col; rr(g,4,4,292,116,18); g.stroke(); g.shadowBlur=0;
  g.fillStyle=col; g.beginPath(); g.arc(28,28,17,0,Math.PI*2); g.fill();
  g.fillStyle='#0b0820'; g.font=`900 20px ${FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(LETTERS[i],28,29);
  g.fillStyle='#fff';
  let size=64; g.font=`900 ${size}px ${FONT}`; while(g.measureText(text).width>236 && size>18){ size-=2; g.font=`900 ${size}px ${FONT}`; }
  g.fillText(text,160,66);
  return c;
}
function makeCityLayer(w,hh,col,lit){
  const [c,g]=mkCanvas(w,hh);
  let x=0; while(x<w){ const bw=rnd(36,110), bh=rnd(hh*0.25,hh*0.95); g.fillStyle=col; g.fillRect(x,hh-bh,bw-3,bh);
    if(lit){ for(let wy=hh-bh+8; wy<hh-6; wy+=10){ for(let wx=x+5; wx<x+bw-8; wx+=8){ if(Math.random()<0.18){ g.fillStyle=pick(['rgba(255,220,140,.8)','rgba(150,240,255,.7)','rgba(255,120,200,.6)']); g.fillRect(wx,wy,3,4);} } } }
    if(Math.random()<0.15){ g.fillStyle='#ff2d75'; g.fillRect(x+bw/2-1,hh-bh-14,2,14); }
    x+=bw; }
  return c;
}
function makeDomesLayer(w,hh,col,lit){
  const [c,g]=mkCanvas(w,hh); g.fillStyle=col;
  let x=0; while(x<w){ const t=Math.random(), bw=rnd(60,150);
    if(t<0.35){ const bh=rnd(hh*0.25,hh*0.45), r=Math.min(bw*0.38,hh*0.22); g.fillRect(x,hh-bh,bw-4,bh); g.beginPath(); g.ellipse(x+bw/2-2,hh-bh,r,r*1.1,0,Math.PI,0); g.fill(); g.fillRect(x+bw/2-3,hh-bh-r*1.1-10,2,12); }
    else if(t<0.5){ const mh=rnd(hh*0.6,hh*0.95); g.fillRect(x+bw/2-7,hh-mh,14,mh); g.fillRect(x+bw/2-11,hh-mh,22,10); g.beginPath(); g.ellipse(x+bw/2,hh-mh,11,9,0,Math.PI,0); g.fill(); }
    else if(t<0.7){ const bh=rnd(hh*0.4,hh*0.6); g.fillRect(x,hh-bh,bw-4,bh); g.fillStyle=lit?'rgba(255,190,120,.35)':'rgba(255,255,255,.12)'; archPath(g,x+bw*0.25,hh-bh+bh*0.2,bw*0.45,bh*0.8); g.fill(); g.fillStyle=col; }
    else { const bh=rnd(hh*0.12,hh*0.28); g.fillRect(x,hh-bh,bw-2,bh); }
    if(lit && Math.random()<.5){ g.fillStyle='rgba(255,200,120,.75)'; g.fillRect(x+rnd(6,bw-12),hh-rnd(6,hh*0.2),3,4); g.fillStyle=col; }
    x+=bw; }
  return c;
}
function makeMountLayer(w,hh,col,snow){
  const [c,g]=mkCanvas(w,hh);
  const pts=[]; let x=0; const y0=hh*0.55; pts.push([0,y0]);
  while(x<w-60){ x+=rnd(50,140); pts.push([Math.min(x,w-40), rnd(hh*0.05,hh*0.75)]); }
  pts.push([w,y0]);
  if(snow){ const gr=g.createLinearGradient(0,0,0,hh); gr.addColorStop(0,'#f6f9ff'); gr.addColorStop(.26,'#e1eaf5'); gr.addColorStop(.34,col); gr.addColorStop(1,shade(col,.8)); g.fillStyle=gr; } else g.fillStyle=col;
  g.beginPath(); g.moveTo(0,hh); for(const p of pts) g.lineTo(p[0],p[1]); g.lineTo(w,hh); g.closePath(); g.fill();
  return c;
}

const THEME_SPR = {};
const COMMON = {};
function buildCommon(){
  COMMON.arch = {img:makeArch(), w:4700, a:'c'};
  COMMON.boards = ['OʻQI\nOʻYNA · YUT','BILIM —\nKUCH!','EDU RACE','2 × 2 = 4','HELLO = SALOM','AL-XORAZMIY\nALGORITM','KITOB OʻQI!','H₂O = SUV','ПРИВЕТ = SALOM','F = m·a'].map((t,i)=>({img:makeBillboard(t,LANE_COLORS[i%3]), w:1500, a:'e'}));
  COMMON.stars = Array.from({length:120},()=>[Math.random(),Math.random()*0.5,Math.random()*1.5+0.3,Math.random()]);
}
function themeSprites(t){
  if(THEME_SPR[t.id]) return THEME_SPR[t.id];
  const S={};
  if(t.lamps){ S.lampA=[{img:makeLamp(t.lamps[0],false),w:300,a:'c'},{img:makeLamp(t.lamps[0],true),w:300,a:'c'}]; S.lampB=[{img:makeLamp(t.lamps[1],false),w:300,a:'c'},{img:makeLamp(t.lamps[1],true),w:300,a:'c'}]; }
  if(t.side==='city'){ S.big=Array.from({length:10},()=>{const img=makeBuilding(); return {img,w:img.width*8,a:'e'};}); S.trees=[{img:makeRoundTree('#1f6b5a','#0a2a26'),w:900,a:'c'}]; }
  if(t.side==='madrasa'){ S.big=['#35b6c8','#2f8fd0','#3fc4b4'].map(a=>({img:makeMadrasa(a),w:3300,a:'e'})); S.minaret={img:makeMinaret('#d4ab74','#2f7fb8'),w:760,a:'c'}; S.trees=[{img:makeCypress(),w:430,a:'c'},{img:makeRoundTree('#4f7a3a','#24401c'),w:900,a:'c'}]; }
  if(t.side==='mountain'){ S.pines=[{img:makePine(),w:700,a:'c'},{img:makePine(),w:950,a:'c'},{img:makePine(),w:1200,a:'c'}]; S.rock={img:makeRock(),w:950,a:'c'}; }
  if(t.side==='oldcity'){ S.big=Array.from({length:5},()=>{const img=makeOldHouse(); return {img,w:2300,a:'e'};}); S.minaret={img:makeMinaret('#c79c62','#8a5a30'),w:820,a:'c'}; S.trees=[{img:makeRoundTree('#6a9a44','#2f5a20'),w:900,a:'c'}]; }
  const mk=(L,w,hh)=>L.t==='city'?makeCityLayer(w,hh,L.c,L.lit):L.t==='domes'?makeDomesLayer(w,hh,L.c,L.lit):makeMountLayer(w,hh,L.c,L.snow);
  S.far=mk(t.far,1600,260); S.near=mk(t.near,1600,220);
  THEME_SPR[t.id]=S; return S;
}

/* ================= trassa ================= */
const segmentLength=200, rumbleLength=3, roadWidth=2000, lanes=3, fogDensity=4.2, cameraHeight=1000, fieldOfView=100;
let drawDistance=300;
const cameraDepth=1/Math.tan((fieldOfView/2)*Math.PI/180);
const playerZ=cameraHeight*cameraDepth;
const maxSpeed=9000, nitroSpeed=13800, accel=maxSpeed/4.2, breaking=-maxSpeed*1.2, decel=-maxSpeed/5, centrifugal=0.12;
const STEER_RATE=2.7, WALL_OFF=1+1/6, WALL_H=430, EDGE=WALL_OFF-0.16-0.005;
const LANE_X=[-2/3,0,2/3];
const CAR_W=640, GATE_W=1180;
const LAPS=2, START_SEG=14, GATE_FIRST=170, GATE_GAP=360, SHOW_SEGS=345;
const START_COLOR={road:'#fff',grass:'#101a2a',rumble:'#fff',checker:true};
let segments=[], trackLength=0, gates=[], curTheme=THEMES[0], SPR=null;

function lastY(){ return segments.length ? segments[segments.length-1].p2.world.y : 0; }
function addSegment(curve,y){
  const n=segments.length;
  segments.push({index:n, p1:{world:{y:lastY(),z:n*segmentLength},camera:{},screen:{}}, p2:{world:{y,z:(n+1)*segmentLength},camera:{},screen:{}}, curve, sprites:[], cars:[], color: Math.floor(n/rumbleLength)%2 ? curTheme.road.D : curTheme.road.L});
}
function addRoad(enter,hold,leave,curve,y){
  const sy=lastY(), ey=sy+Math.round(y)*segmentLength, total=enter+hold+leave;
  for(let n=0;n<enter;n++) addSegment(easeIn(0,curve,n/enter), easeInOut(sy,ey,n/total));
  for(let n=0;n<hold;n++) addSegment(curve, easeInOut(sy,ey,(enter+n)/total));
  for(let n=0;n<leave;n++) addSegment(easeInOut(curve,0,n/leave), easeInOut(sy,ey,(enter+hold+n)/total));
}
const addStraight=n=>addRoad(n,n,n,0,0), addHill=(n,hh)=>addRoad(n,n,n,0,hh), addCurve=(n,c,hh)=>addRoad(n,n,n,c,hh||0);
function addSCurves(){ addRoad(50,50,50,-2,0); addRoad(50,50,50,4,20); addRoad(50,50,50,2,-20); addRoad(50,50,50,-2,20); addRoad(50,50,50,-4,0); }
function addRolling(n,hh){ addRoad(n,n,n,0,hh/2); addRoad(n,n,n,0,-hh); addRoad(n,n,n,1,hh); addRoad(n,n,n,0,0); addRoad(n,n,n,-1,hh/2); addRoad(n,n,n,0,0); }
function addSprite(n,source,offset){ if(source && n>=0 && n<segments.length) segments[n].sprites.push({source,offset}); }
function findSegment(z){ return segments[Math.floor(z/segmentLength)%segments.length]; }
const LAYOUTS = {
  toshkent(){ addStraight(25); addRolling(20,20); addCurve(50,4,10); addStraight(25); addSCurves(); addCurve(50,-4,-20); addHill(50,40); addCurve(50,3,-40); addStraight(50); addCurve(50,-6,0); addRolling(15,30); addCurve(50,5,20); addRoad(70,70,70,-2,-lastY()/segmentLength); },
  samarqand(){ addStraight(30); addCurve(60,3,0); addRolling(15,15); addSCurves(); addStraight(40); addCurve(50,-5,10); addHill(40,-20); addCurve(60,4,0); addStraight(40); addRolling(18,18); addCurve(50,-3,0); addRoad(70,70,70,2,-lastY()/segmentLength); },
  chorvoq(){ addStraight(25); addCurve(40,5,30); addCurve(40,-5,20); addHill(50,50); addSCurves(); addCurve(50,6,-30); addCurve(50,-6,-30); addRolling(20,35); addCurve(50,4,40); addStraight(30); addCurve(50,-4,0); addRoad(70,70,70,-2,-lastY()/segmentLength); },
  buxoro(){ addStraight(50); addCurve(60,2,0); addStraight(50); addRolling(20,10); addCurve(60,-3,0); addSCurves(); addStraight(60); addCurve(60,3,5); addCurve(60,-2,-5); addStraight(40); addRoad(70,70,70,1,-lastY()/segmentLength); }
};
function decorate(){
  const S=SPR, n0=segments.length, side=()=>Math.random()<.5?-1:1;
  if(S.lampA){ for(let n=8;n<n0;n+=12){ const L=(Math.floor(n/96)%2===0)?S.lampA:S.lampB; addSprite(n,L[0],-1.18); addSprite(n,L[1],1.18); } }
  const t=curTheme.side;
  if(t==='city'){
    for(let n=4;n<n0;n+=5){ addSprite(n,pick(S.big),-(1.75+Math.random()*1.4)); addSprite(n+2,pick(S.big),1.75+Math.random()*1.4); }
    for(let n=30;n<n0;n+=9){ if(Math.random()<.5) addSprite(n,S.trees[0],side()*(1.62+Math.random()*0.12)); }
  } else if(t==='madrasa'){
    for(let n=6;n<n0;n+=11){ addSprite(n,pick(S.big),(Math.floor(n/11)%2?1:-1)*(1.8+Math.random()*0.8)); }
    for(let n=20;n<n0;n+=37){ addSprite(n,S.minaret,side()*(2.0+Math.random()*0.6)); }
    for(let n=3;n<n0;n+=4){ addSprite(n,S.trees[0],(n%8<4?-1:1)*(1.5+Math.random()*0.12)); }
    for(let n=50;n<n0;n+=29){ addSprite(n,S.trees[1],side()*(1.65+Math.random()*0.2)); }
  } else if(t==='mountain'){
    for(let n=2;n<n0;n+=2){ addSprite(n,pick(S.pines),side()*(1.55+Math.random()*2.6)); }
    for(let n=9;n<n0;n+=17){ addSprite(n,S.rock,side()*(1.6+Math.random()*0.8)); }
  } else {
    for(let n=4;n<n0;n+=6){ addSprite(n,pick(S.big),(Math.floor(n/6)%2?1:-1)*(1.75+Math.random()*0.7)); }
    for(let n=25;n<n0;n+=45){ addSprite(n,S.minaret,side()*(2.1+Math.random()*0.5)); }
    for(let n=12;n<n0;n+=8){ addSprite(n,S.trees[0],side()*(1.6+Math.random()*0.1)); }
  }
  const step = t==='mountain' ? 160 : 110;
  for(let n=60;n<n0-20;n+=step){ addSprite(n,pick(COMMON.boards),(Math.floor(n/step)%2?1.55:-1.55)); }
}
function buildTrack(theme){
  curTheme=theme; SPR=themeSprites(theme);
  segments=[];
  (LAYOUTS[theme.id]||LAYOUTS.toshkent)();
  trackLength=segments.length*segmentLength;
  for(let n=START_SEG;n<START_SEG+rumbleLength;n++) segments[n].color=Object.assign({},START_COLOR,{grass:theme.road.L.grass});
  segments[START_SEG].arch=true;
  decorate();
  gates=[];
  for(let s=GATE_FIRST; s<segments.length-160; s+=GATE_GAP){ const g={seg:s}; segments[s].gate=g; gates.push(g); }
}

/* ================= ovoz va musiqa (WebAudio, fayllarsiz) ================= */
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
    this.gain.gain.setTargetAtTime(on&&!save.muted?0.04:0,t,0.12); },
  tone(freq,dur,type,vol,delay,slide){ if(!this.ctx||save.muted) return; const t=this.ctx.currentTime+(delay||0);
    const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(freq,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(vol||0.15,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+dur+0.02); },
  good(){ this.tone(660,.12,'triangle',.18,0); this.tone(880,.12,'triangle',.18,.09); this.tone(1320,.25,'triangle',.18,.18); this.tone(300,.6,'sawtooth',.05,0,1200); },
  bad(){ this.tone(220,.35,'square',.12,0,90); this.tone(150,.4,'sawtooth',.1,.05,60); },
  bump(){ this.tone(120,.15,'square',.12,0,50); },
  scrape(){ this.tone(900,.12,'sawtooth',.035,0,500); },
  beep(hi){ this.tone(hi?1046:523,hi?.5:.18,'square',.12); },
  coin(){ this.tone(1568,.08,'square',.08,0); this.tone(2093,.15,'square',.08,.07); },
  fanfare(){ [523,659,784,1046].forEach((f,i)=>this.tone(f,.22,'triangle',.14,i*.12)); }
};
const Music={timer:null, step:0, nextT:0, master:null, noise:null,
  // Synthwave: Am – F – C – G, 112 BPM
  start(){ const c=Sound.ctx; if(!c || this.timer || !save.music) return;
    if(!this.master){ this.master=c.createGain(); this.master.connect(c.destination);
      const len=c.sampleRate*0.2, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this.noise=buf; }
    this.master.gain.cancelScheduledValues(c.currentTime); this.master.gain.setTargetAtTime(0.055,c.currentTime,0.4);
    this.nextT=c.currentTime+0.06;
    this.timer=setInterval(()=>this.tick(),25); },
  stop(){ if(this.timer){ clearInterval(this.timer); this.timer=null; } if(this.master&&Sound.ctx) this.master.gain.setTargetAtTime(0,Sound.ctx.currentTime,0.15); },
  tick(){ const c=Sound.ctx, sp=60/112/4; while(this.nextT<c.currentTime+0.12){ this.note(this.step,this.nextT,sp); this.nextT+=sp; this.step=(this.step+1)%64; } },
  osc(type,f,t,dur,vol,dest){ const c=Sound.ctx, o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(dest||this.master); o.start(t); o.stop(t+dur+0.02); return o; },
  note(s,t,sp){ const c=Sound.ctx, bar=Math.floor(s/16)%4, i=s%16;
    const roots=[55,43.65,65.41,49], chords=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]];
    if(i%2===0) this.osc('sawtooth', roots[bar]*(i%4===2?2:1), t, sp*1.6, 0.28);
    if(i%4===0){ const k=this.osc('sine',140,t,0.25,0.9); k.frequency.exponentialRampToValueAtTime(42,t+0.2); }
    if(i%4===2){ const n=c.createBufferSource(); n.buffer=this.noise; const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7000; const g=c.createGain(); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.05); n.connect(hp); hp.connect(g); g.connect(this.master); n.start(t); n.stop(t+0.06); }
    const ch=chords[bar]; this.osc('triangle', ch[i%3]*2, t, sp*0.9, 0.07);
    if(i===0) for(const f of ch) this.osc('sawtooth', f, t, sp*15, 0.025);
  }
};

/* ================= telefonni qiyshaytirib boshqarish ================= */
const Tilt={active:false, raw:0, offset:0, value:0, bound:false,
  handler(e){ if(e.beta==null && e.gamma==null) return; // sensorsiz qurilmalar null hodisa yuboradi
    const ang=(screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(window.orientation||0);
    const b=typeof e.beta==='number'?e.beta:0, g=typeof e.gamma==='number'?e.gamma:0;
    Tilt.raw = ang===90 ? b : (ang===270||ang===-90) ? -b : g; Tilt.active=true;
    const v=(Tilt.raw-Tilt.offset)/22; Tilt.value=Math.abs(v)<0.12?0:limit(v,-1,1); },
  bind(){ if(this.bound) return; addEventListener('deviceorientation',this.handler); this.bound=true; },
  calibrate(){ this.offset=this.raw; },
  async request(){ try{ if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){ const r=await DeviceOrientationEvent.requestPermission(); if(r==='denied') return false; } this.bind(); return true; }catch(e){ return false; } }
};

/* ================= oʻyin holati ================= */
let state='menu';            // menu | countdown | race | finish | paused | results
let prevState='race', mode='normal', activeQuiz=null, raceTheme=THEMES[0], raceSubject='math', raceLevel=2;
let netRaceId=null, raceSerial=0, curRoom=null, syncTimer=null, lobbyTimer=null, syncBusy=false, onlineEndAt=0, onlinePaused=false;
let position=0, posAbs=0, playerX=0, speed=0, steerVis=0, nitro=0, shake=0, skyX=0, scrapeT=0;
let cars=[], startAbs=0, gp=0, lapBase=0, raceTime=0, countdown=0, lastCount=0, finishTimer=0;
let stats={}, finishedOrder=[], playerPlace=6, myCar=null, toastTimer=0, attractT=0, achTimer=0;
let particles=[], carBox=null, runtimeLow=false, fpsAcc=0, fpsN=0, fpsChecked=false;
const keys={left:false,right:false,brake:false};
const achQueue=[];

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
    const row=Math.floor(i/2)+1, lane = i===4 ? 1 : (i%2===0 ? 0 : 2);
    const car={dist: baseAbs + (i===4?4:row)*7*segmentLength, lane, base:bases[i], speed:0, img:makeCar(AI_COLORS[i], AI_NAMES[i].slice(0,5).toUpperCase()), color:AI_COLORS[i], name:AI_NAMES[i], seg:null, finished:false};
    car.offset=LANE_X[car.lane];
    placeCar(car); cars.push(car);
  }
}
function carColor(id){ return (CARS.find(c=>c.id===id)||CARS[0]).color; }
function spawnRemote(room){
  for(const s of segments) s.cars=[];
  cars=[];
  const meId=EduNet.me&&EduNet.me.id;
  room.players.forEach((p,i)=>{ if(p.id===meId){ playerX=LANE_X[i%3]; return; }
    const car={remote:true, id:p.id, nick:p.nick, color:carColor(p.car), dist:startAbs, lane:i%3, offset:LANE_X[i%3], speed:0, img:makeCar(carColor(p.car), String(p.nick).slice(0,5).toUpperCase()), seg:null, finished:false, lp:0, lt:0, vel:0, tx:LANE_X[i%3], ft:null, gone:false};
    placeCar(car); cars.push(car);
  });
}
function applyRoom(room){
  if(!room) return;
  if(curRoom) curRoom.room=room;
  if(mode!=='online') return;
  const ids=new Set(room.players.map(p=>p.id));
  for(const c of cars){ if(!ids.has(c.id)) c.gone=true; }
  for(const p of room.players){ const c=cars.find(x=>x.id===p.id); if(!c) continue;
    if(p.s && p.s.t>c.lt){ if(c.lt) c.vel=limit((p.s.p-c.lp)/Math.max(0.2,(p.s.t-c.lt)/1000),0,0.03); c.lp=p.s.p; c.lt=p.s.t; c.tx=p.s.x; }
    if(p.ft!==null && p.ft!==undefined){ c.ft=p.ft; c.finished=true; } }
}
function updateRemote(dt){
  const total=LAPS*trackLength, now=EduNet.serverNow();
  for(const c of cars){
    if(c.gone) continue;
    let p=c.lp; if(c.lt && !c.finished) p=Math.min(c.lp+0.03, c.lp+c.vel*Math.max(0,(now-c.lt)/1000)); p=limit(p,0,1.02);
    const target=startAbs+p*total;
    if(state==='countdown') { placeCar(c); continue; }
    const diff=target-c.dist; c.dist += Math.abs(diff)>total*0.2 ? diff : diff*Math.min(1,dt*3);
    c.speed=c.vel*total; c.offset=lerp(c.offset,limit(c.tx,-EDGE,EDGE),Math.min(1,dt*4));
    placeCar(c);
  }
  cars=cars.filter(c=>!c.gone || (c.seg && (c.seg.cars.splice(c.seg.cars.indexOf(c),1),false)));
}
function onlineRanks(){
  const meId=EduNet.me&&EduNet.me.id, pAbs=posAbs+playerZ, total=LAPS*trackLength;
  const list=cars.filter(c=>!c.gone).map(c=>({id:c.id, nick:c.nick, ft:c.ft, p:(c.dist-startAbs)/total, me:false}));
  const myFt=curRoom&&curRoom.room ? (curRoom.room.players.find(p=>p.id===meId)||{}).ft : null;
  list.push({id:meId, nick:EduNet.me?EduNet.me.nick:'Siz', ft:(myFt===undefined?null:myFt), p:(pAbs-startAbs)/total, me:true, local:state==='finish'||state==='results'});
  list.sort((a,b)=>{ const af=a.ft!==null, bf=b.ft!==null; if(af&&bf) return a.ft-b.ft; if(af) return -1; if(bf) return 1; if(a.local!==b.local) return a.local?-1:1; return b.p-a.p; });
  return list;
}
async function syncTick(){
  if(syncBusy || !curRoom || mode!=='online') return;
  if(state==='results' && Date.now()>onlineEndAt){ stopSync(); return; }
  syncBusy=true;
  try{
    const total=LAPS*trackLength, done=state==='finish'||state==='results';
    const p=done?1:limit((posAbs+playerZ-startAbs)/total,0,1.05);
    const j=await EduNet.room.sync(curRoom.code,{p, x:Math.round(limit(playerX,-2.4,2.4)*100)/100, c:Math.min(40,stats.correct||0), fin:done});
    applyRoom(j.room);
    if(state==='results') renderOnlineResults();
  }catch(e){ /* tarmoq uzilishi — keyingi urinishda davom etadi */ }
  syncBusy=false;
}
function stopSync(){ if(syncTimer){ clearInterval(syncTimer); syncTimer=null; } }
function useTheme(theme){ if(curTheme!==theme || !segments.length) buildTrack(theme); }

function nextQuestion(){
  if(mode==='quiz' && activeQuiz) return EduQ.fromList('quiz', activeQuiz.q, '📋 '+activeQuiz.t);
  if(mode==='review' && mistakes.length) return EduQ.fromList('rev', mistakes, '📚 Xatolar ustida ishlash');
  return EduQ.generate(raceSubject, raceLevel);
}
function setGateQuestion(g){
  g.q=nextQuestion();
  g.tex=g.q.opts.map((t,i)=>makeGatePanel(t,i));
}
function startRace(m, room){
  Sound.init();
  mode=m||'normal';
  const today=dayStr(); raceSerial++; netRaceId=null; onlinePaused=false;
  raceSubject=save.subject; raceLevel=save.level;
  if(mode==='daily'){ const hsh=EduQ.hashStr('edurace-'+today); EduQ.seed(hsh); raceTheme=THEMES[hsh%THEMES.length]; raceSubject='mix'; }
  else if(mode==='online' && room){ EduQ.seed(room.seed>>>0); raceTheme=THEMES.find(t=>t.id===room.track)||THEMES[0]; raceSubject=room.subject; raceLevel=room.level; }
  else { EduQ.unseed(); raceTheme=THEMES.find(t=>t.id===save.track)||THEMES[0]; if(mode==='online') mode='normal'; }
  if(mode==='review' && !mistakes.length) mode='normal';
  useTheme(raceTheme);
  EduQ.resetBags();
  myCar=carDef(); myCar.img=myCar.img||makeCar(myCar.color,'EDU');
  startAbs=START_SEG*segmentLength-2*segmentLength;
  posAbs=startAbs-playerZ; position=((posAbs%trackLength)+trackLength)%trackLength;
  playerX=0; speed=0; nitro=0; shake=0; steerVis=0; particles=[];
  for(const g of gates) setGateQuestion(g);
  gp=0; lapBase=0;
  while(gp<gates.length && gates[gp].seg*segmentLength<=startAbs+playerZ) gp++;
  stopSync();
  if(mode==='online'){ spawnRemote(room); syncTimer=setInterval(syncTick,600); onlineEndAt=Infinity; }
  else spawnCars(startAbs+playerZ);
  stats={total:0, correct:0, streak:0, bestStreak:0, coins:0, mistakes:[], subj:{}};
  finishedOrder=[]; raceTime=0; finishTimer=0; fpsAcc=0; fpsN=0;
  countdown = mode==='online' ? limit((room.startAt-EduNet.serverNow())/1000,0.8,6) : 3.99; lastCount=Math.ceil(countdown)+1; state='countdown';
  if((mode==='normal'||mode==='daily') && EduNet.me && EduNet.available){ const ser=raceSerial; EduNet.startRace(mode,raceTheme.id).then(id=>{ if(ser===raceSerial) netRaceId=id; }); }
  if(save.steer==='tilt') Tilt.calibrate();
  showScreen(null); $('hud').classList.remove('hidden');
  $('count').textContent=''; $('qtext').textContent='Tayyorlaning!'; lastQ=null;
  buildRaceMap();
  Music.start();
}
function nearestLane(x){ return x < -1/3 ? 0 : x > 1/3 ? 2 : 1; }
function subjOf(q){ const s=(q.sub||'').split(' ·')[0]; const f=EduQ.SUBJECTS.find(x=>x.name===s); return f?f.id:null; }
function resolveGate(g){
  const lane=nearestLane(playerX), ok=lane===g.q.ans;
  stats.total++;
  const sid=subjOf(g.q); if(sid){ const r=stats.subj[sid]||(stats.subj[sid]={a:0,c:0}); r.a++; if(ok) r.c++; }
  const val=[0,10,15,20][save.level]||10;
  const row=[g.q.q, g.q.correct, ...g.q.opts.filter(o=>o!==g.q.correct)];
  if(ok){
    stats.correct++; stats.streak++; stats.bestStreak=Math.max(stats.bestStreak,stats.streak);
    const combo=stats.streak>=3;
    nitro=combo?4.2:3.2;
    const c=val*(combo?2:1); stats.coins+=c;
    toast(combo?`COMBO ×${stats.streak}! 🔥`:'TOʻGʻRI! 🔥','good',`+NITRO   +${c} 🪙`);
    flash('good'); Sound.good(); setTimeout(()=>Sound.coin(),250);
    if(mode==='review'){ const i=mistakes.findIndex(m=>m[0]===row[0]); if(i>=0){ mistakes.splice(i,1); saveMistakes(); } }
    if(stats.streak>=5) unlockAch('combo5'); if(stats.streak>=10) unlockAch('combo10');
  } else {
    stats.streak=0; speed*=0.3; shake=0.9; nitro=0;
    stats.mistakes.push({q:g.q.q, a:g.q.correct});
    if(mode!=='review' && mode!=='quiz' && !mistakes.some(m=>m[0]===row[0])){ mistakes.push(row); if(mistakes.length>30) mistakes.shift(); saveMistakes(); }
    toast('XATO!','bad',`Toʻgʻri javob: ${g.q.correct}`);
    flash('bad'); Sound.bad();
    if(navigator.vibrate) try{ navigator.vibrate(180); }catch(e){}
  }
  setGateQuestion(g);
}
function updateCars(dt, racing){
  if(mode==='online' && state!=='menu'){ updateRemote(dt); return; }
  const pAbs=posAbs+playerZ, pLane=nearestLane(playerX);
  for(const car of cars){
    let f=car.base;
    if(racing){ const gap=(car.dist-pAbs)/segmentLength; if(gap>220) f*=0.97; else if(gap<-140) f*=1.08; }
    let target = state==='countdown' ? 0 : (state==='menu' ? 0.55*maxSpeed*f : maxSpeed*f);
    let blocked=null;
    for(const o of cars){ if(o===car) continue; const d=o.dist-car.dist; if(d>0 && d<1600 && o.lane===car.lane){ blocked=o; break; } }
    if(!blocked && racing){ const d=pAbs-car.dist; if(d>0 && d<1500 && pLane===car.lane && speed<car.speed) blocked={speed, lane:pLane}; }
    if(blocked){
      const opts=[car.lane-1,car.lane+1].filter(l=>l>=0&&l<=2&&cars.every(o=>o===car||o.lane!==l||Math.abs(o.dist-car.dist)>1400)&&!(racing&&l===pLane&&Math.abs(pAbs-car.dist)<1400));
      if(opts.length) car.lane=pick(opts); else target=Math.min(target,blocked.speed);
    }
    car.speed=approach(car.speed,target,(target>car.speed?accel*0.85:maxSpeed*0.8)*dt);
    car.offset=approach(car.offset,LANE_X[car.lane],dt*0.9);
    car.dist+=car.speed*dt;
    placeCar(car);
    if(racing && !car.finished && car.dist-startAbs>=LAPS*trackLength){ car.finished=true; finishedOrder.push(car); }
  }
}
function spawnSparks(side){
  if(!carBox || particles.length>140) return;
  for(let i=0;i<4;i++) particles.push({x:carBox.x+side*carBox.w*0.47, y:carBox.y-carBox.h*0.18, vx:-side*(60+Math.random()*160)*W/1280, vy:-(80+Math.random()*220)*H/720, life:0.35+Math.random()*0.3, c:pick(['#ffd23c','#ff9a2f','#fff3b0']), s:2+Math.random()*3});
}
function spawnNitro(){
  if(!carBox || particles.length>140) return;
  for(const ex of [-0.27,0.27]) particles.push({x:carBox.x+ex*carBox.w, y:carBox.y-carBox.h*0.08, vx:(Math.random()-.5)*60, vy:(80+Math.random()*120)*H/720, life:0.25+Math.random()*0.2, c:pick(['#7fe9ff','#b18cff','#ffffff']), s:2+Math.random()*3});
}
function updateParticles(dt){ for(const p of particles){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=600*dt*H/720; p.life-=dt; } particles=particles.filter(p=>p.life>0); }

function update(dt){
  if(shake>0) shake=Math.max(0,shake-dt*2);
  if(toastTimer>0){ toastTimer-=dt; if(toastTimer<=0) $('toast').classList.remove('show'); }
  if(achTimer>0){ achTimer-=dt; if(achTimer<=0){ $('achToast').classList.add('hidden'); showNextAch(); } }
  updateParticles(dt);
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
  raceTime += state==='race' ? dt : 0;
  const pseg=findSegment(position+playerZ);
  const sp=speed/maxSpeed;
  const dx=dt*2*Math.min(1,sp+0.2);
  const steerDx=dt*STEER_RATE*Math.min(1,sp+0.45);
  let steer=0;
  if(state==='race'){
    if(keys.left){ playerX-=steerDx; steer=-1; } if(keys.right){ playerX+=steerDx; steer=1; }
    if(!steer && save.steer==='tilt' && Tilt.active && Tilt.value){ playerX+=steerDx*Tilt.value*1.15; steer=Math.sign(Tilt.value); }
  }
  if(steer===0){ const lx=LANE_X[nearestLane(playerX)]; playerX=lerp(playerX,lx,Math.min(1,dt*(state==='race'?1.1:2))); }
  playerX -= dx*sp*pseg.curve*centrifugal;
  steerVis=lerp(steerVis,steer,Math.min(1,dt*8));
  const mult=myCar.mult;
  let target=maxSpeed*mult;
  if(nitro>0){ target=nitroSpeed*mult; nitro-=dt; if(Math.random()<0.6) spawnNitro(); }
  if(state==='finish') target=maxSpeed*0.35;
  if(keys.brake && state==='race') speed+=breaking*dt;
  else if(speed<target) speed+=accel*dt*(nitro>0?2.2:1);
  else speed=Math.max(target, speed+decel*dt);
  const pAbs=posAbs+playerZ;
  for(const car of cars){ if(car.remote) continue; const d=car.dist-pAbs; if(d>-40 && d<260 && speed>car.speed && overlap(playerX,0.3,car.offset,0.3)){ speed=car.speed*0.82; playerX+= playerX<car.offset?-0.05:0.05; shake=Math.max(shake,0.35); Sound.bump(); break; } }
  if(scrapeT>0) scrapeT-=dt;
  if(Math.abs(playerX)>EDGE){
    playerX=Math.sign(playerX)*EDGE;
    if(state==='race' && speed>maxSpeed*0.25){ speed-=maxSpeed*0.35*dt; shake=Math.max(shake,0.12); spawnSparks(Math.sign(playerX)); if(scrapeT<=0){ Sound.scrape(); scrapeT=0.35; } }
  }
  speed=limit(speed,0,nitroSpeed*mult);
  posAbs+=speed*dt; position=((posAbs%trackLength)+trackLength)%trackLength;
  skyX+=pseg.curve*sp*dt*0.012;
  updateCars(dt,true);
  if(state==='race'){
    const g=gates[gp], gAbs=lapBase+g.seg*segmentLength;
    if(posAbs+playerZ>=gAbs){ resolveGate(g); gp++; if(gp>=gates.length){ gp=0; lapBase+=trackLength; } }
    if(posAbs+playerZ-startAbs>=LAPS*trackLength){ state='finish'; playerPlace= mode==='online' ? 1+cars.filter(c=>c.finished).length : 1+finishedOrder.length; if(mode==='online') syncTick(); stats.time=raceTime; finishTimer=2.2; nitro=0; toast(playerPlace===1?'GʻALABA! 🏆':'MARRA!','good',`${playerPlace}-oʻrin`); Sound.fanfare(); }
  } else if(state==='finish'){ finishTimer-=dt; if(finishTimer<=0) showResults(); }
  Sound.engine(Math.min(1.4,speed/maxSpeed),true);
}

/* ================= render ================= */
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
  if(f<1){ ctx.globalAlpha=1-f; ctx.fillStyle=curTheme.fog; ctx.fillRect(0,y2,W,y1-y2); ctx.globalAlpha=1; }
}
function renderWalls(s,alpha){
  const p1=s.p1.screen, p2=s.p2.screen;
  if(!(p1.scale>0)) return;
  const h1=p1.scale*WALL_H*H/2, h2=p2.scale*WALL_H*H/2, odd=Math.floor(s.index/rumbleLength)%2, w=curTheme.wall;
  ctx.globalAlpha=alpha;
  for(const side of [-1,1]){
    const x1=p1.x+side*p1.w*WALL_OFF, x2=p2.x+side*p2.w*WALL_OFF;
    poly(x1,p1.y,x2,p2.y,x2,p2.y-h2,x1,p1.y-h1, odd?w[0]:w[1]);
    const t1=Math.max(1,h1*0.2), t2=Math.max(1,h2*0.2);
    poly(x1,p1.y-h1,x2,p2.y-h2,x2,p2.y-h2+t2,x1,p1.y-h1+t1, odd?w[2]:w[3]);
  }
  ctx.globalAlpha=1;
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
  const t=curTheme, hz=H/2;
  const gr=ctx.createLinearGradient(0,0,0,hz+10); gr.addColorStop(0,t.sky[0]); gr.addColorStop(0.6,t.sky[1]); gr.addColorStop(1,t.sky[2]);
  ctx.fillStyle=gr; ctx.fillRect(0,0,W,hz+12);
  if(t.stars){ ctx.fillStyle='#fff'; for(const s of COMMON.stars){ const x=((s[0]-skyX*0.2)%1+1)%1*W; ctx.globalAlpha=0.35+0.6*Math.abs(Math.sin(performance.now()/900+s[3]*9)); ctx.fillRect(x,s[1]*H,s[2],s[2]); } ctx.globalAlpha=1; }
  const o=t.orb, mx=((o.x-skyX*0.25)%1+1)%1*W, my=H*o.y, mr=Math.max(14,H*o.r);
  const mg=ctx.createRadialGradient(mx,my,mr*0.4,mx,my,mr*3); mg.addColorStop(0,o.glow); mg.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=mg; ctx.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
  ctx.fillStyle=o.c; ctx.beginPath(); ctx.arc(mx,my,mr,0,Math.PI*2); ctx.fill();
  const layer=(img,par,hgt)=>{ const w=img.width*(hgt/img.height); let ox=-((skyX*par*W)%w+w)%w; for(let x=ox;x<W;x+=w) ctx.drawImage(img,x,hz+2-hgt,w+1,hgt); };
  layer(SPR.far,0.5,H*0.26); layer(SPR.near,1,H*0.19);
  const hg=ctx.createLinearGradient(0,hz-H*0.08,0,hz+4); hg.addColorStop(0,'rgba(0,0,0,0)'); hg.addColorStop(1,t.fog); ctx.fillStyle=hg; ctx.fillRect(0,hz-H*0.08,W,H*0.08+6);
}
function renderPlayer(seg,pct){
  const sc=cameraDepth/playerZ;
  const camY=lerp(seg.p1.camera.y,seg.p2.camera.y,pct);
  const destY=H/2-(sc*camY*H/2);
  const sp=speed/maxSpeed;
  const bounce=(1.4*Math.random()*sp*H/480)*(Math.random()<.5?-1:1);
  const img=myCar.img, dw=CAR_W*sc*W/2, dh=dw*img.height/img.width;
  carBox={x:W/2, y:destY, w:dw, h:dh};
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
  ctx.save(); ctx.strokeStyle='rgba(180,240,255,.5)'; ctx.lineWidth=Math.max(1,W/500);
  for(let i=0;i<26;i++){ const a=Math.random()*Math.PI*2, r1=Math.max(W,H)*(0.35+Math.random()*0.2), r2=r1+Math.max(W,H)*(0.15+Math.random()*0.25);
    ctx.beginPath(); ctx.moveTo(W/2+Math.cos(a)*r1, H*0.45+Math.sin(a)*r1*0.6); ctx.lineTo(W/2+Math.cos(a)*r2, H*0.45+Math.sin(a)*r2*0.6); ctx.stroke(); }
  ctx.restore();
}
function drawParticles(){ for(const p of particles){ ctx.globalAlpha=Math.min(1,p.life*3); ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,p.s*W/1280*1.6,p.s*W/1280*1.6); } ctx.globalAlpha=1; }
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
    s.looped=s.index<base.index; s.fog=fog(n/drawDistance,fogDensity); s.clip=maxy; s.vis=false;
    const cz=position-(s.looped?trackLength:0);
    project(s.p1,playerX*roadWidth-x,playerY+cameraHeight,cz);
    project(s.p2,playerX*roadWidth-x-dx,playerY+cameraHeight,cz);
    x+=dx; dx+=s.curve;
    if(s.p1.camera.z<=cameraDepth || s.p2.screen.y>=s.p1.screen.y || s.p2.screen.y>=maxy) continue;
    renderSegment(s.p1.screen.x,s.p1.screen.y,s.p1.screen.w,s.p2.screen.x,s.p2.screen.y,s.p2.screen.w,s.fog,s.color,s.index);
    s.vis=true; maxy=s.p1.screen.y;
  }
  const showPlayer=state!=='menu';
  for(let n=drawDistance-1;n>0;n--){
    const s=segments[(base.index+n)%segments.length];
    if(s.p1.camera.z<=cameraDepth){ if(s===pseg && showPlayer) renderPlayer(pseg,pPct); continue; }
    const sc=s.p1.screen.scale, a=Math.min(1,s.fog*1.6);
    for(const sp of s.sprites){ const src=sp.source; const sx=s.p1.screen.x+sc*sp.offset*roadWidth*W/2;
      renderSprite(src.img,src.w,sc,sx,s.p1.screen.y,src.a==='c'?-0.5:(sp.offset<0?-1:0),-1,s.clip,a); }
    if(s.vis) renderWalls(s,a);
    if(s.arch) renderSprite(COMMON.arch.img,COMMON.arch.w,sc,s.p1.screen.x,s.p1.screen.y,-0.5,-1,s.clip,a);
    if(s.gate && s.gate.tex && state!=='menu') for(let i=0;i<3;i++) renderSprite(s.gate.tex[i],GATE_W,sc,s.p1.screen.x+sc*LANE_X[i]*roadWidth*W/2,s.p1.screen.y,-0.5,-1,s.clip,a);
    for(const car of s.cars){ const p=pctRem(car.z,segmentLength); const c2=lerp(s.p1.screen.scale,s.p2.screen.scale,p);
      const cx=lerp(s.p1.screen.x,s.p2.screen.x,p)+c2*car.offset*roadWidth*W/2, cy=lerp(s.p1.screen.y,s.p2.screen.y,p);
      renderSprite(car.img,CAR_W,c2,cx,cy,-0.5,-1,s.clip,a); }
    if(s===pseg && showPlayer) renderPlayer(pseg,pPct);
  }
  if(nitro>0 && state==='race') drawSpeedLines();
  drawParticles();
  ctx.restore();
}

/* ================= HUD ================= */
let lastQ=null;
const statCache={};
function setStat(id,big,small){ const key=big+'/'+small; if(statCache[id]===key) return; statCache[id]=key; $(id).replaceChildren(String(big), h('span',{text:'/'+small})); }
function toast(text,cls,sub){ const t=$('toast'); t.className='show '+cls; t.replaceChildren(text); if(sub) t.append(h('small',{text:sub})); toastTimer=1.6; }
function flash(cls){ const f=$('flash'); f.className=cls; requestAnimationFrame(()=>requestAnimationFrame(()=>{ f.className=''; })); }
let mapDots=[];
function buildRaceMap(){
  const m=$('raceMap'); m.replaceChildren(h('div',{id:'raceMapLine'}), h('span',{class:'rm-flag',text:'🏁'}));
  mapDots=cars.map(c=>{ const d=h('i',{class:'rm-dot'}); d.style.background=c.color; m.append(d); return d; });
  const me=h('i',{class:'rm-dot me'}); m.append(me); mapDots.push(me);
}
function updateHUD(){
  if(state!=='race'&&state!=='finish'&&state!=='countdown') return;
  const pAbs=posAbs+playerZ;
  if(mode==='online'){ const rk=onlineRanks(); setStat('hPos', 1+rk.findIndex(r=>r.me), rk.length); }
  else { const ahead=cars.filter(c=>c.finished||c.dist>pAbs).length; setStat('hPos', state==='finish'?playerPlace:1+ahead, 6); }
  setStat('hLap', Math.min(LAPS,Math.max(1,Math.floor((pAbs-startAbs)/trackLength)+1)), LAPS);
  $('hCoins').textContent=stats.coins;
  $('hSpeed').textContent=Math.round(speed/maxSpeed*180);
  $('nitro').style.width=(Math.min(1,nitro/4.2)*100)+'%';
  $('streak').textContent=stats.streak>=2?`Ketma-ket: ${stats.streak} ✓`:'';
  const total=LAPS*trackLength, prog=d=>limit((d-startAbs)/total,0,1)*100+'%';
  cars.forEach((c,i)=>{ if(mapDots[i]) mapDots[i].style.left=prog(c.dist); });
  if(mapDots[cars.length]) mapDots[cars.length].style.left=prog(pAbs);
  const g=gates[gp];
  if(g && state!=='finish'){
    const gAbs=lapBase+g.seg*segmentLength, dSeg=(gAbs-pAbs)/segmentLength;
    const visible=dSeg<SHOW_SEGS && (gAbs-startAbs)<LAPS*trackLength;
    if(visible){
      if(lastQ!==g.q){ lastQ=g.q; $('qsub').textContent=g.q.sub; $('qtext').textContent=g.q.q; const o=document.querySelectorAll('.opt'); g.q.opts.forEach((t,i)=>o[i].textContent=LETTERS[i]+' · '+t); $('qbox').classList.remove('dim'); }
      $('qbar').style.transform=`scaleX(${limit(dSeg/SHOW_SEGS,0,1)})`;
    } else if(lastQ!=='wait'){ lastQ='wait'; $('qsub').textContent='Keyingi savol'; $('qtext').textContent=(gAbs-startAbs)>=LAPS*trackLength?'Marraga!':'…'; document.querySelectorAll('.opt').forEach(o=>o.textContent='—'); $('qbox').classList.add('dim'); $('qbar').style.transform='scaleX(0)'; }
  } else if(state==='finish' && lastQ!=='fin'){ lastQ='fin'; $('qsub').textContent='Poyga tugadi'; $('qtext').textContent='Marra! 🏁'; $('qbox').classList.add('dim'); }
  const lane=nearestLane(playerX); document.querySelectorAll('.opt').forEach((o,i)=>o.classList.toggle('sel',i===lane));
}

/* ================= yutuqlar ================= */
function unlockAch(id){ if(save.ach.includes(id)) return false; save.ach.push(id); persist(); achQueue.push(id); if(achTimer<=0) showNextAch(); return true; }
function showNextAch(){ const id=achQueue.shift(); if(!id) return; const a=ACH.find(x=>x.id===id); const t=$('achToast'); t.replaceChildren(`🏆 Yutuq: ${a.ic} ${a.n}`, h('small',{text:a.d})); t.classList.remove('hidden'); achTimer=2.6; if(state!=='results') Sound.coin(); }

/* ================= ekranlar ================= */
const SCREENS=['menu','garage','pause','results','profile','teacher','settings','tutorial','online','lobby'];
function showScreen(id){ SCREENS.forEach(s=>$(s).classList.toggle('hidden',s!==id)); }
function showResults(){
  state='results'; Music.stop();
  const place=playerPlace, bonus=[100,60,40,20,10,5][place-1]||0, today=dayStr();
  const acc=stats.total?Math.round(stats.correct/stats.total*100):0;
  const starsN=acc>=90?3:acc>=60?2:1;
  const news=[];
  let earned=stats.coins+bonus;
  if(mode==='daily' && save.dailyDone!==today){ earned*=2; save.dailyDone=today; news.push('☀️ Kunlik musobaqa bajarildi — tangalar ×2!'); unlockAch('daily'); }
  const starsBefore=totalStars();
  if(mode==='normal'||mode==='daily'){
    const id=raceTheme.id;
    if(starsN>(save.stars[id]||0)){ save.stars[id]=starsN; news.push(`⭐ ${raceTheme.name}: yangi natija — ${starsN} yulduz`); }
    const t=Math.round((stats.time||raceTime)*10)/10;
    if(t>=10 && (!save.best[id] || t<save.best[id])){ if(save.best[id]) news.push(`⏱ Yangi rekord: ${fmtTime(t)}`); save.best[id]=t; }
  }
  save.coins=Math.min(1e7,save.coins+earned); save.races=Math.min(1e7,save.races+1); if(place===1) save.wins=Math.min(save.races,save.wins+1);
  save.correct=Math.min(1e8,save.correct+stats.correct); save.answered=Math.min(1e8,save.answered+stats.total);
  for(const k of Object.keys(stats.subj)){ const r=save.subj[k]||(save.subj[k]={a:0,c:0}); r.a=Math.min(1e7,r.a+stats.subj[k].a); r.c=Math.min(r.a,r.c+stats.subj[k].c); }
  if(save.day!==today){ save.streak = save.day===yesterdayStr() ? save.streak+1 : 1; save.day=today; }
  persist();
  for(const t of THEMES){ if(t.need>starsBefore && t.need<=totalStars()) news.push(`🔓 Yangi trassa ochildi: ${t.ic} ${t.name}`); }
  unlockAch('first'); if(place===1) unlockAch('win'); if(stats.total>=10 && stats.correct===stats.total) unlockAch('perfect');
  if(save.correct>=100) unlockAch('c100'); if(save.correct>=500) unlockAch('c500');
  if(save.streak>=3) unlockAch('s3'); if(save.streak>=7) unlockAch('s7');
  if(THEMES.every(isUnlocked)) unlockAch('tracks');
  if(mode==='quiz') unlockAch('teacher');
  if(netRaceId && (mode==='normal'||mode==='daily')){ const rid=netRaceId; netRaceId=null;
    EduNet.finishRace(rid,{correct:stats.correct,total:stats.total,time:stats.time||raceTime,place}).then(r=>{
      const lines=[`🌐 +${r.points} ball · Haftalik reyting: #${r.week.rank} / ${r.week.total}`, `📍 ${EduNet.RMAP[r.region]}: #${r.inRegion} · viloyatingiz ${r.regionPos}-oʻrinda`];
      if(r.day) lines.unshift(`☀️ Kunlik musobaqa: #${r.day.rank} / ${r.day.total}`);
      const nb=$('rNews'); nb.append(...lines.map(t=>h('div',{text:t}))); nb.classList.remove('hidden');
    }).catch(()=>{}); }
  const medal=['🥇','🥈','🥉'][place-1]||'🏁';
  $('rPlace').textContent=`${medal} ${place}-oʻrin`;
  $('rStars').textContent='★'.repeat(starsN)+'☆'.repeat(3-starsN);
  $('rSub').textContent = place===1 ? 'Ajoyib! Siz chempionsiz!' : acc>=80 ? 'Bilimingiz zoʻr — endi tezroq haydang!' : 'Yana mashq qiling — har toʻgʻri javob nitro beradi!';
  $('rCorrect').textContent=`${stats.correct}/${stats.total}`; $('rAcc').textContent=acc+'%'; $('rTime').textContent=fmtTime(stats.time||raceTime);
  $('rCoins').textContent=`+${earned}`;
  const nb=$('rNews'); nb.replaceChildren(...news.map(t=>h('div',{text:t}))); nb.classList.toggle('hidden',!news.length);
  const m=$('rMist');
  if(stats.mistakes.length && mode!=='online'){ m.classList.remove('hidden'); m.replaceChildren(h('div',{class:'mhead',text:'📚 Xatolar ustida ishlaymiz:'}), ...stats.mistakes.slice(0,6).map(x=>h('div',null,x.q+' → ',h('b',{text:x.a})))); }
  else m.classList.add('hidden');
  $('btnRReview').classList.toggle('hidden', mistakes.length===0 || mode==='online');
  $('rOnline').classList.toggle('hidden', mode!=='online');
  $('btnRAgain').textContent = mode==='online' ? '👥 Yangi xona' : '↻ Yana poyga';
  if(mode==='online'){ onlineEndAt=Date.now()+90000; renderOnlineResults(); }
  $('btnRReview').textContent=`📚 Xatolar ustida ishlash (${mistakes.length})`;
  $('hud').classList.add('hidden'); showScreen('results');
}
function renderOnlineResults(){
  const rk=onlineRanks(); const ol=$('rOnline');
  ol.replaceChildren(...rk.map((r,i)=>h('li',{class:r.me?'mine':''}, h('span',{class:'rk',text:['🥇','🥈','🥉'][i]||String(i+1)}), h('span',{class:'nm'},h('b',{text:r.nick}),h('small',{text: r.ft!==null ? '🏁 '+fmtTime(r.ft/1000) : (r.me?'marra…':'poygada… '+Math.round(limit(r.p,0,1)*100)+'%')})), h('span',{class:'pt',text:''}))));
  const myIdx=rk.findIndex(r=>r.me); const myFt=rk[myIdx]&&rk[myIdx].ft;
  if(myFt!==null && myFt!==undefined){ const medal=['🥇','🥈','🥉'][myIdx]||'🏁'; $('rPlace').textContent=`${medal} ${myIdx+1}-oʻrin`; if(myIdx===0) unlockAch('win'); }
}
function buildMenu(){
  const ts=totalStars();
  $('tracks').replaceChildren(...THEMES.map(t=>{ const un=isUnlocked(t);
    return h('button',{class:`trk trk-${t.id}`+(save.track===t.id?' on':'')+(un?'':' locked'),data:{t:t.id}, 'aria-label':t.name},
      h('span',{class:'ic',text:t.ic}), t.name, h('small',{text: un ? ('★'.repeat(save.stars[t.id]||0)+'☆'.repeat(3-(save.stars[t.id]||0))) : `🔒 ${t.need} ⭐ kerak`})); }));
  $('subjects').replaceChildren(...EduQ.SUBJECTS.map(s=>h('button',{class:'choice'+(save.subject===s.id?' on':''),data:{s:s.id}},h('span',{class:'ic',text:s.ic}),s.name,h('small',{text:s.hint}))));
  $('levels').replaceChildren(...LEVELS.map(l=>h('button',{class:'choice'+(save.level===l[0]?' on':''),data:{l:l[0]}},l[1],h('small',{text:l[2]}))));
  $('mCoins').textContent=save.coins; $('mStars').textContent='⭐ '+ts;
  const done=save.dailyDone===dayStr(); $('dailyNote').textContent= done ? '✓ Bugun bajarildi' : 'Tangalar ×2 · bir xil savollar';
  const qb=$('quizBanner'); if(activeQuiz){ qb.classList.remove('hidden'); $('qbTitle').textContent=activeQuiz.t; $('qbCount').textContent=`(${activeQuiz.q.length} ta savol)`; } else qb.classList.add('hidden');
}
function buildGarage(){
  $('gCoins').textContent=save.coins;
  const list=$('carlist'); list.replaceChildren();
  for(const c of CARS){
    const owned=save.owned.includes(c.id), sel=save.car===c.id;
    const d=h('div',{class:'caritem'+(sel?' on':'')}, makeCar(c.color,'EDU'));
    const bar=h('i'); bar.style.width=((c.mult-0.9)/0.22*100)+'%';
    d.append(h('b',{text:c.name}), h('small',{text:'Tezlik +'+Math.round((c.mult-1)*100)+'%'}), h('div',{class:'bar'},bar));
    const b=h('button');
    if(sel){ b.textContent='✓ Tanlangan'; b.disabled=true; }
    else if(owned){ b.textContent='Tanlash'; b.addEventListener('click',()=>{ save.car=c.id; persist(); buildGarage(); }); }
    else { b.textContent=`Sotib olish · 🪙${c.price}`; b.className='buy'; b.disabled=save.coins<c.price; b.addEventListener('click',()=>{ if(save.coins>=c.price && !save.owned.includes(c.id)){ save.coins-=c.price; save.owned.push(c.id); save.car=c.id; persist(); Sound.init(); Sound.coin(); unlockAch('car'); buildGarage(); } }); }
    d.append(b); list.append(d);
  }
}
function buildProfile(){
  const acc=save.answered?Math.round(save.correct/save.answered*100):0;
  const items=[['🏁',save.races,'Poygalar'],['🥇',save.wins,'Gʻalabalar'],['✅',save.correct,'Toʻgʻri javoblar'],['🎯',acc+'%','Aniqlik'],['🔥',save.streak,'Kunlik seriya'],['⭐',totalStars()+'/'+THEMES.length*3,'Yulduzlar']];
  $('pStats').replaceChildren(...items.map(i=>h('div',null,h('b',{text:i[0]+' '+i[1]}),h('small',{text:i[2]}))));
  $('pSubjects').replaceChildren(...EduQ.SUBJECTS.filter(s=>s.id!=='mix').map(s=>{ const r=save.subj[s.id]; const p=r&&r.a?Math.round(r.c/r.a*100):0; const bar=h('i'); bar.style.width=p+'%';
    return h('div',{class:'sb'}, h('span',{text:s.ic+' '+s.name}), h('div',{class:'bar'},bar), h('small',{text: r ? p+'%' : '—'})); }));
  $('pTracks').replaceChildren(...THEMES.map(t=>h('div',{class:'rec'}, h('span',{text:t.ic+' '+t.name}), h('b',{text: save.best[t.id]?fmtTime(save.best[t.id]):'—'}), h('small',{text: isUnlocked(t) ? '★'.repeat(save.stars[t.id]||0)+'☆'.repeat(3-(save.stars[t.id]||0)) : `🔒 ${t.need} ⭐`}))));
  $('pAchCount').textContent=`${save.ach.length}/${ACH.length}`;
  $('pAch').replaceChildren(...ACH.map(a=>h('div',{class:'ach'+(save.ach.includes(a.id)?'':' lock')}, h('span',{class:'ai',text:a.ic}), h('div',null,h('b',{text:a.n}),h('small',{text:a.d})))));
}
/* ----- oʻqituvchi ----- */
const SAMPLE={t:'Namuna: Poytaxtlar', q:[['Fransiya poytaxti?','Parij','London','Rim'],['Yaponiya poytaxti?','Tokio','Pekin','Seul'],['Qozogʻiston poytaxti?','Astana','Olmaota','Bishkek'],['Turkiya poytaxti?','Anqara','Istanbul','Izmir'],['Misr poytaxti?','Qohira','Iskandariya','Luksor']]};
let draftTimer=null;
function draftChanged(){ clearTimeout(draftTimer); draftTimer=setTimeout(saveDraft,300); $('tLinkBox').classList.add('hidden'); }
function buildTeacher(){
  const L=EduQ.LIMITS;
  $('tTitle').value=draft.t;
  $('tRows').replaceChildren(...draft.q.map((r,i)=>{
    const mkIn=(j,max,ph,cls)=>{ const inp=h('input',{type:'text', maxlength:max, placeholder:ph, autocomplete:'off', class:cls||''}); inp.value=r[j]; inp.addEventListener('input',()=>{ draft.q[i][j]=inp.value.slice(0,max); inp.classList.remove('bad'); draftChanged(); }); return inp; };
    const del=h('button',{class:'x', 'aria-label':'Savolni oʻchirish', text:'✕'});
    del.addEventListener('click',()=>{ if(draft.q.length>1){ draft.q.splice(i,1); draftChanged(); buildTeacher(); } });
    return h('div',{class:'trow'}, mkIn(0,L.q,`${i+1}. Savol matni`,'tq'), mkIn(1,L.a,'Toʻgʻri'), mkIn(2,L.a,'Xato 1'), mkIn(3,L.a,'Xato 2'), del);
  }));
}
function teacherMsg(t,cls){ const m=$('tMsg'); m.textContent=t; m.className='tmsg '+(cls||''); }
function checkDraft(){
  const L=EduQ.LIMITS; const rows=document.querySelectorAll('#tRows .trow');
  if(!EduQ.clean(draft.t,L.title)){ $('tTitle').classList.add('bad'); teacherMsg('Test nomini yozing (40 belgigacha).','err'); return null; }
  const filled=draft.q.map((r,i)=>({r,i})).filter(x=>x.r.some(v=>v.trim()));
  if(filled.length<L.min){ teacherMsg(`Kamida ${L.min} ta savol kerak (hozir ${filled.length} ta).`,'err'); return null; }
  for(const {r,i} of filled){
    const ok=[EduQ.clean(r[0],L.q),EduQ.clean(r[1],L.a),EduQ.clean(r[2],L.a),EduQ.clean(r[3],L.a)];
    ok.forEach((v,j)=>{ if(!v && rows[i]) rows[i].children[j].classList.add('bad'); });
    if(ok.some(v=>!v)){ teacherMsg(`${i+1}-savolda barcha maydonlarni toʻldiring.`,'err'); return null; }
    if(new Set(ok.slice(1)).size!==3){ teacherMsg(`${i+1}-savolda javoblar bir xil boʻlmasligi kerak.`,'err'); return null; }
  }
  const quiz=EduQ.validateQuiz({v:1, t:draft.t, q:filled.map(x=>x.r)});
  if(!quiz){ teacherMsg('Testda xato bor — maydonlarni tekshiring.','err'); return null; }
  return quiz;
}
function quizLink(enc){ return location.href.split('#')[0]+'#quiz='+enc; }
function loadQuizFromHash(){
  const hs=location.hash||''; if(!hs.startsWith('#quiz=')) return;
  const q=EduQ.decodeQuiz(hs.slice(6));
  if(q){ activeQuiz=q; if(state==='menu') buildMenu(); }
  else { activeQuiz=null; if(state==='menu'){ buildMenu(); } setTimeout(()=>alertMenu('⚠️ Test havolasi buzilgan yoki notoʻgʻri.'),50); }
}
function alertMenu(t){ const n=document.querySelector('#menu .small-note'); if(n){ n.textContent=t; n.classList.add('show'); } }
/* ----- sozlamalar ----- */
function buildSettings(){
  $('sMusic').textContent=save.music?'Yoqilgan':'Oʻchirilgan';
  $('sSfx').textContent=save.muted?'Oʻchirilgan':'Yoqilgan';
  document.querySelectorAll('#sQuality button').forEach(b=>b.classList.toggle('on',b.dataset.v===save.quality));
  document.querySelectorAll('#sSteer button').forEach(b=>b.classList.toggle('on',b.dataset.v===save.steer));
}
function settingsMsg(t,cls){ const m=$('sMsg'); m.textContent=t; m.className='tmsg '+(cls||''); }
/* ----- qoʻllanma ----- */
const TUT=[['❓','Savol tepada','Poyga paytida ekran tepasida savol va 3 ta javob (A, B, C) chiqadi.'],['🚦','Toʻgʻri darvozani tanlang','Yoʻlda A, B, C darvozalar bor. ◀ ▶ tugmalari (kompyuterda A / D) bilan toʻgʻri javob qatoriga oʻting.'],['🔥','Nitro va tanga','Toʻgʻri javob — nitro va tanga. 3 tasi ketma-ket — COMBO! Xato javob mashinani sekinlashtiradi.'],['🏆','Yulduz yigʻing','Aniq javoblar yulduz beradi: yulduzlar yangi trassalarni, tangalar yangi mashinalarni ochadi.']];
let tutI=0, tutBack='menu';
function showTutorial(back){ tutI=0; tutBack=back||'menu'; renderTut(); showScreen('tutorial'); }
function renderTut(){ const t=TUT[tutI]; $('tutIc').textContent=t[0]; $('tutTitle').textContent=t[1]; $('tutText').textContent=t[2]; document.querySelectorAll('#tutDots i').forEach((d,i)=>d.classList.toggle('on',i===tutI)); $('btnTutNext').textContent= tutI===TUT.length-1 ? 'Boshladik! 🚀' : 'Keyingi ▶'; }
function endTutorial(){ save.tutorial=true; persist(); if(tutBack==='settings'){ buildSettings(); showScreen('settings'); } else { buildMenu(); showScreen('menu'); } }

/* ================= onlayn ekranlar ================= */
let boardType='weekly', onlineTab='rank';
function regionName(id){ return EduNet.RMAP[id]||'—'; }
function netMsg(id,t,cls){ const m=$(id); m.textContent=t||''; m.className='tmsg '+(cls||''); }
function errText(e){ const c=e&&e.code, m=e&&e.message;
  if(c===0) return 'Internet aloqasini tekshiring.'; if(c===429) return 'Juda koʻp urinish — birozdan keyin qayta urinib koʻring.';
  if(m==='nick') return 'Laqab mos emas: 3–16 ta harf/raqam, soʻkinishsiz.'; if(m==='room') return 'Bunday xona topilmadi yoki muddati tugagan.';
  if(m==='full') return 'Xona toʻla (6 kishi).'; if(m==='started') return 'Bu xonada poyga allaqachon boshlangan.'; if(m==='players') return 'Boshlash uchun kamida 2 kishi kerak.';
  if(c===503) return 'Server vaqtincha band. Keyinroq urinib koʻring.'; return 'Xatolik yuz berdi. Qayta urinib koʻring.'; }
function fillRegions(sel, val){ sel.replaceChildren(...EduNet.REGIONS.map(([id,n])=>{ const o=h('option',{value:id,text:n}); if(id===val) o.selected=true; return o; })); }
async function openOnline(tab){
  showScreen('online'); if(tab) onlineTab=tab;
  ['netOff','netReg','netMain'].forEach(id=>$(id).classList.add('hidden')); netMsg('nFMsg','');
  const av=await EduNet.check(true);
  if(!av){ $('netOff').classList.remove('hidden'); $('netOffText').textContent='Server bilan bogʻlanib boʻlmadi. Internetni tekshiring yoki oʻyinni rasmiy saytda oching.'; return; }
  if(!EduNet.me){ showReg(); return; }
  showNetMain();
}
function showReg(){ $('netReg').classList.remove('hidden'); $('netMain').classList.add('hidden'); const me=EduNet.me; $('nNick').value=me?me.nick:''; fillRegions($('nRegion'), me?me.region:'tsh'); netMsg('nMsg',''); }
function showNetMain(){
  const me=EduNet.me; $('netReg').classList.add('hidden'); $('netMain').classList.remove('hidden');
  $('nMeNick').textContent=me.nick; $('nMeRegion').textContent=regionName(me.region);
  document.querySelectorAll('#nTabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===onlineTab));
  $('nRank').classList.toggle('hidden',onlineTab!=='rank'); $('nFriends').classList.toggle('hidden',onlineTab!=='friends');
  if(onlineTab==='rank') loadBoard();
  if(pendingRoom && onlineTab==='friends'){ $('nCode').value=pendingRoom; const c=pendingRoom; pendingRoom=null; joinRoom(c); }
}
const BOARD_INFO={daily:'☀️ Bugungi kunlik musobaqa (savollar hamma uchun bir xil)', weekly:'📅 Shu haftadagi barcha poygalar yigʻindisi', region:'📍 Viloyatingizdagi eng kuchlilar (shu hafta)', regions:'🗺️ Viloyatlar bellashuvi — oʻquvchilar yigʻgan jami ballar'};
async function loadBoard(){
  document.querySelectorAll('#nBoards button').forEach(b=>b.classList.toggle('on',b.dataset.v===boardType));
  netMsg('nBoardInfo',BOARD_INFO[boardType]); const ol=$('nBoard'); ol.replaceChildren(h('li',{class:'erow'},h('span',{class:'empty',text:'Yuklanmoqda…'}))); $('nMe').textContent='';
  try{
    const j=await EduNet.leaderboard(boardType);
    if(!j.rows.length){ ol.replaceChildren(h('li',{class:'erow'},h('span',{class:'empty',text:'Hali natija yoʻq — birinchi boʻling! 🚀'}))); }
    else ol.replaceChildren(...j.rows.map((r,i)=>{ const mine = boardType==='regions' ? (EduNet.me && r.region===EduNet.me.region) : (j.me && j.me.rank===i+1);
      return h('li',{class:mine?'mine':''}, h('span',{class:'rk',text:['🥇','🥈','🥉'][i]||String(i+1)}),
        boardType==='regions' ? h('span',{class:'nm'},h('b',{text:r.name})) : h('span',{class:'nm'},h('b',{text:r.nick}),h('small',{text:regionName(r.region)})),
        h('span',{class:'pt',text:Math.round(r.pts).toLocaleString('ru-RU')+' ball'})); }));
    if(boardType==='regions'){ const i=j.rows.findIndex(r=>EduNet.me&&r.region===EduNet.me.region); $('nMe').textContent= i>=0 ? `📍 ${regionName(EduNet.me.region)} — ${i+1}-oʻrinda` : `📍 ${regionName(EduNet.me.region)} hali ball yigʻmagan — poyga oʻynang!`; }
    else $('nMe').textContent = j.me ? `👤 Siz: #${j.me.rank} / ${j.total} · ${Math.round(j.me.pts)} ball` : '👤 Siz hali bu reytingda yoʻqsiz — poyga oʻynab ball yigʻing!';
  }catch(e){ ol.replaceChildren(h('li',{class:'erow'},h('span',{class:'empty',text:errText(e)}))); }
}
let pendingRoom=null;
function roomLink(code){ return location.href.split('#')[0]+'#room='+code; }
async function joinRoom(code){
  code=String(code||'').toUpperCase().trim();
  if(!EduNet.CODE_RE.test(code)){ netMsg('nFMsg','Kod 4 ta belgidan iborat (masalan: K7MZ).','err'); return; }
  netMsg('nFMsg','Ulanilmoqda…');
  try{ const j=await EduNet.room.join(code, save.car); enterLobby(code, j.room); }catch(e){ netMsg('nFMsg',errText(e),'err'); }
}
function enterLobby(code, room){
  curRoom={code, room}; showScreen('lobby');
  $('lCode').textContent=code; $('lLink').value=roomLink(code); netMsg('lMsg','');
  renderLobby();
  clearInterval(lobbyTimer); lobbyTimer=setInterval(lobbySync,1000);
}
function renderLobby(){
  if(!curRoom) return; const r=curRoom.room, meId=EduNet.me.id, isHost=r.host===meId;
  const tn=(THEMES.find(t=>t.id===r.track)||THEMES[0]), sn=EduQ.nameOf(r.subject), ln=(LEVELS.find(l=>l[0]===r.level)||LEVELS[1])[1];
  $('lMeta').textContent=`${tn.ic} ${tn.name} · ${sn} · ${ln} · ${r.players.length}/6 oʻyinchi`;
  const items=r.players.map(p=>{ const dot=h('i'); dot.style.background=carColor(p.car); return h('li',{class:p.id===r.host?'host':''}, dot, h('span',null,h('b',{text:p.nick+(p.id===meId?' (siz)':'')}),h('small',{text:regionName(p.region)}))); });
  for(let i=r.players.length;i<6;i++) items.push(h('li',{class:'empty',text:'boʻsh joy'}));
  $('lPlayers').replaceChildren(...items);
  const st=$('btnLStart'); st.classList.toggle('hidden',!isHost); st.disabled=r.players.length<2;
  if(!isHost) netMsg('lMsg','⏳ Xona egasi poygani boshlashini kuting…'); else if(r.players.length<2) netMsg('lMsg','Kodni doʻstlaringizga yuboring — kamida 2 kishi kerak.'); else netMsg('lMsg','Hamma tayyor boʻlsa — boshlang!','ok');
}
async function lobbySync(){
  if(!curRoom || state!=='menu') return;
  try{ const j=await EduNet.room.sync(curRoom.code); curRoom.room=j.room;
    if(j.room.status==='race'){ clearInterval(lobbyTimer); lobbyTimer=null; startRace('online', j.room); return; }
    if(j.room.status==='closed'){ leaveLobby('Xona egasi xonani yopdi.'); return; }
    renderLobby();
  }catch(e){ if(e.message==='member'||e.message==='room') leaveLobby('Siz xonadan chiqarildingiz yoki xona tugadi.'); }
}
function leaveLobby(msg){ clearInterval(lobbyTimer); lobbyTimer=null; if(curRoom){ EduNet.room.leave(curRoom.code); curRoom=null; } openOnline('friends').then(()=>{ if(msg) netMsg('nFMsg',msg,'err'); }); }
function loadRoomFromHash(){ const hs=location.hash||''; if(!hs.startsWith('#room=')) return; const c=hs.slice(6).toUpperCase(); if(EduNet.CODE_RE.test(c)){ pendingRoom=c; setTimeout(()=>openOnline('friends'),60); } }

function goMenu(){ if(mode==='online' && curRoom){ EduNet.room.leave(curRoom.code); curRoom=null; } stopSync(); onlinePaused=false; state='menu'; EduQ.unseed(); mode='normal'; $('hud').classList.add('hidden'); const t=THEMES.find(x=>x.id===save.track)||THEMES[0]; useTheme(t); buildMenu(); showScreen('menu'); spawnCars(posAbs+playerZ+segmentLength*20); nitro=0; particles=[]; if(Sound.ctx) Music.start(); }
function pauseGame(){ if(mode==='online'){ if(state==='race'||state==='countdown'||state==='finish'){ onlinePaused=true; showScreen('pause'); } return; } if(state==='race'||state==='countdown'||state==='finish'){ prevState=state; state='paused'; showScreen('pause'); Music.stop(); } }
function resumeGame(){ if(onlinePaused){ onlinePaused=false; showScreen(null); return; } if(state==='paused'){ state=prevState; showScreen(null); Music.start(); } }
function soundLabel(){ $('btnSound').textContent = save.muted?'🔇 Ovoz: oʻchirilgan':'🔊 Ovoz: yoqilgan'; }

function bindUI(){
  const on=(id,f)=>$(id).addEventListener('click',f);
  $('tracks').addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(!b) return; const t=THEMES.find(x=>x.id===b.dataset.t); if(!t) return;
    if(!isUnlocked(t)){ alertMenu(`🔒 ${t.name} uchun ${t.need} ta yulduz kerak (sizda ${totalStars()}).`); return; }
    save.track=t.id; persist(); useTheme(t); spawnCars(posAbs+playerZ+segmentLength*20); buildMenu(); });
  $('subjects').addEventListener('click',e=>{ const b=e.target.closest('[data-s]'); if(!b||!EduQ.SUBJECT_IDS.includes(b.dataset.s)) return; save.subject=b.dataset.s; persist(); buildMenu(); });
  $('levels').addEventListener('click',e=>{ const b=e.target.closest('[data-l]'); if(!b) return; const v=+b.dataset.l; if([1,2,3].includes(v)){ save.level=v; persist(); buildMenu(); } });
  on('btnStart',()=>startRace('normal'));
  on('btnDaily',()=>startRace('daily'));
  on('btnQuizStart',()=>{ if(activeQuiz) startRace('quiz'); });
  on('btnQuizClose',()=>{ activeQuiz=null; try{ history.replaceState(null,'',location.href.split('#')[0]); }catch(e){} buildMenu(); });
  on('btnGarage',()=>{ Sound.init(); buildGarage(); showScreen('garage'); });
  on('btnGBack',()=>{ buildMenu(); showScreen('menu'); });
  on('btnProfile',()=>{ buildProfile(); showScreen('profile'); });
  on('btnPBack',()=>{ buildMenu(); showScreen('menu'); });
  on('btnTeacher',()=>{ buildTeacher(); teacherMsg(''); showScreen('teacher'); });
  on('btnTBack',()=>{ saveDraft(); buildMenu(); showScreen('menu'); });
  $('tTitle').addEventListener('input',()=>{ draft.t=$('tTitle').value.slice(0,EduQ.LIMITS.title); $('tTitle').classList.remove('bad'); draftChanged(); });
  on('btnTAdd',()=>{ if(draft.q.length>=EduQ.LIMITS.max){ teacherMsg(`Koʻpi bilan ${EduQ.LIMITS.max} ta savol.`,'err'); return; } draft.q.push(['','','','']); draftChanged(); buildTeacher(); });
  on('btnTSample',()=>{ draft=JSON.parse(JSON.stringify(SAMPLE)); draftChanged(); buildTeacher(); teacherMsg('Namuna yuklandi — oʻzgartirib koʻring.','ok'); });
  on('btnTClear',()=>{ draft={t:'', q:[['','','',''],['','','',''],['','','','']]}; draftChanged(); buildTeacher(); teacherMsg(''); });
  on('btnTTest',()=>{ const q=checkDraft(); if(q){ saveDraft(); activeQuiz=q; startRace('quiz'); } });
  on('btnTLink',()=>{ const q=checkDraft(); if(!q) return; const enc=EduQ.encodeQuiz(q); if(!enc){ teacherMsg('Test juda katta — savollarni qisqartiring.','err'); return; }
    saveDraft(); $('tLink').value=quizLink(enc); $('tLinkBox').classList.remove('hidden'); teacherMsg(`✅ Havola tayyor (${q.q.length} ta savol). Uni Telegram orqali oʻquvchilarga yuboring.`,'ok'); });
  on('btnTCopy',async()=>{ const v=$('tLink').value; try{ await navigator.clipboard.writeText(v); teacherMsg('📋 Havola nusxalandi!','ok'); }catch(e){ $('tLink').select(); teacherMsg('Havolani belgilab, nusxalang.','ok'); } });
  on('btnOnline',()=>{ Sound.init(); openOnline(); });
  on('btnNBack',()=>{ buildMenu(); showScreen('menu'); });
  on('btnNetRetry',()=>openOnline());
  on('btnNickRnd',()=>{ $('nNick').value=EduNet.suggest(); });
  on('btnNetEdit',showReg);
  let delArm=false;
  on('btnNetDel',async()=>{ if(!delArm){ delArm=true; netMsg('nFMsg','Onlayn profil va reytingdagi natijalaringiz oʻchiriladi. Tasdiqlash uchun 🗑 ni yana bosing.','err'); setTimeout(()=>{ delArm=false; },5000); return; }
    delArm=false; try{ await EduNet.deleteMe(); netMsg('nFMsg',''); openOnline(); }catch(e){ netMsg('nFMsg',errText(e),'err'); } });
  on('btnNetSave',async()=>{ netMsg('nMsg','Saqlanmoqda…'); try{ await EduNet.register($('nNick').value,$('nRegion').value); showNetMain(); }catch(e){ netMsg('nMsg',errText(e),'err'); } });
  $('nTabs').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; onlineTab=b.dataset.v; showNetMain(); });
  $('nBoards').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; boardType=b.dataset.v; loadBoard(); });
  on('btnRoomCreate',async()=>{ netMsg('nFMsg','Xona yaratilmoqda…'); try{ const j=await EduNet.room.create({track:save.track, subject:save.subject, level:save.level, car:save.car}); enterLobby(j.code,j.room); }catch(e){ netMsg('nFMsg',errText(e),'err'); } });
  on('btnRoomJoin',()=>joinRoom($('nCode').value));
  $('nCode').addEventListener('input',()=>{ $('nCode').value=$('nCode').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4); });
  on('btnLCopy',async()=>{ try{ await navigator.clipboard.writeText($('lLink').value); netMsg('lMsg','📋 Havola nusxalandi — doʻstlaringizga yuboring!','ok'); }catch(e){ $('lLink').select(); } });
  on('btnLLeave',()=>leaveLobby());
  on('btnLStart',async()=>{ if(!curRoom) return; netMsg('lMsg','Boshlanmoqda…'); try{ const j=await EduNet.room.start(curRoom.code); curRoom.room=j.room; clearInterval(lobbyTimer); lobbyTimer=null; startRace('online', j.room); }catch(e){ netMsg('lMsg',errText(e),'err'); } });
  addEventListener('hashchange',loadRoomFromHash);
  on('btnSettings',()=>{ buildSettings(); settingsMsg(''); showScreen('settings'); });
  on('btnSBack',()=>{ buildMenu(); showScreen('menu'); });
  on('sMusic',()=>{ save.music=!save.music; persist(); Sound.init(); if(save.music) Music.start(); else Music.stop(); buildSettings(); });
  on('sSfx',()=>{ save.muted=!save.muted; persist(); soundLabel(); buildSettings(); });
  $('sQuality').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; save.quality=b.dataset.v; runtimeLow=false; persist(); applyQuality(); buildSettings(); });
  $('sSteer').addEventListener('click',async e=>{ const b=e.target.closest('[data-v]'); if(!b) return;
    if(b.dataset.v==='tilt'){
      const ok=await Tilt.request(); if(!ok){ settingsMsg('Telefon qiyshayish sensoriga ruxsat bermadi.','err'); return; }
      save.steer='tilt'; persist(); buildSettings(); settingsMsg('Sensor tekshirilmoqda…','');
      setTimeout(()=>{ if(save.steer!=='tilt') return;
        if(!Tilt.active){ save.steer='buttons'; persist(); buildSettings(); settingsMsg('Bu qurilmada qiyshayish sensori topilmadi — tugmalar bilan boshqaring.','err'); }
        else settingsMsg('✅ Sensor ishlayapti. Telefonni qulay holatda ushlang — poyga boshida shu holat “toʻgʻri” deb olinadi.','ok'); },1500);
      return; }
    settingsMsg(''); save.steer=b.dataset.v; persist(); buildSettings(); });
  on('sTutorial',()=>showTutorial('settings'));
  let resetArm=false;
  on('sReset',()=>{ if(!resetArm){ resetArm=true; $('sReset').textContent='Tasdiqlash'; settingsMsg('Yana bir marta bossangiz, barcha progress oʻchadi.','err'); setTimeout(()=>{ resetArm=false; $('sReset').textContent='Oʻchirish'; },4000); return; }
    store.del(SAVE_KEY); store.del(MIST_KEY); save=loadSave(); save.tutorial=true; mistakes=[]; persist(); resetArm=false; $('sReset').textContent='Oʻchirish'; settingsMsg('Progress oʻchirildi.','ok'); soundLabel(); buildSettings(); });
  on('btnTutNext',()=>{ if(tutI<TUT.length-1){ tutI++; renderTut(); } else endTutorial(); });
  on('btnTutSkip',endTutorial);
  on('btnPause',pauseGame);
  on('btnResume',resumeGame);
  on('btnRestart',()=>{ if(mode==='online'){ resumeGame(); return; } startRace(mode); });
  on('btnQuit',goMenu);
  on('btnSound',()=>{ save.muted=!save.muted; persist(); soundLabel(); });
  on('btnRAgain',()=>{ if(mode==='online'){ const c=curRoom; stopSync(); curRoom=null; mode='normal'; if(c) EduNet.room.leave(c.code); openOnline('friends'); return; } startRace(mode==='review'&&!mistakes.length?'normal':mode); });
  on('btnRReview',()=>startRace('review'));
  on('btnRMenu',goMenu);
  const hold=(id,key)=>{ const el=$(id);
    const dn=e=>{ e.preventDefault(); keys[key]=true; el.classList.add('on'); Sound.init(); };
    const up=e=>{ e.preventDefault(); keys[key]=false; el.classList.remove('on'); };
    el.addEventListener('pointerdown',dn); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('pointerleave',up);
    el.addEventListener('contextmenu',e=>e.preventDefault()); };
  hold('btnL','left'); hold('btnR','right'); hold('btnBrake','brake');
  const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'brake',KeyS:'brake',Space:'brake'};
  const typing=e=>e.target && e.target.tagName==='INPUT';
  addEventListener('keydown',e=>{ if(typing(e)) return; if(map[e.code]){ keys[map[e.code]]=true; e.preventDefault(); } if(e.code==='KeyP'||e.code==='Escape'){ (state==='paused'||onlinePaused)?resumeGame():pauseGame(); } });
  addEventListener('keyup',e=>{ if(typing(e)) return; if(map[e.code]){ keys[map[e.code]]=false; e.preventDefault(); } });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(mode!=='online') pauseGame(); Music.stop(); } else if(state==='menu'&&Sound.ctx) Music.start(); });
  addEventListener('blur',()=>{ keys.left=keys.right=keys.brake=false; });
  addEventListener('hashchange',loadQuizFromHash);
  addEventListener('pointerdown',()=>{ if(!Sound.ctx){ Sound.init(); if(state==='menu') Music.start(); } },{once:true});
  if('ontouchstart' in window) document.body.classList.add('nokbd-hint');
  if(save.steer==='tilt') Tilt.bind();
}
function lowQuality(){ return save.quality==='low' || (save.quality==='auto' && runtimeLow); }
function applyQuality(){ drawDistance=lowQuality()?170:300; resize(); }
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1, lowQuality()?1:2);
  let w=innerWidth*dpr, hh=innerHeight*dpr; const maxW=lowQuality()?960:1280;
  if(w>maxW){ hh=hh*maxW/w; w=maxW; }
  W=canvas.width=Math.round(w); H=canvas.height=Math.round(hh);
  $('rotate').classList.toggle('hidden',!(innerHeight>innerWidth && ('ontouchstart' in window)));
}

/* ================= start ================= */
let last=performance.now(), acc=0; const STEP=1/60;
function frame(now){
  const real=(now-last)/1000; let dt=Math.min(0.1,real); last=now; acc+=dt;
  while(acc>=STEP){ update(STEP); acc-=STEP; }
  render(); updateHUD();
  if(state==='race' && save.quality==='auto' && !runtimeLow && !fpsChecked){ fpsAcc+=real; fpsN++; if(fpsAcc>4){ if(fpsN/fpsAcc<42){ runtimeLow=true; applyQuality(); toast('Grafika','good','tejamkor rejimga oʻtdi'); } fpsChecked=true; } }
  requestAnimationFrame(frame);
}
buildCommon();
buildTrack(THEMES.find(t=>t.id===save.track)||THEMES[0]);
for(const g of gates) setGateQuestion(g);
myCar=carDef(); myCar.img=makeCar(myCar.color,'EDU');
posAbs=START_SEG*segmentLength; spawnCars(posAbs+playerZ+segmentLength*20);
bindUI(); soundLabel(); applyQuality(); addEventListener('resize',resize);
loadQuizFromHash();
buildMenu();
EduNet.check().then(av=>{ $('onlineNote').textContent = av ? 'Reyting · Viloyatlar bellashuvi · Doʻstlar bilan jonli poyga' : 'Internet orqali — server bilan bogʻlanilmoqda'; });
loadRoomFromHash();
if(!save.tutorial) showTutorial('menu'); else showScreen('menu');
requestAnimationFrame(frame);
// Service worker: Trusted Types siyosati faqat bitta aniq manzilga (sw.js) ruxsat beradi
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  let swUrl='sw.js';
  try{ if(window.trustedTypes && trustedTypes.createPolicy){ const pol=trustedTypes.createPolicy('edurace',{createScriptURL:u=>{ if(u==='sw.js') return u; throw new TypeError('Ruxsat etilmagan skript manzili'); }}); swUrl=pol.createScriptURL('sw.js'); } }catch(e){}
  navigator.serviceWorker.register(swUrl,{scope:'./'}).catch(()=>{});
}
// Test ilgaklari FAQAT lokal ishlab chiqish muhitida (file://, localhost). Saytda mavjud emas.
const LOCAL_DEV = location.protocol==='file:' || location.hostname==='localhost' || location.hostname==='127.0.0.1';
if(LOCAL_DEV){ window.EduRace={get state(){return state;}, get place(){return playerPlace;}, get stats(){return stats;}, get mode(){return mode;}, get theme(){return curTheme.id;}, get gates(){return gates.length;}, jumpToEnd(){ posAbs=startAbs+LAPS*trackLength-playerZ-segmentLength*30; }, nextGate(d){ const g=gates[gp]; posAbs=lapBase+g.seg*segmentLength-playerZ-segmentLength*(d||120); return g.q; }, setX(x){playerX=x;}, get x(){return playerX;}, seek(seg){ posAbs=seg*segmentLength-playerZ; }, curQ(){ return gates[gp]&&gates[gp].q; }, steerTo(t){ keys.left = playerX>t+0.08; keys.right = playerX<t-0.08; }, giveStars(n){ save.stars={toshkent:Math.min(3,n),samarqand:Math.min(3,Math.max(0,n-3)),chorvoq:Math.min(3,Math.max(0,n-6)),buxoro:Math.min(3,Math.max(0,n-9))}; persist(); buildMenu(); }, get net(){ return {me:EduNet.me, room:curRoom&&curRoom.code, ranks: mode==='online'?onlineRanks():null, cars:cars.length}; }, get tilt(){ return {a:Tilt.active,v:Tilt.value,raw:Tilt.raw,off:Tilt.offset,bound:Tilt.bound,mode:save.steer}; }, setTrack(id){ const t=THEMES.find(x=>x.id===id); save.track=id; useTheme(t); buildMenu(); }}; }
})();
