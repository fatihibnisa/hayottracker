import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertDayDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;

  @IsOptional()
  @IsString()
  note?: string;
}
