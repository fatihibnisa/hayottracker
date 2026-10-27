import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto';

const DEFAULTS = {
  id: 1,
  theme: 'light',
  language: 'uz',
  city: 'Tashkent',
  country: 'Uzbekistan',
  backgroundType: 'preset',
  backgroundPresetId: 'aurora',
  backgroundImagePath: null as string | null,
  glassOpacity: 'transparent',
  profileName: null as string | null,
  profileImagePath: null as string | null,
  pinEnabled: false,
  pinHash: null as string | null,
};

function hashPin(pin: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPinHash(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return check.length === expected.length && timingSafeEqual(check, expected);
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async getRaw() {
    const existing = await this.prisma.settings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.settings.create({ data: DEFAULTS });
  }

  async get() {
    const { pinHash, ...rest } = await this.getRaw();
    return rest;
  }

  async update(dto: UpdateSettingsDto) {
    await this.getRaw();
    const { pinHash, ...rest } = await this.prisma.settings.update({ where: { id: 1 }, data: dto });
    return rest;
  }

  async setBackgroundImage(path: string) {
    await this.getRaw();
    const { pinHash, ...rest } = await this.prisma.settings.update({
      where: { id: 1 },
      data: { backgroundType: 'custom', backgroundImagePath: path },
    });
    return rest;
  }

  async setProfileImage(path: string) {
    await this.getRaw();
    const { pinHash, ...rest } = await this.prisma.settings.update({ where: { id: 1 }, data: { profileImagePath: path } });
    return rest;
  }

  async setPin(pin: string) {
    await this.getRaw();
    const { pinHash, ...rest } = await this.prisma.settings.update({
      where: { id: 1 },
      data: { pinEnabled: true, pinHash: hashPin(pin) },
    });
    return rest;
  }

  async disablePin() {
    await this.getRaw();
    const { pinHash, ...rest } = await this.prisma.settings.update({
      where: { id: 1 },
      data: { pinEnabled: false, pinHash: null },
    });
    return rest;
  }

  async verifyPin(pin: string) {
    const settings = await this.getRaw();
    if (!settings.pinEnabled || !settings.pinHash) return { valid: true };
    return { valid: verifyPinHash(pin, settings.pinHash) };
  }
}
