import type { Agendamento } from '@/lib/types/agenda';

/**
 * Agrupamento da agenda do estúdio (port da lógica `groupStudioRoster` da Web).
 *
 * Separa as sessões do tatuador/estúdio em:
 *  - `today`    -> sessões do dia corrente (calendário local).
 *  - `upcoming` -> sessões a partir de amanhã, em ordem cronológica.
 *  - `past`     -> sessões anteriores a hoje (histórico).
 *
 * A função é pura e recebe `now` para ser determinística em testes.
 */

export interface StudioRoster {
  today: Agendamento[];
  upcoming: Agendamento[];
  past: Agendamento[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function byScheduledAt(a: Agendamento, b: Agendamento): number {
  return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
}

export function groupStudioRoster(
  agendamentos: Agendamento[],
  now: Date = new Date(),
): StudioRoster {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = todayStart + DAY_MS;

  const today: Agendamento[] = [];
  const upcoming: Agendamento[] = [];
  const past: Agendamento[] = [];

  for (const agendamento of agendamentos) {
    const scheduled = Date.parse(agendamento.scheduledAt);
    if (Number.isNaN(scheduled)) continue;

    if (scheduled >= todayStart && scheduled < tomorrowStart) {
      today.push(agendamento);
    } else if (scheduled >= tomorrowStart) {
      upcoming.push(agendamento);
    } else {
      past.push(agendamento);
    }
  }

  return {
    today: today.sort(byScheduledAt),
    upcoming: upcoming.sort(byScheduledAt),
    past: past.sort(byScheduledAt).reverse(),
  };
}
