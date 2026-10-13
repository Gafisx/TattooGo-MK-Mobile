/**
 * Agendamentos + Timeline — contratos canônicos.
 *
 * Port de `lib/types/agenda.ts` (web / Next.js) consumidos por
 * `AgendaPaymentsWorkspace` e `ClientTimelineTracker`. Não invente campos: a
 * API `GET /api/agendamentos` devolve exatamente este shape em `items`.
 */

export type AgendamentoStatus =
  | 'pendente'
  | 'sinal_pago'
  | 'confirmado'
  | 'concluido'
  | 'cancelado';

export type AgendaArtist = {
  id: string;
  name: string;
  avatarUrl: string | null;
  initial: string;
  studioName: string | null;
};

export type Agendamento = {
  id: string;
  artista: AgendaArtist;
  /** Valor canônico do enum `portfolio.style.*` (nunca traduzido). */
  estilo: string;
  /** Valor canônico do enum `portfolio.body.*` (nunca traduzido). */
  bodyPart: string;
  /** Valor canônico do enum `portfolio.duration.*` (nunca traduzido). */
  sessionDuration: string;
  scheduledAt: string;
  createdAt: string;
  status: AgendamentoStatus;
  totalCents: number;
  /** Quanto do sinal (25%) já foi efetivamente pago, em centavos. */
  depositPaidCents: number;
};

export type PaymentStatus = 'pendente' | 'pago' | 'reembolsado';

export type AgendaPayment = {
  id: string;
  agendamentoId: string;
  /** 'deposit' (25%) ou 'balance' (75% restantes). */
  kind: 'deposit' | 'balance';
  amountCents: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};
