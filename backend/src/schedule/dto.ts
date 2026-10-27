import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week!: number;

  @IsString()
  subject!: string;

  @IsString()
  start_time!: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  room?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  room?: string;
}
