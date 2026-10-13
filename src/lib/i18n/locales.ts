/**
 * Locales suportados pela Galeria de Inspirações (e pelo app).
 *
 * Espelha os 16 locales do web. DEFAULT `pt-BR`, FALLBACK `en`, persistência em
 * AsyncStorage sob a MESMA chave usada pelo web (`tattoogo-locale`).
 */

export const LOCALES = [
  'pt-BR',
  'pt-PT',
  'en',
  'es',
  'fr',
  'de',
  'it',
  'ja',
  'zh',
  'ko',
  'ar',
  'ru',
  'hi',
  'nl',
  'tr',
  'pl',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';
export const FALLBACK_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'tattoogo-locale';

const LOCALE_SET = new Set<string>(LOCALES);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALE_SET.has(value);
}

const LANGUAGE_ALIASES: Record<string, Locale> = {
  pt: 'pt-BR',
  ptbr: 'pt-BR',
  'pt-br': 'pt-BR',
  ptpt: 'pt-PT',
  'pt-pt': 'pt-PT',
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ja: 'ja',
  zh: 'zh',
  ko: 'ko',
  ar: 'ar',
  ru: 'ru',
  hi: 'hi',
  nl: 'nl',
  tr: 'tr',
  pl: 'pl',
};

/** Normalizes device locales (`pt_BR`, `en-US`, `zh-Hans`) to a supported Locale. */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase().replace(/_/g, '-');
  if (isLocale(value)) return value;
  if (LOCALE_SET.has(lower)) return lower as Locale;
  if (lower.startsWith('pt')) return lower.includes('br') ? 'pt-BR' : 'pt-PT';
  if (lower.startsWith('zh')) return 'zh';
  const base = lower.split('-')[0] ?? '';
  return LANGUAGE_ALIASES[base] ?? DEFAULT_LOCALE;
}
