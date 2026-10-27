import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { EXPENSE_CATEGORIES } from '../common/constants';
import { CreateTransactionDto } from './dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  categories() {
    return EXPENSE_CATEGORIES;
  }

  list(type?: 'income' | 'expense', category?: string, from?: string, to?: string) {
    return this.prisma.transaction.findMany({
      where: {
        ...(type && { type }),
        ...(category && { category }),
        ...(from && to && { date: { gte: from, lte: to } }),
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  create(dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        type: dto.type,
        category: dto.type === 'income' ? dto.category || 'Kirim' : dto.category,
        amount: dto.amount,
        party: dto.party,
        reason: dto.reason,
        date: dto.date || dayjs().format('YYYY-MM-DD'),
      },
    });
  }

  async remove(id: number) {
    await this.prisma.transaction.delete({ where: { id } });
  }

  async summary(from?: string, to?: string) {
    const where = from && to ? { date: { gte: from, lte: to } } : {};
    const [incomeAgg, expenseAgg, byCategoryRaw] = await Promise.all([
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...where, type: 'income' } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...where, type: 'expense' } }),
      this.prisma.transaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const income = incomeAgg._sum.amount || 0;
    const expense = expenseAgg._sum.amount || 0;
    const byCategory = byCategoryRaw.map((c) => ({ category: c.category, total: c._sum.amount || 0 }));
    const savings = byCategory.find((c) => c.category === "Jamg'arma")?.total || 0;

    return { income, expense, balance: income - expense, savings, byCategory };
  }

  async trend(days: number) {
    const end = dayjs();
    const from = end.subtract(days - 1, 'day').format('YYYY-MM-DD');
    const to = end.format('YYYY-MM-DD');
    const rows = await this.prisma.transaction.findMany({ where: { date: { gte: from, lte: to } } });

    const series = Array.from({ length: days }, (_, i) => {
      const d = end.subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
      const dayRows = rows.filter((r) => r.date === d);
      return {
        date: d,
        income: dayRows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
        expense: dayRows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      };
    });
    return series;
  }
}
