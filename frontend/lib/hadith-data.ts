export interface HadithEntry {
  arabic: string;
  uz: string;
  source: string;
}

export const HADITHS: HadithEntry[] = [
  {
    arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
    uz: "Amallar faqat niyatlarga bog'liqdir.",
    source: 'Buxoriy, Muslim',
  },
  {
    arabic: 'الدِّينُ النَّصِيحَةُ',
    uz: "Din — bu halol nasihat (yaxshilikni tilash)dir.",
    source: 'Muslim',
  },
  {
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    uz: "Birodaring yuziga tabassum qilishing sening uchun sadaqadir.",
    source: 'Termiziy',
  },
  {
    arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    uz: "Musulmon shu kishidirki, boshqa musulmonlar uning tili va qo'lidan omon bo'ladi.",
    source: 'Buxoriy',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    uz: "Sizlarning eng yaxshingiz — Qur'onni o'rganib, boshqalarga o'rgatgan kishidir.",
    source: 'Buxoriy',
  },
  {
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    uz: "Sizlardan biringiz o'zi uchun sevgan narsani birodariga ham sevmagunicha, haqiqiy mo'min bo'lmaydi.",
    source: 'Buxoriy, Muslim',
  },
  {
    arabic: 'مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ',
    uz: "Kishining go'zal musulmonligidan biri — unga foydasiz narsalarni tark etishidir.",
    source: 'Termiziy',
  },
  {
    arabic: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    uz: "Yaxshi so'z — sadaqadir.",
    source: 'Buxoriy, Muslim',
  },
  {
    arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
    uz: "Poklik — imonning yarmidir.",
    source: 'Muslim',
  },
  {
    arabic: 'مَنْ لَا يَرْحَمْ لَا يُرْحَمْ',
    uz: "Kim rahm qilmasa, unga ham rahm qilinmaydi.",
    source: 'Buxoriy, Muslim',
  },
];

export function hadithOfTheDay(date = new Date()): HadithEntry {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return HADITHS[dayOfYear % HADITHS.length];
}
