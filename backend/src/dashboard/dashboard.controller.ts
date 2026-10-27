import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  get(@Query('date') date?: string) {
    return this.dashboard.get(date);
  }

  @Get('week')
  week(@Query('date') date?: string) {
    return this.dashboard.week(date);
  }
}
