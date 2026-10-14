import type { Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

/**
 * Jornada de pagamento do cliente (port de `payments-hub.tsx`).
 *
 * Sequência única e ordenada: rascunho -> aguardando_sinal -> confirmado.
 * O `AgendamentoStatus` canônico é achatado nesses três estágios de jornada,
 * que a UI usa no `JourneyStepper` e para decidir qual bloco (assinatura OTP ou
 * gateway de pagamento) renderizar.
 */
export const JOURNEY_STEPS = ['rascunho', 'aguardando_sinal', 'confirmado'] as const;

export type JourneyStepKey = (typeof JOURNEY_STEPS)[number];

export type JourneyStatus = JourneyStepKey;

export type JourneyStepState = 'done' | 'current' | 'upcoming';

const JOURNEY_BY_STATUS: Record<AgendamentoStatus, JourneyStatus> = {
  pendente: 'rascunho',
  sinal_pago: 'aguardando_sinal',
  confirmado: 'confirmado',
  concluido: 'confirmado',
  cancelado: 'rascunho',
};

/** Achata o status canônico do agendamento no estágio de jornada da cobrança. */
export function resolveJourneyStatus(agendamento: Agendamento): JourneyStatus {
  return JOURNEY_BY_STATUS[agendamento.status];
}

/** Índice do estágio na sequência da jornada (0..2). */
export function journeyIndex(status: JourneyStatus): number {
  return JOURNEY_STEPS.indexOf(status);
}

/** Resolve um marco comparando-o com o índice do estágio corrente. */
export function journeyStepState(index: number, currentIndex: number): JourneyStepState {
  if (index < currentIndex) return 'done';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}
