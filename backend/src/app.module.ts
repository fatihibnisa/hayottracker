import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DaysModule } from './days/days.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TopicsModule } from './topics/topics.module';
import { TodosModule } from './todos/todos.module';
import { FinanceModule } from './finance/finance.module';
import { ReligiousModule } from './religious/religious.module';
import { ImportExportModule } from './import-export/import-export.module';
import { SettingsModule } from './settings/settings.module';
import { SkillsModule } from './skills/skills.module';
import { BackupModule } from './backup/backup.module';
import { HadithModule } from './hadith/hadith.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DashboardModule,
    DaysModule,
    ScheduleModule,
    TopicsModule,
    TodosModule,
    FinanceModule,
    ReligiousModule,
    ImportExportModule,
    SettingsModule,
    SkillsModule,
    BackupModule,
    HadithModule,
  ],
})
export class AppModule {}
