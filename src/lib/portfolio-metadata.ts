/**
 * Portfolio metadata — enums canônicos + resolver de labels de domínio.
 *
 * Port de `lib/portfolio-metadata.ts` (web). Os valores dos enums são a
 * linguagem franca entre cliente e backend: NUNCA traduza os valores crus,
 * apenas as chaves `portfolio.*` via `portfolioLabelResolver`.
 */

export const PORTFOLIO_STYLES = [
  'fineLine',
  'realismo',
  'oldSchool',
  'blackwork',
  'minimalista',
  'oriental',
  'geometrico',
  'aquarela',
  'lettering',
  'neoTradicional',
] as const;

export const PORTFOLIO_BODY_PARTS = [
  'braco',
  'antebraco',
  'ombro',
  'peito',
  'costas',
  'costela',
  'perna',
  'coxa',
  'panturrilha',
  'pulso',
  'mao',
  'pescoco',
] as const;

export const PORTFOLIO_SESSION_DURATIONS = [
  'ate1h',
  'h1to2',
  'h2to4',
  'h4to6',
  'fullDay',
  'multiSession',
] as const;

export type PortfolioStyle = (typeof PORTFOLIO_STYLES)[number];
export type PortfolioBodyPart = (typeof PORTFOLIO_BODY_PARTS)[number];
export type PortfolioSessionDuration = (typeof PORTFOLIO_SESSION_DURATIONS)[number];

const STYLE_SET = new Set<string>(PORTFOLIO_STYLES);
const BODY_PART_SET = new Set<string>(PORTFOLIO_BODY_PARTS);
const SESSION_DURATION_SET = new Set<string>(PORTFOLIO_SESSION_DURATIONS);

export function isPortfolioStyle(v: string): v is PortfolioStyle {
  return STYLE_SET.has(v);
}

export function isPortfolioBodyPart(v: string): v is PortfolioBodyPart {
  return BODY_PART_SET.has(v);
}

export function isPortfolioSessionDuration(v: string): v is PortfolioSessionDuration {
  return SESSION_DURATION_SET.has(v);
}

export function resolvePortfolioLocation(input: {
  studioCity?: string | null;
  studioState?: string | null;
  artistCity?: string | null;
  artistState?: string | null;
}): string | null {
  const city = input.studioCity || input.artistCity || null;
  const state = input.studioState || input.artistState || null;
  if (!city && !state) return null;
  if (city && state) return `${city}/${state}`;
  return city || state;
}

/** Fallback contract: unknown enum values fall back to the RAW value. */
export function portfolioLabelResolver(t: (key: string) => string) {
  return {
    styleLabel: (v: string) => (isPortfolioStyle(v) ? t(`portfolio.style.${v}`) : v),
    bodyPartLabel: (v: string) => (isPortfolioBodyPart(v) ? t(`portfolio.body.${v}`) : v),
    sessionDurationLabel: (v: string) =>
      isPortfolioSessionDuration(v) ? t(`portfolio.duration.${v}`) : v,
    healingLabel: (isHealed: boolean) => t(`portfolio.healing.${isHealed ? 'healed' : 'fresh'}`),
  };
}
