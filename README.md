# 🏎️ Edu Race — Oʻqi. Poygada yut.

Oʻquvchilar uchun taʼlimiy poyga oʻyini. Yoʻlda savol chiqadi: toʻgʻri javob yozilgan darvozadan oʻtsangiz — **NITRO** va tanga!

**▶ Oʻynash:** https://ahmedovhusnudbek115-bot.github.io/EduRace/

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

## 🌐 Onlayn rejim (v3)
- **Respublika reytingi:** kunlik (kunlik musobaqa), haftalik, viloyat ichida
- **Viloyatlar bellashuvi:** 14 ta hudud oʻquvchilari jami ball uchun kurashadi
- **Doʻstlar bilan jonli poyga:** 4 belgili kod yoki havola, 2–6 oʻyinchi, bir xil savollar, server vaqti boʻyicha marra
- Laqab + viloyat (haqiqiy ism soʻralmaydi), soʻkinish filtri, profilni oʻzi oʻchira oladi
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
