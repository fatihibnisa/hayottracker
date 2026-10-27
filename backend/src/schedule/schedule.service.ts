import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.scheduleItem.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  create(dto: CreateScheduleDto) {
    return this.prisma.scheduleItem.create({
      data: {
        dayOfWeek: dto.day_of_week,
        subject: dto.subject,
        startTime: dto.start_time,
        endTime: dto.end_time,
        room: dto.room,
      },
    });
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const existing = await this.prisma.scheduleItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Topilmadi');
    return this.prisma.scheduleItem.update({
      where: { id },
      data: {
        dayOfWeek: dto.day_of_week ?? existing.dayOfWeek,
        subject: dto.subject ?? existing.subject,
        startTime: dto.start_time ?? existing.startTime,
        endTime: dto.end_time ?? existing.endTime,
        room: dto.room ?? existing.room,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.scheduleItem.delete({ where: { id } });
  }
}
