import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
