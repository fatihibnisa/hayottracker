import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VERSION = 1;

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async exportAll() {
    const [days, schedule, topics, todos, transactions, prayers, quranLog, quranGoals, topicSessions, skills, skillSessions, settings] =
      await Promise.all([
        this.prisma.day.findMany(),
        this.prisma.scheduleItem.findMany(),
        this.prisma.topic.findMany(),
        this.prisma.todo.findMany(),
        this.prisma.transaction.findMany(),
        this.prisma.prayer.findMany(),
        this.prisma.quranLog.findMany(),
        this.prisma.quranGoal.findMany(),
        this.prisma.topicSession.findMany(),
        this.prisma.skill.findMany(),
        this.prisma.skillSession.findMany(),
        this.prisma.settings.findMany(),
      ]);
    return {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      data: { days, schedule, topics, todos, transactions, prayers, quranLog, quranGoals, topicSessions, skills, skillSessions, settings },
    };
  }

  async importAll(payload: any) {
    const data = payload?.data;
    if (!data) throw new Error("Zaxira fayli noto'g'ri formatda");

    await this.prisma.$transaction([
      this.prisma.todo.deleteMany(),
      this.prisma.topicSession.deleteMany(),
      this.prisma.topic.deleteMany(),
      this.prisma.scheduleItem.deleteMany(),
      this.prisma.transaction.deleteMany(),
      this.prisma.prayer.deleteMany(),
      this.prisma.quranLog.deleteMany(),
      this.prisma.quranGoal.deleteMany(),
      this.prisma.skillSession.deleteMany(),
      this.prisma.skill.deleteMany(),
      this.prisma.day.deleteMany(),
    ]);

    if (data.days?.length) await this.prisma.day.createMany({ data: data.days });
    if (data.schedule?.length) await this.prisma.scheduleItem.createMany({ data: data.schedule });
    if (data.topics?.length) await this.prisma.topic.createMany({ data: data.topics });
    if (data.todos?.length) await this.prisma.todo.createMany({ data: data.todos });
    if (data.transactions?.length) await this.prisma.transaction.createMany({ data: data.transactions });
    if (data.prayers?.length) await this.prisma.prayer.createMany({ data: data.prayers });
    if (data.quranLog?.length) await this.prisma.quranLog.createMany({ data: data.quranLog });
    if (data.quranGoals?.length) await this.prisma.quranGoal.createMany({ data: data.quranGoals });
    if (data.skills?.length) await this.prisma.skill.createMany({ data: data.skills });
    if (data.skillSessions?.length) await this.prisma.skillSession.createMany({ data: data.skillSessions });
    if (data.topicSessions?.length) await this.prisma.topicSession.createMany({ data: data.topicSessions });

    if (data.settings?.length) {
      const s = data.settings[0];
      await this.prisma.settings.upsert({
        where: { id: 1 },
        create: { ...s, id: 1 },
        update: s,
      });
    }

    return { restored: true };
  }
}
