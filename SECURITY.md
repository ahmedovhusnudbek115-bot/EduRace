# Xavfsizlik siyosati / Security Policy

## Zaiflik haqida xabar berish
Edu Race'da xavfsizlik muammosini topsangiz, iltimos, uni **ochiq issue sifatida e'lon qilmang**.
GitHub'ning **Security → Report a vulnerability** (Private vulnerability reporting) bo'limi orqali yashirin xabar yuboring.
Har bir xabar ko'rib chiqiladi va tuzatish chiqarilgach, sizga minnatdorchilik bildiriladi.

If you find a security issue, please do **not** open a public issue. Use GitHub's
**Security → Report a vulnerability** (private reporting) on this repository.

## Qo'llab-quvvatlanadigan versiya
Faqat `main` tarmog'idagi eng so'nggi versiya (https://ahmedovhusnudbek115-bot.github.io/EduRace/).

## Amaldagi himoya choralari
- **Shaxsiy ma'lumot yig'ilmaydi**: akkaunt, reklama, analitika, uchinchi tomon SDK yo'q; tarmoqqa hech narsa yuborilmaydi.
- **Qat'iy Content Security Policy**: `default-src 'none'`, faqat o'z domenidan skript/stil, `unsafe-inline`/`unsafe-eval` yo'q, `object-src`/`base-uri`/`form-action` taqiqlangan.
- **Trusted Types** majburiy: HTML satrlarini DOM ga yozish (XSS) brauzer darajasida bloklanadi; yagona `edurace` siyosati faqat `sw.js` manziliga ruxsat beradi.
- **Xavfsiz DOM**: `innerHTML`, `eval`, `document.write` ishlatilmaydi; matnlar `textContent` orqali chiqariladi.
- **O'qituvchi havolasi**: `#quiz=` ma'lumoti qat'iy tekshiriladi — versiya, 3–30 savol, uzunlik chegaralari, boshqaruv va bidi (yo'nalishni o'zgartiruvchi) belgilar olib tashlanadi, javoblar takrorlanmasligi; matn faqat `textContent`/canvas orqali chiqariladi.
- **Saqlangan ma'lumot validatsiyasi**: localStorage qat'iy sxema bo'yicha tekshiriladi (prototype pollution, noto'g'ri turlar, haddan katta qiymatlar rad etiladi).
- **Service worker**: faqat o'z domenidagi muvaffaqiyatli javoblar keshlanadi; eski keshlar avtomatik tozalanadi.
- **Tashqi bog'liqliklar yo'q** (supply-chain xavfi yo'q), `Referrer-Policy: no-referrer`, faqat HTTPS (GitHub Pages).
- **Maxfiy fayllar** (`*.keystore`, imzo parollari, `.env`) `.gitignore` orqali repozitoriyga tushishdan himoyalangan.

## Onlayn server (api/)
- **Identifikatsiya:** tasodifiy ID + HMAC-SHA256 token (server siri bilan); taqqoslash `timingSafeEqual` bilan.
- **CSRF:** `Origin` sarlavhasi boshqa domendan boʻlsa — rad etiladi; faqat `application/json`, soʻrov hajmi ≤ 2 KB.
- **Aldashga qarshi:** natija faqat server bergan bir martalik `raceId` bilan (GETDEL); server vaqti boʻyicha minimal davomiylik; toʻgʻri javoblar ≤ jami; oʻrin 1–6; ball chegarasi. Jonli poygada marra vaqti server tomonidan belgilanadi, juda erta marra qabul qilinmaydi.
- **Soʻrovlar cheklovi:** IP (xeshlangan) va ID boʻyicha Redis hisoblagichlar.
- **Maʼlumotlar minimal:** laqab + viloyat + ballar; IP saqlanmaydi; reytinglar ~30 kunda, xonalar 2 soatda oʻchadi; foydalanuvchi profilini oʻzi oʻchira oladi.
- **Laqab filtri:** uzunlik, ruxsat etilgan belgilar, bidi/boshqaruv belgilari olib tashlanadi, soʻkinishlar roʻyxati.
- **Ochiq reytingda ID koʻrsatilmaydi;** reyting CDN'da 15 soniya keshlanadi (DoS va xarajatni kamaytiradi).
- **Maʼlum cheklov:** brauzer oʻyinida natijani toʻliq soxtalashtirishning oldini olib boʻlmaydi — server faqat mantiqan mumkin boʻlmagan natijalarni rad etadi.

## Vercel HTTP sarlavhalari
`vercel.json` orqali: `Content-Security-Policy` (shu jumladan `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (faqat akselerometr/giroskop — qiyshaytirib boshqarish uchun),
`Cross-Origin-Opener-Policy` va `Cross-Origin-Resource-Policy`.

## Ma'lum cheklovlar
- GitHub Pages nusxasida HTTP sarlavhalarini sozlab bo'lmaydi (u yerda faqat meta-CSP ishlaydi). To'liq sarlavhali himoya Vercel nusxasida.
- O'yin oflayn ishlaydi, shuning uchun tangalar faqat qurilmada saqlanadi va ularni qurilma egasi o'zgartirishi mumkin.
  Bu boshqa foydalanuvchilarga ta'sir qilmaydi (umumiy reyting yo'q).
