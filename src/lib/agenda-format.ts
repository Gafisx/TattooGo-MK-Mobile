/**
 * Formatação localizada de datas/horas para a Agenda.
 *
 * Usa `Intl.DateTimeFormat` (Hermes suporta Intl) com campos explícitos para
 * manter compatibilidade ampla entre plataformas/versões, caindo para
 * `toLocaleString` em qualquer ambiente sem dados ICU.
 */
export function formatAgendaDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatAgendaDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}
