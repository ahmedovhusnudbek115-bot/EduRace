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
| `vercel.json` | Vercel xavfsizlik sarlavhalari |
