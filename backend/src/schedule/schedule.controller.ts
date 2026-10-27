import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';

@ApiTags('schedule')
@Controller('api/schedule')
export class ScheduleController {
  constructor(private schedule: ScheduleService) {}

  @Get()
  list() {
    return this.schedule.list();
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedule.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScheduleDto) {
    return this.schedule.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedule.remove(id);
  }
}
