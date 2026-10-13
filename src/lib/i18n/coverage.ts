import { LOCALES, type Locale } from './locales';
import { getMessages } from './translations';

/**
 * Keys the Galeria de Inspirações expects in EVERY locale. `verifyI18nCoverage()`
 * is a dev guard used by tests/tooling to catch partially translated locales.
 */
export const REQUIRED_UI_KEYS = [
  'gallery.title',
  'gallery.subtitle',
  'gallery.explore',
  'gallery.style',
  'gallery.bodyPart',
  'gallery.healing',
  'gallery.all',
  'gallery.allStyles',
  'gallery.allParts',
  'gallery.allHealing',
  'gallery.fresh',
  'gallery.healed',
  'gallery.closeFilter',
  'gallery.clearFilters',
  'gallery.loadError',
  'gallery.loadErrorHint',
  'gallery.emptyFiltered',
  'gallery.empty',
  'gallery.emptyFilteredHint',
  'gallery.emptyHint',
  'welcome.artistFallback',
  'studio.fallback',
  'vitrine.independent',
  'chat.openVitrine',
  'galeria.startConversation',
  'aria.like',
  'aria.unlike',
] as const;

export const REQUIRED_DOMAIN_KEYS = [
  'portfolio.style.fineLine',
  'portfolio.style.realismo',
  'portfolio.style.oldSchool',
  'portfolio.style.blackwork',
  'portfolio.style.minimalista',
  'portfolio.style.oriental',
  'portfolio.style.geometrico',
  'portfolio.style.aquarela',
  'portfolio.style.lettering',
  'portfolio.style.neoTradicional',
  'portfolio.body.braco',
  'portfolio.body.antebraco',
  'portfolio.body.ombro',
  'portfolio.body.peito',
  'portfolio.body.costas',
  'portfolio.body.costela',
  'portfolio.body.perna',
  'portfolio.body.coxa',
  'portfolio.body.panturrilha',
  'portfolio.body.pulso',
  'portfolio.body.mao',
  'portfolio.body.pescoco',
  'portfolio.duration.ate1h',
  'portfolio.duration.h1to2',
  'portfolio.duration.h2to4',
  'portfolio.duration.h4to6',
  'portfolio.duration.fullDay',
  'portfolio.duration.multiSession',
  'portfolio.healing.healed',
  'portfolio.healing.fresh',
] as const;

/** Keys the client Agenda/Timeline expects in EVERY locale. */
export const REQUIRED_AGENDA_KEYS = [
  'agenda.title',
  'agenda.subtitle',
  'agenda.tab.schedule',
  'agenda.tab.payments',
  'agenda.progress',
  'agenda.deposit',
  'agenda.total',
  'agenda.scheduledFor',
  'agenda.expand',
  'agenda.collapse',
  'agenda.empty.title',
  'agenda.empty.description',
  'agenda.empty.cta',
  'agenda.payments.empty.title',
  'agenda.payments.empty.description',
  'agenda.cancelled',
  'agenda.loadError',
  'agenda.loadErrorHint',
  'agenda.status.pendente',
  'agenda.status.sinal_pago',
  'agenda.status.confirmado',
  'agenda.status.concluido',
  'agenda.status.cancelado',
  'agenda.step.sinal',
  'agenda.step.sinal.description',
  'agenda.step.confirmacao',
  'agenda.step.confirmacao.description',
  'agenda.step.sessao',
  'agenda.step.sessao.description',
  'agenda.payment.deposit',
  'agenda.payment.balance',
  'agenda.payment.status.pendente',
  'agenda.payment.status.pago',
  'agenda.payment.status.reembolsado',
] as const;

export const REQUIRED_KEYS = [
  ...REQUIRED_UI_KEYS,
  ...REQUIRED_DOMAIN_KEYS,
  ...REQUIRED_AGENDA_KEYS,
];

export interface CoverageReport {
  locale: Locale;
  missing: string[];
}

export function verifyI18nCoverage(): CoverageReport[] {
  return LOCALES.map((locale) => {
    const messages = getMessages(locale);
    const missing = REQUIRED_KEYS.filter((key) => !(key in messages));
    return { locale, missing };
  });
}
