import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSkillDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  planMinutes?: number;
}

export class CreateSkillSessionDto {
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
