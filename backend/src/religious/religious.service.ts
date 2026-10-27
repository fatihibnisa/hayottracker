import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { PRAYER_NAMES } from '../common/constants';

type PrayerName = (typeof PRAYER_NAMES)[number];

@Injectable()
export class ReligiousService {
  constructor(private prisma: PrismaService) {}

  async prayersForDate(date: string) {
    const rows = await this.prisma.prayer.findMany({ where: { date } });
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.status]));
    return PRAYER_NAMES.map((name) => ({ name, status: byName[name] || null }));
  }

  setPrayer(date: string, name: PrayerName, status: 'green' | 'yellow' | 'red') {
    return this.prisma.prayer.upsert({
      where: { date_name: { date, name } },
      create: { date, name, status },
      update: { status },
    });
  }

  quranList(from?: string, to?: string) {
    if (from && to) {
      return this.prisma.quranLog.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: 'desc' },
      });
    }
    return this.prisma.quranLog.findMany({ orderBy: { date: 'desc' }, take: 100 });
  }

  createQuranLog(date: string | undefined, reference: string, amount?: string, matchScore?: number) {
    return this.prisma.quranLog.create({
      data: { date: date || dayjs().format('YYYY-MM-DD'), reference, amount, matchScore },
    });
  }

  async removeQuranLog(id: number) {
    await this.prisma.quranLog.delete({ where: { id } });
  }

  updateQuranLogScore(id: number, matchScore: number) {
    return this.prisma.quranLog.update({ where: { id }, data: { matchScore } });
  }

  async prayerTimes(date: string, city: string, country: string) {
    const [year, month, day] = date.split('-');
    const url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(
      city,
    )}&country=${encodeURIComponent(country)}&method=3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Namoz vaqtlarini olishning imkoni bo'lmadi");
    const data = (await res.json()) as any;
    const t = data?.data?.timings;
    if (!t) throw new Error("Namoz vaqtlari topilmadi");
    return {
      date,
      city,
      country,
      fajr: t.Fajr,
      sunrise: t.Sunrise,
      dhuhr: t.Dhuhr,
      asr: t.Asr,
      maghrib: t.Maghrib,
      isha: t.Isha,
    };
  }

  // Quran memorization goals
  quranGoals() {
    return this.prisma.quranGoal.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createQuranGoal(
    reference: string,
    referenceText: string | undefined,
    targetDate: string | undefined,
    surahNumber?: number,
    totalAyahs?: number,
    ayahsPerSession?: number,
  ) {
    return this.prisma.quranGoal.create({
      data: { reference, referenceText, targetDate, surahNumber, totalAyahs, ayahsPerSession: ayahsPerSession || 5 },
    });
  }

  achieveQuranGoal(id: number) {
    return this.prisma.quranGoal.update({
      where: { id },
      data: { achieved: true, achievedAt: new Date() },
    });
  }

  async addQuranGoalProgress(id: number, amount?: number) {
    const goal = await this.prisma.quranGoal.findUniqueOrThrow({ where: { id } });
    const step = amount || goal.ayahsPerSession || 5;
    const memorizedAyahs = goal.totalAyahs ? Math.min(goal.totalAyahs, goal.memorizedAyahs + step) : goal.memorizedAyahs + step;
    const reachedGoal = goal.totalAyahs != null && memorizedAyahs >= goal.totalAyahs;
    return this.prisma.quranGoal.update({
      where: { id },
      data: {
        memorizedAyahs,
        achieved: reachedGoal ? true : goal.achieved,
        achievedAt: reachedGoal && !goal.achieved ? new Date() : goal.achievedAt,
      },
    });
  }

  async removeQuranGoal(id: number) {
    await this.prisma.quranGoal.delete({ where: { id } });
  }
}
