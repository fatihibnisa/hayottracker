import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicDto {
  @IsIn(['data_science', 'english'])
  module!: 'data_science' | 'english';

  @IsString()
  title!: string;
}

export class UpdateTopicStatusDto {
  @IsIn(['todo', 'done'])
  status!: 'todo' | 'done';
}

export class CreateTopicSessionDto {
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
