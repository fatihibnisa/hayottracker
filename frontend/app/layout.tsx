import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ToastProvider } from '@/components/Toast';
import { Sidebar } from '@/components/Sidebar';
import { PinGate } from '@/components/PinGate';
import { NotificationBell } from '@/components/NotificationBell';
import { SettingsProvider } from '@/lib/settings-context';

export const metadata: Metadata = {
  title: 'Hayot Tracker',
  description: "Shaxsiy hayotni boshqarish uchun professional ilova",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-font-scale="md">
      <body className="font-sans" data-bg="aurora" data-glass="transparent" data-accent="blue">
        <Providers>
          <SettingsProvider>
            <ToastProvider>
              <PinGate>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <main className="relative flex-1 overflow-y-auto p-8">
                    <div className="fixed right-8 top-6 z-30">
                      <NotificationBell />
                    </div>
                    <div className="mx-auto max-w-5xl">{children}</div>
                  </main>
                </div>
              </PinGate>
            </ToastProvider>
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  );
}
