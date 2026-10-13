import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { createTranslator } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { i18nStore } from '@/lib/i18n/store';

/**
 * i18n hook used by the Galeria (and any screen). Two-layer contract:
 * UI strings via `t('gallery.*')`; domain labels via `portfolioLabelResolver(t)`.
 */
export function useI18n() {
  const locale = useSyncExternalStore(
    i18nStore.subscribe,
    i18nStore.getLocale,
    i18nStore.getLocale,
  );
  const t = useMemo(() => createTranslator(locale), [locale]);
  const setLocale = useCallback((next: Locale) => i18nStore.setLocale(next), []);

  return { t, locale, setLocale };
}
