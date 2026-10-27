import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHadithStatusDto {
  @IsIn(['new', 'reading', 'memorized'])
  status!: 'new' | 'reading' | 'memorized';
}

export class CreateHadithSessionDto {
  @IsString()
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
