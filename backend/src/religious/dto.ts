import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PRAYER_NAMES } from '../common/constants';

export class SetPrayerDto {
  @IsIn(['green', 'yellow', 'red'])
  status!: 'green' | 'yellow' | 'red';
}

export class CreateQuranLogDto {
  @IsString()
  reference!: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  matchScore?: number;
}

export class CreateQuranGoalDto {
  @IsString()
  reference!: string;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsOptional()
  @IsString()
  targetDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(114)
  surahNumber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalAyahs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ayahsPerSession?: number;
}

export class AddQuranProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount?: number;
}

export const PRAYER_NAME_LIST = PRAYER_NAMES;
