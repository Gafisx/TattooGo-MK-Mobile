import type { Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

/**
 * Motor de estados da Timeline do cliente (port TypeScript puro de
 * `buildSessionTimeline` / `resolveStepState` / `depositAmount` do web).
 *
 * Regra de negócio:
 *  - Todo agendamento tem 3 marcos ordenados: sinal -> confirmação -> sessão.
 *  - O sinal corresponde a 25% do valor total (`DEPOSIT_RATE`).
 *  - O progresso é o percentual de marcos concluídos, nos degraus 33% / 66% /
 *    100%. `TIMELINE_MILESTONES` expõe esses degraus para a UI desenhar as
 *    marcações da barra de progresso.
 */

/** Fração do total cobrada como sinal para reservar a data. */
export const DEPOSIT_RATE = 0.25;

/** Marcos da sessão, na ordem cronológica. */
export const SESSION_STEP_KEYS = ['sinal', 'confirmacao', 'sessao'] as const;

export type SessionStepKey = (typeof SESSION_STEP_KEYS)[number];

export type TimelineStepState = 'done' | 'current' | 'upcoming';

/** Degraus de progresso após concluir cada marco. */
export const TIMELINE_MILESTONES = [33, 66, 100] as const;

/**
 * Índice do marco "em andamento" para cada status. `concluido` aponta para além
 * do último marco (todos done). `cancelado` é resolvido em runtime a partir do
 * sinal pago, pois o status sozinho não diz até onde o fluxo avançou.
 */
const CURRENT_STEP_INDEX_BY_STATUS: Record<AgendamentoStatus, number> = {
  pendente: 0,
  sinal_pago: 1,
  confirmado: 2,
  concluido: SESSION_STEP_KEYS.length,
  cancelado: 0,
};

export interface SessionTimelineStep {
  key: SessionStepKey;
  index: number;
  state: TimelineStepState;
  labelKey: string;
  descriptionKey: string;
}

export interface SessionTimeline {
  steps: SessionTimelineStep[];
  currentIndex: number;
  completedCount: number;
  /** 0 | 33 | 66 | 100 (floor dos marcos concluídos). */
  progress: number;
  milestones: readonly number[];
  cancelled: boolean;
}

/**
 * Sinal de 25% do total, em centavos inteiros. Rejeita valores inválidos para
 * espelhar `splitPayment()` em `lib/finance.ts`.
 */
export function depositAmount(totalCents: number): number {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new RangeError('totalCents must be a non-negative integer of cents');
  }
  return Math.round(totalCents * DEPOSIT_RATE);
}

/** Resolve o estado de um marco comparando-o com o marco "em andamento". */
export function resolveStepState(
  stepIndex: number,
  currentIndex: number,
  total: number,
): TimelineStepState {
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex && currentIndex < total) return 'current';
  return 'upcoming';
}

function resolveCurrentIndex(agendamento: Agendamento): number {
  if (agendamento.status === 'cancelado') {
    return agendamento.depositPaidCents > 0 ? 1 : 0;
  }
  return CURRENT_STEP_INDEX_BY_STATUS[agendamento.status];
}

/**
 * Constrói os marcos da timeline de um agendamento, já com estado resolvido,
 * contagem de concluídos e progresso (33 / 66 / 100).
 */
export function buildSessionTimeline(agendamento: Agendamento): SessionTimeline {
  const total = SESSION_STEP_KEYS.length;
  const cancelled = agendamento.status === 'cancelado';
  const currentIndex = resolveCurrentIndex(agendamento);

  const steps: SessionTimelineStep[] = SESSION_STEP_KEYS.map((key, index) => ({
    key,
    index,
    state: resolveStepState(index, currentIndex, total),
    labelKey: `agenda.step.${key}`,
    descriptionKey: `agenda.step.${key}.description`,
  }));

  const completedCount = steps.filter((step) => step.state === 'done').length;
  const progress = Math.floor((completedCount / total) * 100);

  return {
    steps,
    currentIndex,
    completedCount,
    progress,
    milestones: TIMELINE_MILESTONES,
    cancelled,
  };
}
