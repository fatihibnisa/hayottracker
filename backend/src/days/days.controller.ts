import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DaysService } from './days.service';
import { UpsertDayDto } from './dto';

@ApiTags('days')
@Controller('api/days')
export class DaysController {
  constructor(private days: DaysService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.days.list(from, to);
  }

  @Get(':date')
  get(@Param('date') date: string) {
    return this.days.get(date);
  }

  @Put(':date')
  upsert(@Param('date') date: string, @Body() body: UpsertDayDto) {
    return this.days.upsert(date, body.rating ?? null, body.note ?? '');
  }
}
