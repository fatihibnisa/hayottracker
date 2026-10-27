'use client';

import clsx from 'clsx';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';

export function GlassCard({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('glass animate-fade-in rounded-xl2 p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'accent',
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: 'accent' | 'green' | 'red' | 'violet' | 'blue' | 'orange' | 'teal' | 'yellow' | 'pink';
}) {
  const tones: Record<string, string> = {
    accent: 'bg-accent/15 text-accent',
    green: 'cta-tone-green',
    red: 'cta-tone-red',
    violet: 'cta-tone-violet',
    blue: 'cta-tone-blue',
    orange: 'cta-tone-orange',
    teal: 'cta-tone-teal',
    yellow: 'cta-tone-yellow',
    pink: 'cta-tone-pink',
  };
  return (
    <GlassCard className="animate-pop-in flex flex-col gap-1 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary">{label}</span>
        {icon && <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full', tones[tone])}>{icon}</span>}
      </div>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      {sub && <span className="text-xs text-secondary">{sub}</span>}
    </GlassCard>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <button
      className={clsx(
        'rounded-full px-4 py-2 text-sm font-medium transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        variant === 'primary' && 'bg-accent text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 hover:brightness-110',
        variant === 'secondary' && 'glass hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:hover:bg-white/10',
        variant === 'danger' && 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm outline-none transition focus:border-accent dark:border-white/10 dark:bg-black/20',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm outline-none transition focus:border-accent dark:border-white/10 dark:bg-black/20',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-accent dark:border-white/10 dark:bg-black/20',
        props.className,
      )}
    />
  );
}

export function Pill({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'green' | 'yellow' | 'red' | 'gray' }) {
  const tones: Record<string, string> = {
    green: 'bg-green-500/15 text-green-600',
    yellow: 'bg-yellow-500/15 text-yellow-600',
    red: 'bg-red-500/15 text-red-600',
    gray: 'bg-black/5 text-secondary dark:bg-white/10',
  };
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-secondary">{children}</div>;
}

export function CtaCard({
  icon,
  title,
  sub,
  onClick,
  tone = 'accent',
  badge,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  onClick: () => void;
  tone?: 'accent' | 'green' | 'red' | 'violet' | 'blue' | 'orange' | 'teal' | 'yellow' | 'pink';
  badge?: React.ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    accent: 'bg-accent/15 text-accent',
    green: 'cta-tone-green',
    red: 'cta-tone-red',
    violet: 'cta-tone-violet',
    blue: 'cta-tone-blue',
    orange: 'cta-tone-orange',
    teal: 'cta-tone-teal',
    yellow: 'cta-tone-yellow',
    pink: 'cta-tone-pink',
  };
  return (
    <button
      onClick={onClick}
      className={clsx(
        'glass animate-pop-in group flex w-full items-center gap-4 rounded-xl2 p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]',
        className,
      )}
    >
      <span
        className={clsx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110',
          tones[tone],
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate text-sm font-semibold">{title}</span>
          {badge}
        </span>
        {sub && <span className="block truncate text-xs text-secondary">{sub}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-secondary transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('glass animate-modal-in relative z-10 flex max-h-[85vh] w-full flex-col rounded-xl2 p-6', widths[width])}>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-secondary transition hover:-translate-y-0.5 hover:bg-black/5 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition',
        checked ? 'bg-accent' : 'bg-black/15 dark:bg-white/15',
      )}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
