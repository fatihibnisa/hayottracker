export function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMoney(n: number | null | undefined): string {
  const rounded = Math.round(Number(n || 0));
  const withSeparators = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '-' : ''}${withSeparators} so'm`;
}

export function formatDateUz(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    const [, year, month, day] = match;
    return `${day}.${month}.${year}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export const DAY_NAMES_UZ = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
export const PRAYER_LABELS: Record<string, string> = { bomdod: 'Bomdod', peshin: 'Peshin', asr: 'Asr', shom: 'Shom', hufton: 'Hufton' };
export const EXPENSE_CATEGORIES = ["Ta'lim", 'Oziq-ovqat', 'Ehtiyoj', "Jamg'arma"];
export const MODULE_LABELS: Record<string, string> = { data_science: 'Data Science', english: 'Ingliz tili' };
