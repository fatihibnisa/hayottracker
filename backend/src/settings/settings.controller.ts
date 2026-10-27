import { BadRequestException, Body, Controller, Get, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SetPinDto, UpdateSettingsDto, VerifyPinDto } from './dto';

const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

function imageStorage(prefix: string) {
  return diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const unique = `${prefix}-${Date.now()}${extname(file.originalname) || '.jpg'}`;
      cb(null, unique);
    },
  });
}

const imageFilter = (_req: any, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
  if (!file.mimetype.startsWith('image/')) return cb(new BadRequestException('Faqat rasm fayllari qabul qilinadi'), false);
  cb(null, true);
};

@ApiTags('settings')
@Controller('api/settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }

  @Post('background-image')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage('bg'), fileFilter: imageFilter, limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadBackground(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl yuklanmadi');
    return this.settings.setBackgroundImage(`/uploads/${file.filename}`);
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage('profile'), fileFilter: imageFilter, limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadProfile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl yuklanmadi');
    return this.settings.setProfileImage(`/uploads/${file.filename}`);
  }

  @Post('pin')
  setPin(@Body() dto: SetPinDto) {
    return this.settings.setPin(dto.pin);
  }

  @Post('pin/verify')
  verifyPin(@Body() dto: VerifyPinDto) {
    return this.settings.verifyPin(dto.pin);
  }

  @Post('pin/disable')
  async disablePin(@Body() dto: VerifyPinDto) {
    const { valid } = await this.settings.verifyPin(dto.pin);
    if (!valid) throw new BadRequestException("PIN noto'g'ri");
    return this.settings.disablePin();
  }

  @Post('pin/reset')
  resetPin() {
    return this.settings.disablePin();
  }
}
