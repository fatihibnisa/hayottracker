# Hayot Tracker Pro

Shaxsiy hayotni boshqarish uchun professional ilova — Apple uslubidagi shaffof (glassmorphism) dizayn bilan. Veb ilova sifatida ham, Windows uchun mustaqil (offline) desktop dastur sifatida ham ishlaydi.

## Texnologiyalar

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + React Query
- **Backend:** NestJS + Prisma ORM + class-validator + Swagger
- **Ma'lumotlar bazasi:** SQLite (lokal fayl, hech qanday server o'rnatish shart emas)
- **Desktop:** Electron + electron-builder (Windows uchun .exe o'rnatuvchi)

## Bo'limlar

- **Bosh ekran** — CTA-kartalar, haftalik faollik va ko'nikmalar bo'yicha radar grafigi
- **Kunlik ishlar** — vazifalarni soat bo'yicha rejalashtirish (kun jadvali ko'rinishida)
- **Ta'lim** — dars jadvali (rasmdan avtomatik o'qish), ko'nikmalar (streak, ikonka, maqsad muddati), kunlik/haftalik/oylik rejalar, tarix
- **Moliya** — kirim/chiqim/jamg'arma, balansni yashirish, trend grafigi
- **Diniy amallar** — jonli namoz vaqti taymeri, 5 vaqt namoz holati, Qur'on yodlash (sura/oyat bo'yicha progress), Hadis o'qish va yodlash (sunnah.com havolasi bilan)
- **Profil** — shaxsiy tahlillar, ma'lumotlarni import/eksport, ilova sozlamalari (mavzu, aksent rang, shrift o'lchami, fon rasmi), xavfsizlik (PIN qulf, zaxira nusxa)

## Veb ilova sifatida ishga tushirish

```bash
# backend
cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run start:dev

# frontend (alohida terminalda)
cd frontend
npm install
npm run dev
```

- Ilova: http://localhost:3000
- API: http://localhost:4000/api
- Swagger hujjati: http://localhost:4000/api/docs

## Windows uchun desktop (.exe) qurish

```bash
# 1) backend va frontendni build qilish
cd backend && npm install && npm run build
cd ../frontend && npm install && ELECTRON_BUILD=1 npx next build

# 2) production-only backend node_modules tayyorlash (electron/stage/backend ichida)
#    — electron/package.json dagi extraResources shu papkani kutadi

# 3) electron qobig'ini o'rnatish va o'rnatuvchi (.exe) yig'ish
cd ../electron
npm install
npm run dist
```

Natija: `electron/release/Hayot Tracker Setup <versiya>.exe`

O'rnatilgan dastur barcha ma'lumotlarni foydalanuvchi profilida (`%LocalAppData%`) saqlaydi va internetsiz ishlaydi (namoz vaqtlari va hadis matnini birinchi yuklashdan tashqari).

## Docker Compose bilan (sinovdan o'tkazilmagan)

```bash
docker compose up --build
```
