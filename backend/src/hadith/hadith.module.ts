import { Module } from '@nestjs/common';
import { HadithController } from './hadith.controller';
import { HadithService } from './hadith.service';

@Module({
  controllers: [HadithController],
  providers: [HadithService],
})
export class HadithModule {}
