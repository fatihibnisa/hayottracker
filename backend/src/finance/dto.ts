import { IsIn, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { EXPENSE_CATEGORIES } from '../common/constants';

export class CreateTransactionDto {
  @IsIn(['income', 'expense'])
  type!: 'income' | 'expense';

  @ValidateIf((o) => o.type === 'expense')
  @IsIn(EXPENSE_CATEGORIES as unknown as string[])
  category?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  party?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
