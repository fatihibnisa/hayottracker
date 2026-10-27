import { Module } from '@nestjs/common';
import { ReligiousController } from './religious.controller';
import { ReligiousService } from './religious.service';

@Module({
  controllers: [ReligiousController],
  providers: [ReligiousService],
  exports: [ReligiousService],
})
export class ReligiousModule {}
