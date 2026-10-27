import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto';

@ApiTags('finance')
@Controller('api/finance')
export class FinanceController {
  constructor(private finance: FinanceService) {}

  @Get('categories')
  categories() {
    return this.finance.categories();
  }

  @Get('transactions')
  list(
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.list(type, category, from, to);
  }

  @Post('transactions')
  create(@Body() dto: CreateTransactionDto) {
    return this.finance.create(dto);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finance.remove(id);
  }

  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.summary(from, to);
  }

  @Get('trend')
  trend(@Query('days') days?: string) {
    return this.finance.trend(days ? Number(days) : 14);
  }
}
