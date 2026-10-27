import * as XLSX from 'xlsx';
import { DAY_NAMES } from '../common/constants';

export function normalizeKey(k: unknown): string {
  return String(k ?? '').trim().toLowerCase();
}

export function findValue(row: Record<string, unknown>, keys: string[]): unknown {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(row)) normalized[normalizeKey(key)] = row[key];
  for (const k of keys) {
    if (normalized[k] !== undefined && normalized[k] !== '') return normalized[k];
  }
  return undefined;
}

export function parseWorkbook(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

export function dayNameToIndex(value: unknown): number | null {
  if (value === undefined || value === '') return null;
  if (typeof value === 'number') return Math.max(0, Math.min(6, value - 1));
  const s = String(value).trim().toLowerCase();
  const idx = DAY_NAMES.findIndex((d) => d.toLowerCase() === s);
  return idx >= 0 ? idx : null;
}
