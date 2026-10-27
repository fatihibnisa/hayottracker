import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { BackupService } from './backup.service';

@ApiTags('backup')
@Controller('api/backup')
export class BackupController {
  constructor(private backup: BackupService) {}

  @Get('export')
  async export(@Res() res: Response) {
    const payload = await this.backup.exportAll();
    const filename = `hayot-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(payload, null, 2));
  }

  @Post('import')
  import(@Body() payload: any) {
    return this.backup.importAll(payload);
  }
}
