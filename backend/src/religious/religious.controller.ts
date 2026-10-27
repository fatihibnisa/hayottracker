import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReligiousService } from './religious.service';
import { AddQuranProgressDto, CreateQuranGoalDto, CreateQuranLogDto, SetPrayerDto } from './dto';
import { PRAYER_NAMES } from '../common/constants';

type PrayerName = (typeof PRAYER_NAMES)[number];

@ApiTags('religious')
@Controller('api/religious')
export class ReligiousController {
  constructor(private religious: ReligiousService) {}

  @Get('prayers/:date')
  prayers(@Param('date') date: string) {
    return this.religious.prayersForDate(date);
  }

  @Put('prayers/:date/:name')
  setPrayer(@Param('date') date: string, @Param('name') name: PrayerName, @Body() dto: SetPrayerDto) {
    return this.religious.setPrayer(date, name, dto.status);
  }

  @Get('quran')
  quranList(@Query('from') from?: string, @Query('to') to?: string) {
    return this.religious.quranList(from, to);
  }

  @Post('quran')
  createQuranLog(@Body() dto: CreateQuranLogDto) {
    return this.religious.createQuranLog(dto.date, dto.reference, dto.amount, dto.matchScore);
  }

  @Delete('quran/:id')
  @HttpCode(204)
  removeQuranLog(@Param('id', ParseIntPipe) id: number) {
    return this.religious.removeQuranLog(id);
  }

  @Get('prayer-times')
  prayerTimes(@Query('date') date: string, @Query('city') city: string, @Query('country') country: string) {
    return this.religious.prayerTimes(date, city, country);
  }

  @Get('quran-goals')
  quranGoals() {
    return this.religious.quranGoals();
  }

  @Post('quran-goals')
  createQuranGoal(@Body() dto: CreateQuranGoalDto) {
    return this.religious.createQuranGoal(dto.reference, dto.referenceText, dto.targetDate, dto.surahNumber, dto.totalAyahs, dto.ayahsPerSession);
  }

  @Put('quran-goals/:id/achieve')
  achieveQuranGoal(@Param('id', ParseIntPipe) id: number) {
    return this.religious.achieveQuranGoal(id);
  }

  @Post('quran-goals/:id/progress')
  addQuranGoalProgress(@Param('id', ParseIntPipe) id: number, @Body() dto: AddQuranProgressDto) {
    return this.religious.addQuranGoalProgress(id, dto.amount);
  }

  @Delete('quran-goals/:id')
  @HttpCode(204)
  removeQuranGoal(@Param('id', ParseIntPipe) id: number) {
    return this.religious.removeQuranGoal(id);
  }
}
