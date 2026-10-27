import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

const SEED_COUNT = 500;

const TEXT_EDITIONS: { field: 'textArabic' | 'textRu' | 'textEn'; slug: string }[] = [
  { field: 'textArabic', slug: 'ara-bukhari' },
  { field: 'textRu', slug: 'rus-bukhari' },
  { field: 'textEn', slug: 'eng-bukhari' },
];

interface HadithApiEntry {
  hadithnumber: number;
  text: string;
}
interface HadithApiEdition {
  hadiths: HadithApiEntry[];
}

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let cursor = dayjs();
  if (!set.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day');
    if (!set.has(cursor.format('YYYY-MM-DD'))) return 0;
  }
  let streak = 0;
  while (set.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

@Injectable()
export class HadithService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    const existing = await this.prisma.hadithEntry.count();
    if (existing >= SEED_COUNT) return { seeded: 0, total: existing };
    const toCreate: { number: number; bookName: string; link: string }[] = [];
    for (let n = existing + 1; n <= SEED_COUNT; n++) {
      toCreate.push({ number: n, bookName: 'Sahih al-Bukhari', link: `https://sunnah.com/bukhari:${n}` });
    }
    if (toCreate.length) await this.prisma.hadithEntry.createMany({ data: toCreate });
    const total = await this.prisma.hadithEntry.count();
    return { seeded: toCreate.length, total };
  }

  async list(status?: string, q?: string) {
    const entries = await this.prisma.hadithEntry.findMany({
      where: {
        ...(status && { status }),
        ...(q && { number: Number(q) || -1 }),
      },
      include: { sessions: { select: { date: true } } },
      orderBy: { number: 'asc' },
    });
    return entries.map((e) => ({
      id: e.id,
      number: e.number,
      bookName: e.bookName,
      link: e.link,
      status: e.status,
      memorizedAt: e.memorizedAt,
      streak: computeStreak(e.sessions.map((s) => s.date)),
      sessionsCount: e.sessions.length,
    }));
  }

  async stats() {
    const [total, memorized, reading, all] = await Promise.all([
      this.prisma.hadithEntry.count(),
      this.prisma.hadithEntry.count({ where: { status: 'memorized' } }),
      this.prisma.hadithEntry.count({ where: { status: 'reading' } }),
      this.prisma.hadithEntry.findMany({ include: { sessions: { select: { date: true } } } }),
    ]);
    const topStreak = all.reduce((max, e) => Math.max(max, computeStreak(e.sessions.map((s) => s.date))), 0);
    return { total, memorized, reading, topStreak };
  }

  async detail(id: number) {
    const entry = await this.prisma.hadithEntry.findUnique({ where: { id } });
    if (!entry) return null;
    const sessions = await this.prisma.hadithSession.findMany({ where: { hadithId: id }, orderBy: { date: 'asc' } });
    const dates = sessions.map((s) => s.date);
    return {
      ...entry,
      sessions,
      lastStudiedAt: dates.length ? dates[dates.length - 1] : null,
      streak: computeStreak(dates),
      totalMinutes: sessions.reduce((sum, s) => sum + (s.minutes || 0), 0),
    };
  }

  setStatus(id: number, status: 'new' | 'reading' | 'memorized') {
    return this.prisma.hadithEntry.update({
      where: { id },
      data: { status, memorizedAt: status === 'memorized' ? new Date() : null },
    });
  }

  addSession(id: number, date: string, minutes: number | undefined, note: string | undefined) {
    return this.prisma.hadithSession.create({ data: { hadithId: id, date, minutes, note } });
  }

  async removeSession(sessionId: number) {
    await this.prisma.hadithSession.delete({ where: { id: sessionId } });
  }

  async textStatus() {
    const [total, withText] = await Promise.all([
      this.prisma.hadithEntry.count(),
      this.prisma.hadithEntry.count({ where: { textArabic: { not: null } } }),
    ]);
    return { total, withText };
  }

  async syncText() {
    const editions = await Promise.all(
      TEXT_EDITIONS.map(async ({ field, slug }) => {
        const res = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${slug}.min.json`);
        if (!res.ok) throw new Error(`Hadis manbasiga ulanib bo'lmadi (${slug})`);
        const data = (await res.json()) as HadithApiEdition;
        const map = new Map<number, string>();
        for (const h of data.hadiths) map.set(h.hadithnumber, h.text);
        return { field, map };
      }),
    );

    const entries = await this.prisma.hadithEntry.findMany({ where: { number: { lte: SEED_COUNT } } });
    await this.prisma.$transaction(
      entries.map((e) => {
        const data: Record<string, string | undefined> = {};
        for (const { field, map } of editions) {
          const text = map.get(e.number);
          if (text) data[field] = text;
        }
        return this.prisma.hadithEntry.update({ where: { id: e.id }, data });
      }),
    );

    return this.textStatus();
  }
}
