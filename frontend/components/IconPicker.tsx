'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { SKILL_ICONS, skillIcon } from '@/lib/skill-icons';

export function IconPicker({ value, onChange }: { value: string | null; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const SelectedIcon = skillIcon(value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none transition hover:-translate-y-0.5 focus:border-accent dark:border-white/10 dark:bg-black/20"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
          <SelectedIcon size={14} />
        </span>
        <ChevronDown size={13} className={clsx('text-secondary transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-black/10 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95">
          {SKILL_ICONS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-xl transition hover:scale-110 hover:bg-accent/10',
                value === key && 'bg-accent/15 text-accent',
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
