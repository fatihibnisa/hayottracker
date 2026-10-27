import { Injectable, NotFoundException } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './dto';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  list(period?: 'daily' | 'weekly' | 'monthly', date?: string, done?: boolean) {
    return this.prisma.todo.findMany({
      where: {
        ...(period && { period }),
        ...(date && { dueDate: date }),
        ...(done !== undefined && { done }),
      },
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        title: dto.title,
        period: dto.period || 'daily',
        dueDate: dto.due_date || dayjs().format('YYYY-MM-DD'),
        time: dto.time,
      },
    });
  }

  async update(id: number, dto: UpdateTodoDto) {
    const existing = await this.prisma.todo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Topilmadi');
    const nextDone = dto.done !== undefined ? dto.done : existing.done;
    const completedAt = nextDone ? new Date() : null;

    const updated = await this.prisma.todo.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        period: dto.period ?? existing.period,
        dueDate: dto.due_date ?? existing.dueDate,
        time: dto.time ?? existing.time,
        done: nextDone,
        completedAt,
      },
    });

    if (existing.sourceTopicId) {
      await this.prisma.topic.update({
        where: { id: existing.sourceTopicId },
        data: { status: nextDone ? 'done' : 'todo', completedAt },
      });
    }

    return updated;
  }

  async remove(id: number) {
    await this.prisma.todo.delete({ where: { id } });
  }
}
