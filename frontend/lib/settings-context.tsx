'use client';

import { createContext, useContext, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Lang, translate, DictNamespace } from './i18n';

export interface AppSettings {
  id: number;
  theme: 'light' | 'dark';
  language: Lang;
  city: string;
  country: string;
  backgroundType: 'preset' | 'custom';
  backgroundPresetId: string | null;
  backgroundImagePath: string | null;
  backgroundPosition: 'left' | 'center' | 'right' | 'top' | 'bottom';
  glassOpacity: 'transparent' | 'opaque';
  accentColor: 'blue' | 'violet' | 'green' | 'orange' | 'pink' | 'teal';
  fontScale: 'sm' | 'md' | 'lg';
  profileName: string | null;
  profileImagePath: string | null;
  pinEnabled: boolean;
  pinLockTimeout: 'immediate' | '1m' | '1h';
}

const DEFAULTS: AppSettings = {
  id: 1,
  theme: 'light',
  language: 'uz',
  city: 'Tashkent',
  country: 'Uzbekistan',
  backgroundType: 'preset',
  backgroundPresetId: 'aurora',
  backgroundImagePath: null,
  backgroundPosition: 'center',
  glassOpacity: 'transparent',
  accentColor: 'blue',
  fontScale: 'md',
  profileName: null,
  profileImagePath: null,
  pinEnabled: false,
  pinLockTimeout: 'immediate',
};

const SettingsCtx = createContext<{
  settings: AppSettings;
  update: (partial: Partial<AppSettings>) => void;
  isSaving: boolean;
  loaded: boolean;
}>({ settings: DEFAULTS, update: () => {}, isSaving: false, loaded: false });

export function useSettings() {
  return useContext(SettingsCtx);
}

export function useT() {
  const { settings } = useSettings();
  return (namespace: DictNamespace, key: string) => translate(settings.language, namespace, key);
}

function applyDom(settings: AppSettings) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  document.documentElement.lang = settings.language;
  document.documentElement.dataset.fontScale = settings.fontScale;
  document.body.dataset.glass = settings.glassOpacity;
  document.body.dataset.accent = settings.accentColor;
  document.body.style.setProperty('--bg-position', settings.backgroundPosition || 'center');
  if (settings.backgroundType === 'custom' && settings.backgroundImagePath) {
    document.body.dataset.bg = 'custom';
    document.body.style.backgroundImage = `url(${settings.backgroundImagePath})`;
  } else {
    document.body.dataset.bg = settings.backgroundPresetId || 'aurora';
    document.body.style.backgroundImage = '';
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<AppSettings>('/api/settings'),
  });

  const settings = data || DEFAULTS;

  useEffect(() => {
    applyDom(settings);
  }, [
    settings.theme,
    settings.language,
    settings.glassOpacity,
    settings.backgroundType,
    settings.backgroundPresetId,
    settings.backgroundImagePath,
    settings.backgroundPosition,
    settings.accentColor,
    settings.fontScale,
  ]);

  const mutation = useMutation({
    mutationFn: (partial: Partial<AppSettings>) => api.put<AppSettings>('/api/settings', partial),
    onMutate: async (partial) => {
      await qc.cancelQueries({ queryKey: ['settings'] });
      const previous = qc.getQueryData<AppSettings>(['settings']);
      qc.setQueryData<AppSettings>(['settings'], (old) => ({ ...(old || DEFAULTS), ...partial }));
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['settings'], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <SettingsCtx.Provider value={{ settings, update: mutation.mutate, isSaving: mutation.isPending, loaded: data !== undefined }}>
      {children}
    </SettingsCtx.Provider>
  );
}
