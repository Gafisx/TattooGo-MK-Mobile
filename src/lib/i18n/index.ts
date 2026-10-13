import { DEFAULT_LOCALE, FALLBACK_LOCALE, type Locale } from './locales';
import { getMessages } from './translations';
import type { MessageKey, Translate } from './types';

const INTERPOLATION = /\{\{\s*(\w+)\s*\}\}/g;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(INTERPOLATION, (_, key: string) => String(vars[key] ?? ''));
}

/**
 * Builds a translator bound to `locale`. Resolution order per key:
 *   1. active locale
 *   2. FALLBACK_LOCALE (`en`)
 *   3. the raw key itself (never an invented value)
 */
export function createTranslator(locale: Locale): Translate {
  const primary = getMessages(locale) ?? getMessages(FALLBACK_LOCALE);
  const fallback = getMessages(FALLBACK_LOCALE);

  return (key: MessageKey, vars?: Record<string, string | number>) => {
    const template = primary[key] ?? fallback[key] ?? key;
    return interpolate(template, vars);
  };
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  return createTranslator(locale)(key, vars);
}

export const defaultTranslator = createTranslator(DEFAULT_LOCALE);
