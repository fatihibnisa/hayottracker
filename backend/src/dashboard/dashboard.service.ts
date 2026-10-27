import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { PRAYER_NAMES } from '../common/constants';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async get(date?: string) {
    const d = date || dayjs().format('YYYY-MM-DD');

    const [incomeAgg, expenseAgg, todosToday, prayerRows, quranToday, day, topicsStatsRaw, doneTopics] = await Promise.all([
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'income' } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'expense' } }),
      this.prisma.todo.findMany({ where: { dueDate: d } }),
      this.prisma.prayer.findMany({ where: { date: d } }),
      this.prisma.quranLog.findMany({ where: { date: d } }),
      this.prisma.day.findUnique({ where: { date: d } }),
      this.prisma.topic.groupBy({ by: ['module'], _count: { _all: true } }),
      this.prisma.topic.groupBy({ by: ['module'], where: { status: 'done' }, _count: { _all: true } }),
    ]);

    const income = incomeAgg._sum.amount || 0;
    const expense = expenseAgg._sum.amount || 0;
    const todosDone = todosToday.filter((t) => t.done).length;

    const byName = Object.fromEntries(prayerRows.map((r) => [r.name, r.status]));
    const prayers = PRAYER_NAMES.map((name) => ({ name, status: byName[name] || null }));
    const prayersDone = prayers.filter((p) => p.status === 'green').length;

    const topicsStats = topicsStatsRaw.map((t) => ({
      module: t.module,
      total: t._count._all,
      done: doneTopics.find((d2) => d2.module === t.module)?._count._all || 0,
    }));

    return {
      date: d,
      balance: income - expense,
      income,
      expense,
      todos: { done: todosDone, total: todosToday.length, items: todosToday },
      prayers: { done: prayersDone, total: PRAYER_NAMES.length, items: prayers },
      quran: quranToday,
      day: day || { date: d, rating: null, note: '' },
      topicsStats,
    };
  }

  async week(date?: string) {
    const end = dayjs(date || undefined);
    const days = Array.from({ length: 7 }, (_, i) => end.subtract(6 - i, 'day').format('YYYY-MM-DD'));
    const from = days[0];
    const to = days[days.length - 1];

    const [todos, prayers] = await Promise.all([
      this.prisma.todo.findMany({ where: { dueDate: { gte: from, lte: to } } }),
      this.prisma.prayer.findMany({ where: { date: { gte: from, lte: to } } }),
    ]);

    return days.map((d) => {
      const dayTodos = todos.filter((t) => t.dueDate === d);
      const dayPrayers = prayers.filter((p) => p.date === d);
      return {
        date: d,
        tasksDone: dayTodos.filter((t) => t.done).length,
        tasksTotal: dayTodos.length,
        prayersDone: dayPrayers.filter((p) => p.status === 'green').length,
        prayersTotal: 5,
      };
    });
  }
}
