'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, GraduationCap, Wallet, Moon, FolderCog, User, CalendarClock } from 'lucide-react';
import { useSettings, useT } from '@/lib/settings-context';

const items = [
  { href: '/dashboard', ns: 'nav', key: 'dashboard', icon: LayoutDashboard },
  { href: '/todo', ns: 'nav', key: 'todo', icon: CalendarClock },
  { href: '/education', ns: 'nav', key: 'education', icon: GraduationCap },
  { href: '/finance', ns: 'nav', key: 'finance', icon: Wallet },
  { href: '/religious', ns: 'nav', key: 'religious', icon: Moon },
  { href: '/profile', ns: 'nav', key: 'profile', icon: FolderCog },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const { settings } = useSettings();

  return (
    <aside className="glass-sidebar sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
        <Moon size={19} className="text-accent" fill="currentColor" />
        <span>{t('nav', 'brand')}</span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, ns, key, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-accent text-white shadow-md shadow-accent/30' : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10',
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {t(ns, key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 rounded-xl px-2 py-2">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-accent/15">
          {settings.profileImagePath ? (
            <Image src={settings.profileImagePath} alt="" fill sizes="32px" className="object-cover" />
          ) : (
            <User size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" />
          )}
        </div>
        <span className="truncate text-xs font-medium text-secondary">{settings.profileName || ''}</span>
      </div>
    </aside>
  );
}
