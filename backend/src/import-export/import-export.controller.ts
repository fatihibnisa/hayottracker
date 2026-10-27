import { BadRequestException, Body, Controller, Get, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import dayjs from 'dayjs';
import { Response } from 'express';
import { ImportExportService, ImportTarget } from './import-export.service';
import { financeToDocx, financeToPdf, financeToXlsx, scheduleToDocx, scheduleToPdf, scheduleToXlsx } from './export-builders';

@ApiTags('import-export')
@Controller('api')
export class ImportExportController {
  constructor(private svc: ImportExportService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(@UploadedFile() file: Express.Multer.File, @Body('target') target: ImportTarget) {
    if (!file) throw new BadRequestException('Fayl yuklanmadi');
    if (!['schedule', 'todos', 'topics'].includes(target)) {
      throw new BadRequestException("target 'schedule', 'todos' yoki 'topics' bo'lishi kerak");
    }
    return this.svc.importFile(target, file.buffer);
  }

  @Get('export/schedule')
  async exportSchedule(@Query('format') format: string = 'xlsx', @Res() res: Response) {
    const rows = await this.svc.scheduleRows();
    if (format === 'xlsx') return scheduleToXlsx(res, rows);
    if (format === 'pdf') return scheduleToPdf(res, rows);
    if (format === 'docx') return scheduleToDocx(res, rows);
    res.status(400).json({ error: "format 'xlsx', 'pdf' yoki 'docx' bo'lishi kerak" });
  }

  @Get('export/finance')
  async exportFinance(
    @Query('format') format: string = 'xlsx',
    @Query('from') fromQ: string | undefined,
    @Query('to') toQ: string | undefined,
    @Res() res: Response,
  ) {
    const from = fromQ || '1970-01-01';
    const to = toQ || dayjs().format('YYYY-MM-DD');
    const rows = await this.svc.financeRows(from, to);
    if (format === 'xlsx') return financeToXlsx(res, rows, from, to);
    if (format === 'pdf') return financeToPdf(res, rows, from, to);
    if (format === 'docx') return financeToDocx(res, rows, from, to);
    res.status(400).json({ error: "format 'xlsx', 'pdf' yoki 'docx' bo'lishi kerak" });
  }
}
