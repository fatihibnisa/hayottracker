import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DaysService {
  constructor(private prisma: PrismaService) {}

  async get(date: string) {
    const day = await this.prisma.day.findUnique({ where: { date } });
    return day || { date, rating: null, note: '' };
  }

  async upsert(date: string, rating: number | null, note: string) {
    return this.prisma.day.upsert({
      where: { date },
      create: { date, rating, note },
      update: { rating, note },
    });
  }

  async list(from?: string, to?: string) {
    if (from && to) {
      return this.prisma.day.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      });
    }
    return this.prisma.day.findMany({ orderBy: { date: 'desc' }, take: 60 });
  }
}
