import { BadRequestException, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { MODULE_LABELS } from '../common/constants';
import { dayNameToIndex, findValue, parseWorkbook } from './helpers';

export type ImportTarget = 'schedule' | 'todos' | 'topics';

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  async importFile(target: ImportTarget, buffer: Buffer) {
    let rows: Record<string, unknown>[];
    try {
      rows = parseWorkbook(buffer);
    } catch (e) {
      throw new BadRequestException(`Faylni o'qib bo'lmadi: ${(e as Error).message}`);
    }

    let imported = 0;
    let skipped = 0;
    const now = new Date();

    if (target === 'schedule') {
      for (const row of rows) {
        const dayRaw = findValue(row, ['kun', 'day', 'hafta kuni']);
        const subject = findValue(row, ['fan', 'subject', 'dars', 'fan nomi']);
        const start = findValue(row, ['boshlanish', 'start', 'vaqt', 'boshlanish vaqti']);
        const end = findValue(row, ['tugash', 'end', 'tugash vaqti']);
        const room = findValue(row, ['xona', 'room', 'auditoriya']);
        const dayIdx = dayNameToIndex(dayRaw);
        if (dayIdx === null || !subject || !start) {
          skipped++;
          continue;
        }
        await this.prisma.scheduleItem.create({
          data: {
            dayOfWeek: dayIdx,
            subject: String(subject),
            startTime: String(start),
            endTime: end ? String(end) : null,
            room: room ? String(room) : null,
          },
        });
        imported++;
      }
    }

    if (target === 'todos') {
      for (const row of rows) {
        const title = findValue(row, ['nomi', 'vazifa', 'title', 'ish']);
        let period = String(findValue(row, ['turi', 'period', 'davriyligi']) || 'daily').toLowerCase();
        const dueRaw = findValue(row, ['muddat', 'sana', 'due_date', 'tugash sanasi']);
        const timeRaw = findValue(row, ['soat', 'vaqt', 'time']);
        if (!title) {
          skipped++;
          continue;
        }
        if (!['daily', 'weekly', 'monthly'].includes(period)) period = 'daily';
        let due = dayjs().format('YYYY-MM-DD');
        if (dueRaw) {
          const parsed = dayjs(dueRaw as string);
          if (parsed.isValid()) due = parsed.format('YYYY-MM-DD');
        }
        let time: string | null = null;
        if (timeRaw) {
          const m = /^(\d{1,2}):(\d{2})/.exec(String(timeRaw).trim());
          if (m) time = `${m[1].padStart(2, '0')}:${m[2]}`;
        }
        await this.prisma.todo.create({
          data: { title: String(title), period: period as any, dueDate: due, time },
        });
        imported++;
      }
    }

    if (target === 'topics') {
      for (const row of rows) {
        const moduleRaw = String(findValue(row, ['modul', 'module', "yo'nalish"]) || '').toLowerCase();
        const title = findValue(row, ['mavzu', 'title', 'nomi']);
        let module: 'data_science' | 'english' | null = null;
        if (moduleRaw.includes('ingliz') || moduleRaw.includes('english')) module = 'english';
        else if (moduleRaw.includes('data')) module = 'data_science';
        if (!title || !module) {
          skipped++;
          continue;
        }
        const topic = await this.prisma.topic.create({
          data: { module, title: String(title) },
        });
        await this.prisma.todo.create({
          data: {
            title: `[${MODULE_LABELS[module]}] ${title}`,
            period: 'daily',
            dueDate: dayjs().format('YYYY-MM-DD'),
            sourceTopicId: topic.id,
          },
        });
        imported++;
      }
    }

    return { imported, skippedCount: skipped, totalRows: rows.length };
  }

  scheduleRows() {
    return this.prisma.scheduleItem.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  }

  financeRows(from: string, to: string) {
    return this.prisma.transaction.findMany({ where: { date: { gte: from, lte: to } }, orderBy: { date: 'asc' } });
  }
}
