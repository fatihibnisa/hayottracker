import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto';

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
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    const skills = await this.prisma.skill.findMany({ orderBy: { createdAt: 'desc' }, include: { sessions: true } });
    return skills.map((s) => {
      const dates = s.sessions.map((sess) => sess.date);
      const lastSession = [...dates].sort().pop();
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        icon: s.icon,
        description: s.description,
        targetDate: s.targetDate,
        planMinutes: s.planMinutes,
        createdAt: s.createdAt,
        sessionsCount: s.sessions.length,
        totalMinutes: s.sessions.reduce((sum, sess) => sum + (sess.minutes || 0), 0),
        streak: computeStreak(dates),
        lastStudiedAt: lastSession || null,
      };
    });
  }

  create(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name,
        category: dto.category,
        icon: dto.icon,
        description: dto.description,
        targetDate: dto.targetDate,
        planMinutes: dto.planMinutes,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.skill.delete({ where: { id } });
  }

  async detail(id: number) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) return null;
    const sessions = await this.prisma.skillSession.findMany({ where: { skillId: id }, orderBy: { date: 'asc' } });
    const dates = sessions.map((s) => s.date);
    return {
      ...skill,
      sessions,
      lastStudiedAt: dates.length ? dates[dates.length - 1] : null,
      streak: computeStreak(dates),
      totalMinutes: sessions.reduce((sum, s) => sum + (s.minutes || 0), 0),
    };
  }

  addSession(id: number, date: string, minutes: number | undefined, note: string | undefined) {
    return this.prisma.skillSession.create({ data: { skillId: id, date, minutes, note } });
  }

  async removeSession(sessionId: number) {
    await this.prisma.skillSession.delete({ where: { id: sessionId } });
  }
}
