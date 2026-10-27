import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HadithService } from './hadith.service';
import { CreateHadithSessionDto, UpdateHadithStatusDto } from './dto';

@ApiTags('hadith')
@Controller('api/hadith')
export class HadithController {
  constructor(private hadith: HadithService) {}

  @Post('seed')
  seed() {
    return this.hadith.seed();
  }

  @Get()
  list(@Query('status') status?: string, @Query('q') q?: string) {
    return this.hadith.list(status, q);
  }

  @Get('stats')
  stats() {
    return this.hadith.stats();
  }

  @Get('text-status')
  textStatus() {
    return this.hadith.textStatus();
  }

  @Post('sync-text')
  syncText() {
    return this.hadith.syncText();
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.hadith.detail(id);
  }

  @Put(':id/status')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHadithStatusDto) {
    return this.hadith.setStatus(id, dto.status);
  }

  @Post(':id/sessions')
  addSession(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateHadithSessionDto) {
    return this.hadith.addSession(id, dto.date, dto.minutes, dto.note);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  removeSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.hadith.removeSession(sessionId);
  }
}
