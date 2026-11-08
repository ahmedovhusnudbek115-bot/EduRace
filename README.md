# 🏎️ Edu Race — Oʻqi. Poygada yut.

Oʻquvchilar uchun taʼlimiy poyga oʻyini. Yoʻlda savol chiqadi: toʻgʻri javob yozilgan darvozadan oʻtsangiz — **NITRO** va tanga!

**▶ Oʻynash:** https://edurace-six.vercel.app

## Imkoniyatlar (v2)
- 🗺️ **4 ta trassa:** Toshkent tuni · Samarqand shomi · Chorvoq togʻ yoʻli · Buxoro kunduzi (yulduz yigʻib ochiladi)
- 📚 **8 ta yoʻnalish:** Matematika, Ingliz tili, Rus tili, Fizika, Kimyo, Tarix, Geografiya, Aralash · 3 ta sinf darajasi
- 👩‍🏫 **Oʻqituvchi rejimi:** oʻz savollaringizni yozing → havola oling → sinfga yuboring (server kerak emas)
- 📅 **Kunlik musobaqa:** hamma uchun bir xil savollar, kuniga bir marta ×2 tanga
- 🔁 **Xatolar ustida ishlash:** xato qilingan savollar bilan qayta poyga
- 🏆 **Profil:** statistika, fanlar boʻyicha aniqlik, 13 ta yutuq, kunlik seriya, trassa rekordlari
- ⚙️ **Sozlamalar:** musiqa, ovoz, grafika sifati (avto/tejamkor), telefonni qiyshaytirib boshqarish
- 🎵 Fayllarsiz synthwave musiqa · ✨ uchqunlar, poyga xaritasi, A/B/C darvozalar
- 📴 Internetsiz ishlaydi · 🔒 maʼlumot yigʻmaydi, reklama yoʻq

## 🚀 v4 — sotuvga tayyor versiya
- 👤 **Akkauntlar:** login + parol (scrypt xesh), istalgan qurilmadan kirish, progress bulutda saqlanadi, parolni almashtirish (eski seanslar bekor), akkauntni oʻchirish
- ⚡ **Tezkor oʻyin (onlayn “set”):** server sinf guruhi va fan boʻyicha raqib topadi (2–6 kishi); 20 s da raqib topilmasa — botlar bilan mashq
- ⭐ **Elo reyting va ligalar:** Bronza → Kumush → Oltin → Platina → Olmos → Chempion; XP va darajalar; umumiy reyting jadvali
- 📚 **Darsliklar boʻyicha savollar:** 1–4 va 5–11-sinflar, 11 fan (Matematika, Ona tili va adabiyot, Ingliz, Rus, Biologiya, Fizika, Kimyo, Tarix, Geografiya, Informatika, Aralash); fan oʻqitiladigan sinfdan ochiladi
- 🎮 **Mini oʻyinlar:** Tezkor hisob · Rost yoki yolgʻon · Juftlikni top
- 📋 **Kunlik vazifalar** va seriya bonusi · 17 ta yutuq

## 🌐 Onlayn rejim (v3)
- **Respublika reytingi:** kunlik (kunlik musobaqa), haftalik, viloyat ichida
- **Viloyatlar bellashuvi:** 14 ta hudud oʻquvchilari jami ball uchun kurashadi
- **Doʻstlar bilan jonli poyga:** 4 belgili kod yoki havola, 2–6 oʻyinchi, bir xil savollar, server vaqti boʻyicha marra
- Login/parol akkaunt, laqab + viloyat + sinf (haqiqiy ism, email, telefon soʻralmaydi), soʻkinish filtri, akkauntni oʻzi oʻchira oladi
- Server: Vercel funksiyalari (`api/`) + Upstash Redis. Natijalar serverda tekshiriladi (bir martalik `raceId`, server vaqti, chegaralar), soʻrovlar cheklanadi, HMAC token

### Deploy (Vercel)
1. Vercel'da ushbu repozitoriyni import qiling (Framework: **Other**, build kerak emas).
2. **Storage → Upstash for Redis** (bepul) yarating va loyihaga ulang — `KV_REST_API_URL` / `KV_REST_API_TOKEN` avtomatik qoʻshiladi.
3. (Tavsiya) `EDURACE_SECRET` muhit oʻzgaruvchisiga uzun tasodifiy qator qoʻying.
4. Redeploy.

## Xavfsizlik
Qatʼiy CSP + Trusted Types, tashqi kutubxonalar yoʻq, barcha kiruvchi maʼlumot (saqlash, oʻqituvchi havolasi) qatʼiy tekshiriladi.
Vercel'da qoʻshimcha HTTP sarlavhalar: HSTS, `frame-ancestors 'none'`, `nosniff`, `Permissions-Policy`, COOP/CORP — [vercel.json](vercel.json).
Batafsil: [SECURITY.md](SECURITY.md) · [Maxfiylik siyosati](privacy.html)

## Tuzilma
| Fayl | Vazifasi |
|---|---|
| `index.html` | Sahifa tuzilmasi (inline skript/stil yoʻq) |
| `game.js` | Poyga dvigateli, rejimlar, ekranlar |
| `questions.js` | Savol banklari, generatorlar, oʻqituvchi testi (kodlash/tekshirish) |
| `style.css` | Dizayn |
| `sw.js` | Oflayn rejim (service worker) |
| `online.js` | Onlayn mijoz (API, profil) |
| `api/*.js` | Server: player, race, leaderboard, room, health |
| `vercel.json` | Vercel xavfsizlik sarlavhalari |
