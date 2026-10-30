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
- **Saqlangan ma'lumot validatsiyasi**: localStorage qat'iy sxema bo'yicha tekshiriladi (prototype pollution, noto'g'ri turlar, haddan katta qiymatlar rad etiladi).
- **Service worker**: faqat o'z domenidagi muvaffaqiyatli javoblar keshlanadi; eski keshlar avtomatik tozalanadi.
- **Tashqi bog'liqliklar yo'q** (supply-chain xavfi yo'q), `Referrer-Policy: no-referrer`, faqat HTTPS (GitHub Pages).
- **Maxfiy fayllar** (`*.keystore`, imzo parollari, `.env`) `.gitignore` orqali repozitoriyga tushishdan himoyalangan.

## Ma'lum cheklovlar
- GitHub Pages HTTP sarlavhalarini sozlashga ruxsat bermaydi, shuning uchun `frame-ancestors`, `X-Content-Type-Options`
  va `Permissions-Policy` sarlavha sifatida qo'yilmaydi. O'yinda maxfiy amal (to'lov, login) bo'lmagani uchun clickjacking xavfi past.
- O'yin oflayn ishlaydi, shuning uchun tangalar faqat qurilmada saqlanadi va ularni qurilma egasi o'zgartirishi mumkin.
  Bu boshqa foydalanuvchilarga ta'sir qilmaydi (umumiy reyting yo'q).
