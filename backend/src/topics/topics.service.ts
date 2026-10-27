import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { MODULE_LABELS } from '../common/constants';
import { CreateTopicDto } from './dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  list(module?: 'data_science' | 'english', status?: 'todo' | 'done') {
    return this.prisma.topic.findMany({
      where: { ...(module && { module }), ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTopicDto) {
    const topic = await this.prisma.topic.create({
      data: { module: dto.module, title: dto.title },
    });
    await this.prisma.todo.create({
      data: {
        title: `[${MODULE_LABELS[dto.module]}] ${dto.title}`,
        period: 'daily',
        dueDate: dayjs().format('YYYY-MM-DD'),
        sourceTopicId: topic.id,
      },
    });
    return topic;
  }

  async setStatus(id: number, status: 'todo' | 'done') {
    const now = status === 'done' ? new Date() : null;
    const topic = await this.prisma.topic.update({
      where: { id },
      data: { status, completedAt: now },
    });
    await this.prisma.todo.updateMany({
      where: { sourceTopicId: id },
      data: { done: status === 'done', completedAt: now },
    });
    return topic;
  }

  async remove(id: number) {
    await this.prisma.topic.delete({ where: { id } });
  }

  async detail(id: number) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) return null;
    const sessions = await this.prisma.topicSession.findMany({ where: { topicId: id }, orderBy: { date: 'asc' } });
    const lastSession = sessions[sessions.length - 1];
    return { ...topic, sessions, lastStudiedAt: lastSession?.date || null };
  }

  addSession(id: number, date: string, minutes: number | undefined, note: string | undefined) {
    return this.prisma.topicSession.create({ data: { topicId: id, date, minutes, note } });
  }

  async removeSession(sessionId: number) {
    await this.prisma.topicSession.delete({ where: { id: sessionId } });
  }
}
