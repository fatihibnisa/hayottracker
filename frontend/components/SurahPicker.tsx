'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, Search } from 'lucide-react';
import { SURAHS } from '@/lib/quran-data';

export function SurahPicker({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  ayahUnit,
}: {
  value: number | null;
  onChange: (n: number) => void;
  placeholder: string;
  searchPlaceholder: string;
  ayahUnit: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = SURAHS.find((s) => s.number === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter((s) => s.nameUz.toLowerCase().includes(q) || String(s.number) === q || s.nameArabic.includes(query.trim()));
  }, [query]);

  return (
    <div ref={ref} className="relative min-w-[240px] flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm outline-none transition focus:border-accent dark:border-white/10 dark:bg-black/20"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">{selected.number}</span>
            <span className="truncate font-medium">{selected.nameUz}</span>
            <span dir="rtl" className="shrink-0 text-secondary">
              {selected.nameArabic}
            </span>
          </span>
        ) : (
          <span className="text-secondary">{placeholder}</span>
        )}
        <ChevronDown size={14} className={clsx('shrink-0 text-secondary transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95">
          <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/10">
            <Search size={14} className="shrink-0 text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <div className="px-4 py-3 text-xs text-secondary">—</div>}
            {filtered.map((s) => (
              <button
                type="button"
                key={s.number}
                onClick={() => {
                  onChange(s.number);
                  setOpen(false);
                  setQuery('');
                }}
                className={clsx(
                  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-accent/10',
                  value === s.number && 'bg-accent/10',
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-[10px] font-semibold text-secondary dark:bg-white/10">
                  {s.number}
                </span>
                <span className="flex-1 truncate">{s.nameUz}</span>
                <span dir="rtl" className="shrink-0 truncate text-base text-secondary">
                  {s.nameArabic}
                </span>
                <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-secondary dark:bg-white/10">
                  {s.ayahCount} {ayahUnit}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
