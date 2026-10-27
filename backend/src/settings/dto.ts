import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: string;

  @IsOptional()
  @IsIn(['uz', 'ru', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(['preset', 'custom'])
  backgroundType?: string;

  @IsOptional()
  @IsString()
  backgroundPresetId?: string;

  @IsOptional()
  @IsIn(['transparent', 'opaque'])
  glassOpacity?: string;

  @IsOptional()
  @IsIn(['left', 'center', 'right', 'top', 'bottom'])
  backgroundPosition?: string;

  @IsOptional()
  @IsIn(['blue', 'violet', 'green', 'orange', 'pink', 'teal'])
  accentColor?: string;

  @IsOptional()
  @IsIn(['sm', 'md', 'lg'])
  fontScale?: string;

  @IsOptional()
  @IsString()
  profileName?: string;

  @IsOptional()
  @IsIn(['immediate', '1m', '1h'])
  pinLockTimeout?: string;
}

export class SetPinDto {
  @IsString()
  @Length(4, 8)
  pin!: string;
}

export class VerifyPinDto {
  @IsString()
  pin!: string;
}
